"""Persistent human review. Human testimony is stored separately from source evidence."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import AuditEvent, Claim, ClaimReview, audit, new_id, utcnow

VALID_ACTIONS = {"confirm", "correct", "reject", "needs-evidence"}


def apply_review(db: Session, project_id: str, claim_id: str, action: str,
                 reviewer: str, corrected_statement: str | None, comment: str | None) -> Claim:
    if action not in VALID_ACTIONS:
        raise HTTPException(status_code=422, detail=f"Unsupported review action: {action}")

    claim = db.query(Claim).filter_by(id=claim_id, project_id=project_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if not reviewer.strip():
        raise HTTPException(status_code=422, detail="Reviewer name is required")
    if action == "correct" and not (corrected_statement or "").strip():
        raise HTTPException(status_code=422, detail="A corrected statement is required")

    previous_status = claim.review_status

    if action == "confirm":
        claim.review_status = "confirmed"
        if claim.trust_label != "reviewer-corrected":
            claim.trust_label = "reviewer-confirmed"
        audit_action = "claim.confirmed"
    elif action == "correct":
        claim.review_status = "corrected"
        claim.trust_label = "reviewer-corrected"
        claim.corrected_statement = corrected_statement.strip()
        audit_action = "claim.corrected"
    elif action == "reject":
        claim.review_status = "rejected"
        audit_action = "claim.rejected"
    else:  # needs-evidence
        claim.review_status = "needs-evidence"
        audit_action = "claim.needs-evidence"

    claim.reviewer_comment = comment.strip() if comment else claim.reviewer_comment
    claim.reviewed_by = reviewer.strip()
    claim.last_reviewed_at = utcnow()
    claim.updated_at = utcnow()

    db.add(ClaimReview(
        id=new_id("rev"),
        claim_id=claim.id, action=action, previous_status=previous_status,
        new_status=claim.review_status, corrected_statement=claim.corrected_statement,
        comment=comment, reviewer=reviewer.strip(),
    ))
    audit(db, project_id, reviewer.strip(), audit_action, "claim", claim.id,
          previous_status, claim.review_status, comment)
    db.commit()
    return claim