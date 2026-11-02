from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Handover
from ..schemas import ApproveRequest, GenerateHandoverRequest, HandoverOut
from ..services.handover_gen import approve, build_handover
from .projects import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}/handover", tags=["handover"])


def _to_out(h: Handover) -> HandoverOut:
    return HandoverOut(id=h.id, version=h.version, role=h.role, approved_at=h.approved_at,
                       approved_by=h.approved_by, sections=h.sections, plan=h.plan,
                       generated_at=h.generated_at)


def _latest(db: Session, project_id: str, role: str) -> Handover | None:
    return (db.query(Handover).filter_by(project_id=project_id, role=role)
            .order_by(Handover.version.desc()).first())


@router.get("", response_model=HandoverOut)
def get_handover(project_id: str, role: str = Query("developer"),
                 db: Session = Depends(get_db)) -> HandoverOut:
    get_project_or_404(db, project_id)
    handover = _latest(db, project_id, role)
    if not handover:
        raise HTTPException(status_code=404, detail="No handover generated yet for this role")
    return _to_out(handover)


@router.post("", response_model=HandoverOut)
def generate(project_id: str, payload: GenerateHandoverRequest,
             db: Session = Depends(get_db)) -> HandoverOut:
    project = get_project_or_404(db, project_id)
    handover = build_handover(db, project, payload.role, get_settings())
    return _to_out(handover)


@router.post("/{handover_id}/approve", response_model=HandoverOut)
def approve_handover(project_id: str, handover_id: str, payload: ApproveRequest,
                     db: Session = Depends(get_db)) -> HandoverOut:
    get_project_or_404(db, project_id)
    handover = approve(db, project_id, handover_id, payload.approver, payload.acknowledge_conflicts)
    return _to_out(handover)