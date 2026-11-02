from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ReconstructionOut(CamelModel):
    stage: str
    progress_percent: int
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None


class ProjectOut(CamelModel):
    id: str
    name: str
    description: str
    repository_url: str | None
    departing_person: str
    incoming_person: str | None
    created_at: datetime
    updated_at: datetime
    sources_count: int
    claims_count: int
    verified_count: int
    conflicting_count: int
    unresolved_count: int
    approved_handovers_count: int
    reconstruction: ReconstructionOut


class SourceOut(CamelModel):
    id: str
    kind: str
    name: str
    identifier: str
    status: str
    record_count: int
    last_imported_at: datetime | None
    is_synthetic: bool


class EvidenceOut(CamelModel):
    id: str
    source_kind: str
    source_name: str
    source_identifier: str
    record_id: str
    timestamp: datetime | None
    author: str | None
    excerpt: str
    url: str | None
    stance: str


class ClaimOut(CamelModel):
    id: str
    statement: str
    category: str
    trust_label: str
    review_status: str
    related_identifier: str | None
    supporting_count: int
    contradicting_count: int
    supporting: list[EvidenceOut]
    contradicting: list[EvidenceOut]
    verification_note: str
    reviewer_comment: str | None
    corrected_statement: str | None
    last_reviewed_at: datetime | None
    reviewed_by: str | None


class ReviewRequest(CamelModel):
    action: str  # confirm | correct | reject | needs-evidence
    corrected_statement: str | None = None
    comment: str | None = None
    reviewer: str


class ReviewResult(CamelModel):
    claim: ClaimOut
    trust_label: str
    review_status: str


class GitHubConnectRequest(CamelModel):
    repository_url: str


class UploadRequest(CamelModel):
    file_name: str
    content: str


class HandoverSectionOut(CamelModel):
    id: str
    title: str
    body: str
    claims: list[str]


class HandoverPlanOut(CamelModel):
    horizon: str
    items: list[str]


class HandoverOut(CamelModel):
    id: str
    version: int
    role: str
    approved_at: datetime | None
    approved_by: str | None
    sections: list[HandoverSectionOut]
    plan: list[HandoverPlanOut]
    generated_at: datetime


class GenerateHandoverRequest(CamelModel):
    role: str


class ApproveRequest(CamelModel):
    approver: str
    acknowledge_conflicts: bool = False


class AuditOut(CamelModel):
    id: str
    timestamp: datetime
    actor: str
    action: str
    entity_type: str
    entity_id: str
    previous_state: str | None
    new_state: str
    note: str | None


class MetaOut(CamelModel):
    mode: str
    gemini_configured: bool
    version: str