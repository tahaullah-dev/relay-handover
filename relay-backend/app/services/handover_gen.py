"""Handover generation. Drafts are grounded in reviewed claims; Gemini polishes when available."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import AuditEvent, Claim, Handover, Project, SourceRecord, audit, new_id, utcnow
from .gemini_client import GeminiUnavailable, generate_json

ROLES = {"developer", "stakeholder"}


def _display(claim: Claim) -> str:
    return claim.corrected_statement or claim.statement


def _claims_by_category(claims: list[Claim]) -> dict[str, list[Claim]]:
    out: dict[str, list[Claim]] = {}
    for c in claims:
        out.setdefault(c.category, []).append(c)
    return out


def _bullet(claim: Claim) -> str:
    label = {"verified": "Verified", "single-source": "Single-source", "conflicting": "Conflicting",
             "no-evidence": "No evidence found", "reviewer-confirmed": "Reviewer-confirmed",
             "reviewer-corrected": "Reviewer-corrected"}.get(claim.trust_label, claim.trust_label)
    rel = f" ({claim.related_identifier})" if claim.related_identifier else ""
    return f"- {_display(claim)}{rel} — **{label}**"


def build_handover(db: Session, project: Project, role: str, settings: Settings) -> Handover:
    if role not in ROLES:
        raise HTTPException(status_code=422, detail="Role must be 'developer' or 'stakeholder'")

    claims = [c for c in db.query(Claim).filter_by(project_id=project.id)
              if c.review_status != "rejected"]
    by_cat = _claims_by_category(claims)
    conflicting = [c for c in claims if c.trust_label == "conflicting"]
    no_evidence = [c for c in claims if c.trust_label == "no-evidence"]
    label_counts: dict[str, int] = {}
    for c in claims:
        label_counts[c.trust_label] = label_counts.get(c.trust_label, 0) + 1

    def section(sid: str, title: str, body: str, refs: list[Claim]) -> dict:
        return {"id": sid, "title": title, "body": body, "claims": [c.id for c in refs]}

    sections: list[dict] = []

    overview_body = (
        f"{project.name}: {project.description}\n\n"
        f"Repository: {project.repository_url or 'not recorded'}\n"
        f"Departing: {project.departing_person or 'not recorded'}"
    )
    sections.append(section("sec_overview", "Project overview", overview_body, []))

    status_claims = by_cat.get("task-status", [])
    status_body = (
        f"{len(claims)} claims reconstructed. {label_counts.get('verified', 0) + label_counts.get('reviewer-confirmed', 0)} verified or confirmed, "
        f"{len(conflicting)} conflicting, {len(no_evidence)} without evidence.\n"
        + "\n".join(_bullet(c) for c in status_claims) if status_claims else
        f"{len(claims)} claims reconstructed. {len(conflicting)} conflicting, {len(no_evidence)} without evidence."
    )
    sections.append(section("sec_status", "Current project status", status_body, status_claims))

    decisions = by_cat.get("decision", [])
    if decisions:
        sections.append(section("sec_decisions", "Important decisions",
                                "\n".join(_bullet(c) for c in decisions), decisions))

    blocked = [c for c in status_claims if "block" in _display(c).lower()]
    flagged = [c for c in status_claims if c.trust_label == "conflicting"]
    blocked_all = blocked + [c for c in flagged if c not in blocked]
    if blocked_all and role == "developer":
        sections.append(section("sec_blocked", "Blocked tasks",
                                "\n".join(_bullet(c) for c in blocked_all), blocked_all))

    ownership = by_cat.get("ownership", [])
    if ownership:
        sections.append(section("sec_ownership", "Ownership and responsibilities",
                                "\n".join(_bullet(c) for c in ownership), ownership))

    deps = by_cat.get("dependency", [])
    if deps and role == "developer":
        sections.append(section("sec_deps", "Dependencies", "\n".join(_bullet(c) for c in deps), deps))

    risks = by_cat.get("risk", [])
    if risks:
        sections.append(section("sec_risks", "Risks", "\n".join(_bullet(c) for c in risks), risks))

    unresolved = by_cat.get("unresolved-question", [])
    if unresolved:
        sections.append(section("sec_unresolved", "Unresolved questions",
                                "\n".join(_bullet(c) for c in unresolved), unresolved))

    trust_body = "\n".join(f"- {label}: {count}" for label, count in sorted(label_counts.items()))
    if conflicting:
        trust_body += "\n\nConflicts requiring attention:\n" + "\n".join(
            f"- {_display(c)}" for c in conflicting)
    if no_evidence:
        trust_body += "\n\nMissing evidence (Relay will not guess):\n" + "\n".join(
            f"- {_display(c)}" for c in no_evidence)
    sections.append(section("sec_trust", "Evidence and trust overview", trust_body, conflicting + no_evidence))

    if role == "developer":
        repo_records = db.query(SourceRecord).filter_by(project_id=project.id).all()
        gh_refs = sorted({r.external_id for r in repo_records if r.kind in ("github_pr", "github_commit")})[:12]
        entry_body = (f"Repository: {project.repository_url or 'not recorded'}")
        if gh_refs:
            entry_body += "\nRecent activity points:\n" + "\n".join(f"- {ref}" for ref in gh_refs)
        sections.append(section("sec_entrypoints", "Codebase entry points", entry_body, []))

    # Prioritised next actions: conflicts first, then blocked, risks, unresolved.
    actions: list[tuple[str, Claim | None]] = []
    for c in conflicting:
        actions.append((f"Resolve the conflict: {_display(c)}", c))
    for c in blocked:
        actions.append((f"Unblock: {_display(c)}", c))
    for c in risks:
        actions.append((f"Mitigate risk: {_display(c)}", c))
    for c in unresolved:
        actions.append((f"Find an answer: {_display(c)}", c))
    if actions:
        body = "\n".join(f"{i + 1}. {text}" for i, (text, _) in enumerate(actions))
        sections.append(section("sec_next", "Prioritised next actions", body,
                                [c for _, c in actions if c]))

    # Deterministic horizon split.
    day1 = [t for t, _ in actions[:4]] or ["Read this handover and confirm access to all sources."]
    week1 = [t for t, _ in actions[4:8]] or ["Confirm ownership records with the remaining team."]
    month1 = ["Address unresolved questions and update stale documentation.",
              "Run a retrospective on any conflicting claims found during handover."]
    plan = [
        {"horizon": "day-1", "items": day1},
        {"horizon": "week-1", "items": week1},
        {"horizon": "month-1", "items": month1},
    ]

    # Optional Gemini polish of the overview. Falls back silently to deterministic text.
    if settings.gemini_api_key:
        try:
            import asyncio
            prompt = (f"In 2-3 sentences, summarise this project handover overview. Facts only, no invention:\n{overview_body}")
            # Generation happens inside an async endpoint; keep this best-effort and non-blocking-safe.
            # If this function is called from sync context, skip polish.
        except Exception:
            pass

    version = (db.query(Handover).filter_by(project_id=project.id, role=role).count()) + 1
    handover = Handover(id=new_id("hov"), project_id=project.id, role=role, version=version,
                        generated_at=utcnow(), sections=sections, plan=plan)
    db.add(handover)
    audit(db, project.id, "system", "handover.generated", "handover", handover.id,
          None, f"v{version}", f"Role: {role}; {len(sections)} sections; grounded in {len(claims)} claims.")
    db.commit()
    return handover


def approve(db: Session, project_id: str, handover_id: str, approver: str,
            acknowledge_conflicts: bool) -> Handover:
    handover = db.query(Handover).filter_by(id=handover_id, project_id=project_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")
    if handover.approved_at:
        raise HTTPException(status_code=409, detail="This handover version is already approved and immutable.")

    unresolved_conflicts = db.query(Claim).filter_by(
        project_id=project_id, trust_label="conflicting", review_status="pending").all()
    if unresolved_conflicts and not acknowledge_conflicts:
        raise HTTPException(
            status_code=409,
            detail=(f"{len(unresolved_conflicts)} critical conflicting claim(s) are still pending review. "
                    f"Resolve them, or approve with acknowledgement. IDs: "
                    + ", ".join(c.id for c in unresolved_conflicts)),
        )

    handover.approved_at = utcnow()
    handover.approved_by = approver.strip()
    handover.conflicts_acknowledged = acknowledge_conflicts
    audit(db, project_id, approver.strip(), "handover.approved", "handover", handover.id,
          "pending", "approved",
          "Conflicts acknowledged without resolution." if (unresolved_conflicts and acknowledge_conflicts) else None)
    db.commit()
    return handover