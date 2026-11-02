"""Read-only ingestion of public GitHub repositories via the public REST API."""
import re
from dataclasses import dataclass, field
from datetime import datetime

import httpx
from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import Source, SourceRecord, audit, new_id, utcnow

GITHUB_API = "https://api.github.com"
MAX_PAGES = 3
PER_PAGE = 100

_REPO_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/(?P<owner>[A-Za-z0-9_.-]+)/(?P<repo>[A-Za-z0-9_.-]+?)(?:\.git)?/?$"
)


class GitHubIngestError(Exception):
    pass


def parse_repo_url(url: str) -> tuple[str, str]:
    """Return (owner, repo). Raises ValueError for anything that is not a github.com repo URL."""
    match = _REPO_RE.match(url.strip())
    if not match:
        raise ValueError("Not a valid github.com repository URL")
    return match.group("owner"), match.group("repo")


async def _get_json(client: httpx.AsyncClient, path: str, token: str) -> list | dict:
    resp = await client.get(f"{GITHUB_API}{path}")
    if resp.status_code == 404:
        raise GitHubIngestError("Repository not found (or not public).")
    if resp.status_code in (403, 429):
        raise GitHubIngestError("GitHub rate limit reached. Set GITHUB_TOKEN or try again later.")
    if resp.status_code != 200:
        raise GitHubIngestError(f"GitHub API returned HTTP {resp.status_code}")
    return resp.json()


async def _get_pages(client: httpx.AsyncClient, path: str, token: str) -> list:
    items: list = []
    for page in range(1, MAX_PAGES + 1):
        sep = "&" if "?" in path else "?"
        batch = await _get_json(client, f"{path}{sep}page={page}&per_page={PER_PAGE}", token)
        if not isinstance(batch, list):
            break
        items.extend(batch)
        if len(batch) < PER_PAGE:
            break
    return items


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@dataclass
class IngestResult:
    pulls: int = 0
    issues: int = 0
    commits: int = 0
    records: list = field(default_factory=list)


async def ingest_repository(db: Session, project_id: str, repo_url: str, settings: Settings) -> Source:
    owner, repo = parse_repo_url(repo_url)  # raises ValueError
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "relay-handover"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
        repo_meta = await _get_json(client, f"/repos/{owner}/{repo}", settings.github_token)
        pulls = await _get_pages(client, f"/repos/{owner}/{repo}/pulls?state=all", settings.github_token)
        issues = await _get_pages(client, f"/repos/{owner}/{repo}/issues?state=all", settings.github_token)
        commits = await _get_pages(client, f"/repos/{owner}/{repo}/commits", settings.github_token)

    source = db.query(Source).filter_by(project_id=project_id, kind="github").first()
    if not source:
        source = Source(id=new_id("src"), project_id=project_id, kind="github", name="GitHub")
        db.add(source)
    source.identifier = f"{owner}/{repo}"
    source.status = "connected"
    source.is_synthetic = False
    source.last_imported_at = utcnow()

    # Idempotent re-import: replace previous github records for this project.
    old_ids = [r.id for r in db.query(SourceRecord).filter_by(project_id=project_id, source_id=source.id)]
    if old_ids:
        from ..models import Evidence
        db.query(Evidence).filter(Evidence.record_id.in_(old_ids)).delete(synchronize_session=False)
        db.query(SourceRecord).filter(SourceRecord.id.in_(old_ids)).delete(synchronize_session=False)

    count = 0
    for pr in pulls:
        body = pr.get("body") or ""
        db.add(SourceRecord(
            id=new_id("rec"), project_id=project_id, source_id=source.id, kind="github_pr",
            external_id=f"PR #{pr['number']}", title=pr.get("title", ""),
            content=f"{pr.get('title', '')}\n\n{body}".strip(),
            url=pr.get("html_url"), author=(pr.get("user") or {}).get("login"),
            timestamp=_parse_dt(pr.get("updated_at")),
            meta={"state": pr.get("state"), "merged": pr.get("merged_at") is not None,
                  "merged_at": pr.get("merged_at"), "head_ref": (pr.get("head") or {}).get("ref"),
                  "body": body},
        ))
        count += 1
    for issue in issues:
        if "pull_request" in issue:  # issues endpoint also returns PRs
            continue
        body = issue.get("body") or ""
        db.add(SourceRecord(
            id=new_id("rec"), project_id=project_id, source_id=source.id, kind="github_issue",
            external_id=f"Issue #{issue['number']}", title=issue.get("title", ""),
            content=f"{issue.get('title', '')}\n\n{body}".strip(),
            url=issue.get("html_url"), author=(issue.get("user") or {}).get("login"),
            timestamp=_parse_dt(issue.get("updated_at")),
            meta={"state": issue.get("state"), "body": body},
        ))
        count += 1
    for commit in commits:
        c = commit.get("commit") or {}
        message = c.get("message") or ""
        db.add(SourceRecord(
            id=new_id("rec"), project_id=project_id, source_id=source.id, kind="github_commit",
            external_id=(commit.get("sha") or "")[:7],
            title=message.split("\n")[0][:200], content=message,
            url=commit.get("html_url"),
            author=(c.get("author") or {}).get("name"),
            timestamp=_parse_dt((c.get("author") or {}).get("date")),
            meta={},
        ))
        count += 1

    source.record_count = count
    audit(db, project_id, "system", "sources.imported", "source", source.id,
          None, "connected", f"Imported {count} records from {owner}/{repo} (public API, read-only).")
    db.flush()
    return source