from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..schemas import ReconstructionOut
from ..services.reconstruction import run_reconstruction
from .projects import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}/reconstruction", tags=["reconstruction"])


def _to_out(project) -> ReconstructionOut:
    return ReconstructionOut(
        stage=project.reconstruction_stage, progress_percent=project.reconstruction_progress,
        started_at=project.reconstruction_started_at, completed_at=project.reconstruction_completed_at,
        error_message=project.reconstruction_error)


@router.get("", response_model=ReconstructionOut)
def get_status(project_id: str, db: Session = Depends(get_db)) -> ReconstructionOut:
    return _to_out(get_project_or_404(db, project_id))


@router.post("", response_model=ReconstructionOut)
async def start(project_id: str, db: Session = Depends(get_db)) -> ReconstructionOut:
    project = get_project_or_404(db, project_id)
    project = await run_reconstruction(db, project, get_settings())
    return _to_out(project)