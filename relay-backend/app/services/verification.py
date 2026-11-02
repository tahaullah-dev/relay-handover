"""Deterministic evidence verification and rule-based consistency checks.

This service never trusts AI output: Gemini extracts, this module verifies.
"""
from collections import Counter

from sqlalchemy.orm import Session

from ..models import Claim, Evidence, SourceRecord, new_id, utcnow
from .linking import prs_for_jira_key

DONE_STATUSES = {"done", "closed", "resolved", "complete", "completed"}
FOLLOWUP_KEYWORDS = ("waiting", "confirm", "double-check", "re-check", "reopen", "not sure", "can you check")


def normalize(text: str) -> str:
    return " ".join((text or "").split()).lower()


def quote_matches(excerpt: str, content: str) -> bool:
    """Exact-quote verification: the excerpt must appear verbatim (whitespace-normalised)."""
    return normalize(excerpt) in normalize(content)


def _excerpt(text: str, limit: int = 300) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"


def _upsert_rule_claim(db: Session, project_id: str, dedupe_key: str, statement: str,
                         category: str, related: str | None, note: str) -> Claim:
    claim = db.query(Claim).filter_by(project_id=project_id, dedupe_key=dedupe_key).first()
    if claim:
        if claim.review_status == "pending":  # never clobber a human-reviewed claim
            claim.statement = statement
            claim.verification_note = note
            claim.updated_at = utcnow()
        return claim
    claim = Claim(id=new_id("clm"), project_id=project_id, statement=statement,
                  category=category, related_identifier=related, verification_note=note,
                  origin="rule", dedupe_key=dedupe_key)
    db.add(claim)
    db.flush()
    return claim


def _set_evidence(db: Session, claim: Claim, items: list[tuple[SourceRecord, str, str]]) -> None:
    # Safely clear the collection. SQLAlchemy's delete-orphan cascade handles DB deletion.
    claim.evidence.clear()
    
    # Add new evidence directly to the collection
    for record, stance, excerpt in items:
        ev = Evidence(id=new_id("ev"), claim_id=claim.id, record_id=record.id,
                      stance=stance, excerpt=excerpt)
        claim.evidence.append(ev)
        
    db.flush()


def rule_done_but_unmerged(db: Session, project_id: str) -> list[Claim]:
    """Mandatory check: Jira issue marked Done while its linked GitHub PR remains unmerged."""
    created: list[Claim] = []
    jira_issues = [r for r in db.query(SourceRecord).filter_by(project_id=project_id, kind="jira_issue")]
    for issue in jira_issues:
        status = str((issue.meta or {}).get("status", "")).lower()
        if status not in DONE_STATUSES:
            continue
        for pr in prs_for_jira_key(db, project_id, issue.external_id):
            if (pr.meta or {}).get("merged"):
                continue
            claim = _upsert_rule_claim(
                db, project_id,
                dedupe_key=f"done_unmerged:{issue.external_id}:{pr.external_id}",
                statement=(f'{issue.external_id} is marked "{(issue.meta or {}).get("status")}" in Jira, '
                           f"but linked {pr.external_id} has not been merged."),
                category="task-status", related=issue.external_id,
                note=("Rule-based consistency check: the Jira issue is marked Done while the linked "
                      "GitHub pull request remains unmerged. These two sources disagree about completion."),
            )
            _set_evidence(db, claim, [
                (issue, "supporting", _excerpt(issue.content)),
                (pr, "contradicting", _excerpt(pr.content)),
            ])
            created.append(claim)
    return created


def rule_closed_with_pending_followup(db: Session, project_id: str) -> list[Claim]:
    created: list[Claim] = []
    for issue in db.query(SourceRecord).filter_by(project_id=project_id, kind="jira_issue"):
        status = str((issue.meta or {}).get("status", "")).lower()
        if status not in DONE_STATUSES:
            continue
        comments = (issue.meta or {}).get("comments") or []
        if not comments:
            continue
        last = comments[-1]
        body = str(last.get("body", ""))
        if any(k in body.lower() for k in FOLLOWUP_KEYWORDS):
            claim = _upsert_rule_claim(
                db, project_id,
                dedupe_key=f"closed_followup:{issue.external_id}",
                statement=(f'{issue.external_id} is closed, but a later comment from '
                           f'{last.get("author", "someone")} still asks for confirmation.'),
                category="task-status", related=issue.external_id,
                note="Rule-based check: the ticket is closed but the most recent comment raises an unresolved concern.",
            )
            _set_evidence(db, claim, [
                (issue, "supporting", _excerpt(issue.content.split("\n\n")[0])),
                (issue, "contradicting", _excerpt(body)),
            ])
            created.append(claim)
    return created


def rule_orphan_pull_requests(db: Session, project_id: str) -> list[Claim]:
    created: list[Claim] = []
    for pr in db.query(SourceRecord).filter_by(project_id=project_id, kind="github_pr"):
        if (pr.meta or {}).get("merged"):
            continue
        if (pr.meta or {}).get("jira_keys"):
            continue
        claim = _upsert_rule_claim(
            db, project_id,
            dedupe_key=f"orphan_pr:{pr.external_id}",
            statement=f'{pr.external_id} "{pr.title}" is open but references no ticket.',
            category="risk", related=pr.external_id,
            note="Rule-based check: unmerged pull request with no Jira key in its title, body, or branch name.",
        )
        _set_evidence(db, claim, [(pr, "supporting", _excerpt(pr.content))])
        created.append(claim)
    return created


def rule_knowledge_concentration(db: Session, project_id: str) -> list[Claim]:
    created: list[Claim] = []
    commits = [c for c in db.query(SourceRecord).filter_by(project_id=project_id, kind="github_commit")
               if c.author]
    if len(commits) < 8:
        return created
    counts = Counter(c.author for c in commits)
    author, n = counts.most_common(1)[0]
    if n / len(commits) >= 0.7:
        claim = _upsert_rule_claim(
            db, project_id,
            dedupe_key=f"concentration:{author}",
            statement=(f"Knowledge concentration risk: {author} authored {n} of {len(commits)} commits "
                       f"({round(100 * n / len(commits))}%) in the imported history."),
            category="risk", related=None,
            note="Rule-based check: a single author dominates the commit history of the imported repository.",
        )
        _set_evidence(db, claim, [(commits[0], "supporting", _excerpt(commits[0].content))])
        created.append(claim)
    return created


def run_rules(db: Session, project_id: str) -> list[Claim]:
    claims: list[Claim] = []
    claims += rule_done_but_unmerged(db, project_id)
    claims += rule_closed_with_pending_followup(db, project_id)
    claims += rule_orphan_pull_requests(db, project_id)
    claims += rule_knowledge_concentration(db, project_id)
    db.flush()
    return claims


def verify_claim_quotes(db: Session, claim: Claim) -> None:
    """Drop any evidence whose excerpt does not match the original record text exactly."""
    to_remove = []
    for ev in claim.evidence:
        record = db.get(SourceRecord, ev.record_id)
        if record is None or not quote_matches(ev.excerpt, record.content):
            to_remove.append(ev)
            
    # Remove from collection; delete-orphan cascade handles the DB deletion
    for ev in to_remove:
        claim.evidence.remove(ev)
        
    db.flush()


def compute_trust(claim: Claim) -> None:
    """Assign a trust label from evidence counts. Human review labels are never overwritten."""
    if claim.review_status in ("confirmed", "corrected"):
        return
    supporting = [e for e in claim.evidence if e.stance == "supporting"]
    contradicting = [e for e in claim.evidence if e.stance == "contradicting"]
    if contradicting and supporting:
        claim.trust_label = "conflicting"
    elif len(supporting) >= 2:
        claim.trust_label = "verified"
    elif len(supporting) == 1:
        claim.trust_label = "single-source"
    else:
        claim.trust_label = "no-evidence"


def recompute_all(db: Session, project_id: str) -> None:
    for claim in db.query(Claim).filter_by(project_id=project_id):
        verify_claim_quotes(db, claim)
        compute_trust(claim)
    db.flush()