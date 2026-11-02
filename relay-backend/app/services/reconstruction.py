"""Orchestrates the five reconstruction stages and persists their state."""
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import Project, audit, utcnow
from .extraction import run_ai_extraction
from .linking import link_records
from .verification import recompute_all, run_rules


def _set_stage(db: Session, project: Project, stage: str, progress: int) -> None:
    project.reconstruction_stage = stage
    project.reconstruction_progress = progress
    # Commit immediately so each stage update is visible to concurrent readers
    # and the write lock is released before the next (potentially slow) step.
    db.commit()


async def run_reconstruction(db: Session, project: Project, settings: Settings) -> Project:
    previous = project.reconstruction_stage
    project.reconstruction_started_at = utcnow()
    project.reconstruction_completed_at = None
    project.reconstruction_error = None
    audit(db, project.id, "system", "reconstruction.started", "reconstruction",
          project.id, previous, "ingesting")
    db.commit()  # commit the audit + started_at before we begin the heavy work

    try:
        _set_stage(db, project, "ingesting", 15)
        # Ingestion happens at import time; this stage confirms records exist.

        _set_stage(db, project, "linking", 35)
        link_records(db, project.id)

        _set_stage(db, project, "extracting", 55)
        rule_claims = run_rules(db, project.id)
        ai_note = await run_ai_extraction(db, project.id, settings)

        _set_stage(db, project, "verifying", 80)
        recompute_all(db, project.id)

        _set_stage(db, project, "preparing", 95)
        project.reconstruction_stage = "complete"
        project.reconstruction_progress = 100
        project.reconstruction_completed_at = utcnow()
        if "unavailable" in ai_note.lower():
            project.reconstruction_error = ai_note  # reported honestly, not hidden
        project.updated_at = utcnow()
        audit(db, project.id, "system", "reconstruction.completed", "reconstruction",
              project.id, "preparing", "complete",
              f"{len(rule_claims)} rule-based claims evaluated. {ai_note}")
        db.commit()
    except Exception as exc:  # never fake success
        # Roll back any failed transaction before attempting to write failure state.
        try:
            db.rollback()
        except Exception:
            pass
        try:
            project.reconstruction_stage = "failed"
            project.reconstruction_error = str(exc)
            project.reconstruction_completed_at = utcnow()
            audit(db, project.id, "system", "reconstruction.failed", "reconstruction",
                  project.id, "extracting", "failed", str(exc))
            db.commit()
        except Exception:
            # If we cannot persist the failure either, at least log it.
            import logging
            logging.getLogger(__name__).exception(
                "Could not persist reconstruction failure state: %s", exc
            )
    return project
