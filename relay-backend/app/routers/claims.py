from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Claim, Evidence, Source, SourceRecord
from ..schemas import ClaimOut, EvidenceOut, ReviewRequest, ReviewResult
from ..services.review import apply_review
from .projects import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}/claims", tags=["claims"])


def _evidence_out(db: Session, ev: Evidence) -> EvidenceOut:
    record = db.get(SourceRecord, ev.record_id)
    source = db.get(Source, record.source_id) if record else None
    return EvidenceOut(
        id=ev.id,
        source_kind=source.kind if source else "unknown",
        source_name=source.name if source else "Unknown",
        source_identifier=source.identifier if source else "",
        record_id=record.external_id if record else "",
        timestamp=record.timestamp if record else None,
        author=record.author if record else None,
        excerpt=ev.excerpt,
        url=record.url if record else None,
        stance=ev.stance,
    )


def claim_out(db: Session, claim: Claim) -> ClaimOut:
    supporting = [_evidence_out(db, e) for e in claim.evidence if e.stance == "supporting"]
    contradicting = [_evidence_out(db, e) for e in claim.evidence if e.stance == "contradicting"]
    return ClaimOut(
        id=claim.id, statement=claim.statement, category=claim.category,
        trust_label=claim.trust_label, review_status=claim.review_status,
        related_identifier=claim.related_identifier,
        supporting_count=len(supporting), contradicting_count=len(contradicting),
        supporting=supporting, contradicting=contradicting,
        verification_note=claim.verification_note, reviewer_comment=claim.reviewer_comment,
        corrected_statement=claim.corrected_statement, last_reviewed_at=claim.last_reviewed_at,
        reviewed_by=claim.reviewed_by,
    )


@router.get("", response_model=list[ClaimOut])
def list_claims(project_id: str, db: Session = Depends(get_db)) -> list[ClaimOut]:
    get_project_or_404(db, project_id)
    claims = db.query(Claim).filter_by(project_id=project_id).order_by(Claim.created_at).all()
    return [claim_out(db, c) for c in claims]


@router.post("/{claim_id}/review", response_model=ReviewResult)
def review(project_id: str, claim_id: str, payload: ReviewRequest,
           db: Session = Depends(get_db)) -> ReviewResult:
    get_project_or_404(db, project_id)
    claim = apply_review(db, project_id, claim_id, payload.action, payload.reviewer,
                         payload.corrected_statement, payload.comment)
    return ReviewResult(claim=claim_out(db, claim), trust_label=claim.trust_label,
                        review_status=claim.review_status)