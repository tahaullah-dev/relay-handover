from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Source
from ..schemas import GitHubConnectRequest, SourceOut, UploadRequest
from ..services.github_ingest import GitHubIngestError, ingest_repository
from ..services.jira_import import JiraImportError, import_jira
from .projects import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}/sources", tags=["sources"])


def _to_out(source: Source) -> SourceOut:
    return SourceOut(id=source.id, kind=source.kind, name=source.name, identifier=source.identifier,
                     status=source.status, record_count=source.record_count,
                     last_imported_at=source.last_imported_at, is_synthetic=source.is_synthetic)


@router.get("", response_model=list[SourceOut])
def list_sources(project_id: str, db: Session = Depends(get_db)) -> list[SourceOut]:
    get_project_or_404(db, project_id)
    return [_to_out(s) for s in db.query(Source).filter_by(project_id=project_id)]


@router.post("/github", response_model=SourceOut)
async def connect_github(project_id: str, payload: GitHubConnectRequest,
                         db: Session = Depends(get_db)) -> SourceOut:
    get_project_or_404(db, project_id)
    try:
        source = await ingest_repository(db, project_id, payload.repository_url, get_settings())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except GitHubIngestError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    project = get_project_or_404(db, project_id)
    project.repository_url = payload.repository_url
    db.commit()
    return _to_out(source)


@router.post("/{kind}/upload", response_model=SourceOut)
def upload_export(project_id: str, kind: str, payload: UploadRequest,
                  db: Session = Depends(get_db)) -> SourceOut:
    get_project_or_404(db, project_id)
    if kind == "jira":
        try:
            source = import_jira(db, project_id, payload.file_name, payload.content)
        except JiraImportError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        db.commit()
        return _to_out(source)
    if kind in ("slack", "notion"):
        raise HTTPException(
            status_code=501,
            detail=f"Live {kind.title()} import is out of scope for this MVP build. "
                   f"The synthetic CampusConnect {kind.title()} records remain available for the demo.")
    raise HTTPException(status_code=404, detail=f"Unknown source kind: {kind}")