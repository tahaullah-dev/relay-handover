from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Claim, Handover, Project, Source
from ..schemas import ProjectOut, ReconstructionOut

router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)) -> ProjectOut:
    project = get_project_or_404(db, project_id)
    claims = db.query(Claim).filter_by(project_id=project_id).all()
    return ProjectOut(
        id=project.id, name=project.name, description=project.description,
        repository_url=project.repository_url, departing_person=project.departing_person,
        incoming_person=project.incoming_person, created_at=project.created_at,
        updated_at=project.updated_at,
        sources_count=db.query(Source).filter_by(project_id=project_id).count(),
        claims_count=len(claims),
        verified_count=sum(1 for c in claims if c.trust_label == "verified"),
        conflicting_count=sum(1 for c in claims if c.trust_label == "conflicting"),
        unresolved_count=sum(1 for c in claims if c.category == "unresolved-question"),
        approved_handovers_count=db.query(Handover).filter(
            Handover.project_id == project_id, Handover.approved_at.isnot(None)).count(),
        reconstruction=ReconstructionOut(
            stage=project.reconstruction_stage, progress_percent=project.reconstruction_progress,
            started_at=project.reconstruction_started_at, completed_at=project.reconstruction_completed_at,
            error_message=project.reconstruction_error),
    )