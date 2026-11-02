"""Gemini-based claim extraction with strict Pydantic validation.

Gemini extracts; it never certifies. Trust labels are assigned by the deterministic
verification service, and every citation must match an actual imported record exactly.
"""
from typing import Literal

from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import Claim, Evidence, SourceRecord, new_id, utcnow
from .gemini_client import GeminiUnavailable, generate_json
from .verification import compute_trust, quote_matches

Category = Literal["decision", "task-status", "ownership", "dependency", "risk", "unresolved-question"]
CATEGORIES = {"decision", "task-status", "ownership", "dependency", "risk", "unresolved-question"}
MAX_CLAIMS = 25


class ExtractedCitation(BaseModel):
    record_id: str
    excerpt: str


class ExtractedClaim(BaseModel):
    statement: str
    category: Category
    related_identifier: str | None = None
    citations: list[ExtractedCitation] = []


class ExtractionResult(BaseModel):
    claims: list[ExtractedClaim] = []


PROMPT_TEMPLATE = """You are analysing imported project records to reconstruct project knowledge for a handover.

Extract typed claims in these categories only: decision, task-status, ownership, dependency, risk, unresolved-question.

Rules:
- Only state what the records actually show. Never guess.
- Every citation must quote the record's text EXACTLY (verbatim substring).
- Prefer claims about decisions, blocked work, owners, dependencies, risks, and open questions.
- Return at most 15 claims.

Records (id | kind | external id | content):
{records}

Return ONLY JSON in this exact shape:
{{"claims": [{{"statement": "...", "category": "decision|task-status|ownership|dependency|risk|unresolved-question", "related_identifier": "... or null", "citations": [{{"record_id": "rec_...", "excerpt": "exact quote"}}]}}]}}"""


def validate_extraction(payload: dict, known_record_ids: set[str]) -> ExtractionResult:
    """Validate Gemini output. Malformed claims and unknown record references are rejected."""
    try:
        result = ExtractionResult.model_validate(payload)
    except ValidationError as exc:
        raise ValueError(f"Gemini returned malformed extraction payload: {exc}") from exc

    kept: list[ExtractedClaim] = []
    for claim in result.claims[:MAX_CLAIMS]:
        if not claim.statement.strip() or claim.category not in CATEGORIES:
            continue
        valid_citations = [c for c in claim.citations if c.record_id in known_record_ids]
        kept.append(claim.model_copy(update={"citations": valid_citations}))
    return ExtractionResult(claims=kept)


async def run_ai_extraction(db: Session, project_id: str, settings: Settings) -> str:
    """Returns a status note. Raises nothing — Gemini failures degrade to rule-only mode."""
    records = db.query(SourceRecord).filter_by(project_id=project_id).all()
    real_records = [r for r in records if r.kind in ("github_pr", "github_issue", "github_commit", "jira_issue")]
    if not real_records:
        return "No imported GitHub/Jira records to extract from."

    corpus = "\n".join(
        f"{r.id} | {r.kind} | {r.external_id} | {(r.content or '')[:400]}"
        for r in real_records[:40]
    )

    try:
        payload = await generate_json(PROMPT_TEMPLATE.format(records=corpus), settings)
        result = validate_extraction(payload, {r.id for r in records})
    except (GeminiUnavailable, ValueError) as exc:
        return f"Gemini extraction unavailable ({exc}). Rule-based results retained."

    created = 0
    for item in result.claims:
        dedupe = f"ai:{item.statement.strip().lower()[:80]}"
        if db.query(Claim).filter_by(project_id=project_id, dedupe_key=dedupe).first():
            continue
        claim = Claim(
            id=new_id("clm"), project_id=project_id, statement=item.statement.strip(),
            category=item.category, related_identifier=item.related_identifier,
            verification_note="Extracted by AI model; citations verified deterministically against source records.",
            origin="ai", dedupe_key=dedupe,
        )
        db.add(claim)
        db.flush()
        for cit in item.citations:
            record = db.get(SourceRecord, cit.record_id)
            if record is None:
                continue
            if not quote_matches(cit.excerpt, record.content):
                continue  # exact-quote verification failed — citation dropped
            db.add(Evidence(id=new_id("ev"), claim_id=claim.id, record_id=record.id,
                            stance="supporting", excerpt=cit.excerpt.strip()))
        compute_trust(claim)
        created += 1

    db.flush()
    return f"Gemini extraction produced {created} new claims (validated, quote-verified)."