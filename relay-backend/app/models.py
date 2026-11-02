from datetime import datetime, timezone
import uuid

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, default="")
    repository_url: Mapped[str | None] = mapped_column(String, nullable=True)
    departing_person: Mapped[str] = mapped_column(String, default="")
    incoming_person: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    reconstruction_stage: Mapped[str] = mapped_column(String, default="idle")
    reconstruction_progress: Mapped[int] = mapped_column(Integer, default=0)
    reconstruction_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reconstruction_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reconstruction_error: Mapped[str | None] = mapped_column(String, nullable=True)

    sources: Mapped[list["Source"]] = relationship(back_populates="project")
    claims: Mapped[list["Claim"]] = relationship(back_populates="project")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    kind: Mapped[str] = mapped_column(String)  # github | jira | slack | notion
    name: Mapped[str] = mapped_column(String)
    identifier: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    last_imported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    project: Mapped[Project] = relationship(back_populates="sources")
    records: Mapped[list["SourceRecord"]] = relationship(back_populates="source")


class SourceRecord(Base):
    __tablename__ = "source_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))
    kind: Mapped[str] = mapped_column(String)  # github_pr | github_issue | github_commit | jira_issue | slack_message | notion_page
    external_id: Mapped[str] = mapped_column(String)  # e.g. "PR #47", "PROJ-123", sha
    title: Mapped[str] = mapped_column(String, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str | None] = mapped_column(String, nullable=True)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)

    source: Mapped[Source] = relationship(back_populates="records")


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    statement: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String)
    trust_label: Mapped[str] = mapped_column(String, default="no-evidence")
    review_status: Mapped[str] = mapped_column(String, default="pending")
    related_identifier: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_note: Mapped[str] = mapped_column(Text, default="")
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrected_statement: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String, nullable=True)
    origin: Mapped[str] = mapped_column(String, default="synthetic")  # synthetic | rule | ai
    dedupe_key: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped[Project] = relationship(back_populates="claims")
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="claim", cascade="all, delete-orphan")
    reviews: Mapped[list["ClaimReview"]] = relationship(back_populates="claim", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    claim_id: Mapped[str] = mapped_column(ForeignKey("claims.id"))
    record_id: Mapped[str] = mapped_column(ForeignKey("source_records.id"))
    stance: Mapped[str] = mapped_column(String)  # supporting | contradicting | neutral
    excerpt: Mapped[str] = mapped_column(Text, default="")

    claim: Mapped[Claim] = relationship(back_populates="evidence")
    record: Mapped[SourceRecord] = relationship()


class ClaimReview(Base):
    __tablename__ = "claim_reviews"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    claim_id: Mapped[str] = mapped_column(ForeignKey("claims.id"))
    action: Mapped[str] = mapped_column(String)
    previous_status: Mapped[str] = mapped_column(String)
    new_status: Mapped[str] = mapped_column(String)
    corrected_statement: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    claim: Mapped[Claim] = relationship(back_populates="reviews")


class Handover(Base):
    __tablename__ = "handovers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    role: Mapped[str] = mapped_column(String)  # developer | stakeholder
    version: Mapped[int] = mapped_column(Integer, default=1)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    conflicts_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    sections: Mapped[list] = mapped_column(JSON, default=list)
    plan: Mapped[list] = mapped_column(JSON, default=list)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str] = mapped_column(String)
    previous_state: Mapped[str | None] = mapped_column(String, nullable=True)
    new_state: Mapped[str] = mapped_column(String, default="")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


def audit(db, project_id: str, actor: str, action: str, entity_type: str,
          entity_id: str, previous_state: str | None, new_state: str, note: str | None = None) -> None:
    db.add(AuditEvent(
        id=new_id("aud"), project_id=project_id, actor=actor, action=action,
        entity_type=entity_type, entity_id=entity_id,
        previous_state=previous_state, new_state=new_state, note=note,
    ))