"""Deterministic cross-source linking via explicit Jira key identifiers."""
import re

from sqlalchemy.orm import Session

from ..models import SourceRecord

JIRA_KEY_RE = re.compile(r"\b([A-Z][A-Z0-9]{1,9}-\d+)\b")


def find_jira_keys(text: str | None) -> set[str]:
    if not text:
        return set()
    return set(JIRA_KEY_RE.findall(text))


def link_records(db: Session, project_id: str) -> int:
    """Annotate every github record's meta with the Jira keys it references.

    Keys are matched in PR/issue titles, bodies, and commit messages, plus branch names.
    Explicit identifier matching only — no inferred relationships.
    """
    updated = 0
    records = db.query(SourceRecord).filter_by(project_id=project_id).all()
    for rec in records:
        if rec.kind not in ("github_pr", "github_issue", "github_commit"):
            continue
        haystack = " ".join(filter(None, [rec.title, rec.content, (rec.meta or {}).get("head_ref"),
                                          (rec.meta or {}).get("body")]))
        keys = sorted(find_jira_keys(haystack))
        meta = dict(rec.meta or {})
        if meta.get("jira_keys") != keys:
            meta["jira_keys"] = keys
            rec.meta = meta
            updated += 1
    db.flush()
    return updated


def prs_for_jira_key(db: Session, project_id: str, key: str) -> list[SourceRecord]:
    """GitHub PRs that explicitly reference the given Jira key."""
    out = []
    prs = db.query(SourceRecord).filter_by(project_id=project_id, kind="github_pr").all()
    for pr in prs:
        if key in (pr.meta or {}).get("jira_keys", []):
            out.append(pr)
    return out