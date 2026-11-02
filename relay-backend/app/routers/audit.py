from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditEvent
from ..schemas import AuditOut
from .projects import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}/audit", tags=["audit"])


@router.get("", response_model=list[AuditOut])
def list_audit(project_id: str, db: Session = Depends(get_db)) -> list[AuditOut]:
    get_project_or_404(db, project_id)
    events = (db.query(AuditEvent).filter_by(project_id=project_id)
              .order_by(AuditEvent.timestamp.desc()).all())
    return [AuditOut(id=e.id, timestamp=e.timestamp, actor=e.actor, action=e.action,
                     entity_type=e.entity_type, entity_id=e.entity_id,
                     previous_state=e.previous_state, new_state=e.new_state, note=e.note)
            for e in events]