"""Parse Jira JSON or CSV exports into source records. No live Jira API in this MVP."""
import csv
import io
import json
import re

from sqlalchemy.orm import Session

from ..models import Source, SourceRecord, audit, new_id, utcnow

JIRA_KEY_RE = re.compile(r"\b([A-Z][A-Z0-9]{1,9}-\d+)\b")


class JiraImportError(Exception):
    pass


def parse_jira_json(content: str) -> list[dict]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise JiraImportError(f"Invalid JSON: {exc}") from exc

    issues = data.get("issues") if isinstance(data, dict) else data
    if not isinstance(issues, list):
        raise JiraImportError("Expected a JSON array of issues or {'issues': [...]}")

    out = []
    for raw in issues:
        fields = raw.get("fields", raw)  # tolerate flat exports
        key = raw.get("key") or fields.get("key") or fields.get("issue_key") or fields.get("Issue key")
        if not key or not JIRA_KEY_RE.fullmatch(str(key)):
            continue

        status = fields.get("status")
        if isinstance(status, dict):
            status = status.get("name", "")
        status = str(status or fields.get("Status") or "")

        assignee = fields.get("assignee")
        if isinstance(assignee, dict):
            assignee = assignee.get("displayName", "")
        assignee = str(assignee or fields.get("Assignee") or "")

        comments_raw = (fields.get("comment") or {}).get("comments", []) if isinstance(fields.get("comment"), dict) else []
        comments = [{
            "author": (c.get("author") or {}).get("displayName", "") if isinstance(c.get("author"), dict) else str(c.get("author", "")),
            "created": c.get("created", ""),
            "body": c.get("body", ""),
        } for c in comments_raw]

        out.append({
            "key": str(key),
            "summary": str(fields.get("summary") or fields.get("Summary") or ""),
            "description": str(fields.get("description") or fields.get("Description") or ""),
            "status": status,
            "assignee": assignee,
            "created": str(fields.get("created") or fields.get("Created") or ""),
            "updated": str(fields.get("updated") or fields.get("Updated") or ""),
            "comments": comments,
        })
    if not out:
        raise JiraImportError("No valid Jira issues found in the file")
    return out


def parse_jira_csv(content: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(content))
    fieldnames = { (f or "").strip().lower(): f for f in (reader.fieldnames or []) }

    def pick(row: dict, *names: str) -> str:
        for n in names:
            for k, orig in fieldnames.items():
                if n in k:
                    return (row.get(orig) or "").strip()
        return ""

    out = []
    for row in reader:
        key = pick(row, "issue key", "key")
        if not key or not JIRA_KEY_RE.fullmatch(key):
            continue
        out.append({
            "key": key,
            "summary": pick(row, "summary"),
            "description": pick(row, "description"),
            "status": pick(row, "status"),
            "assignee": pick(row, "assignee"),
            "created": pick(row, "created"),
            "updated": pick(row, "updated"),
            "comments": [],
        })
    if not out:
        raise JiraImportError("No valid Jira issues found in the CSV")
    return out


def import_jira(db: Session, project_id: str, file_name: str, content: str) -> Source:
    if file_name.lower().endswith(".csv"):
        issues = parse_jira_csv(content)
    else:
        issues = parse_jira_json(content)

    # Find an existing *non-synthetic* (user-imported) jira source to reuse,
    # leaving the synthetic seed source untouched.
    source = db.query(Source).filter_by(
        project_id=project_id, kind="jira", is_synthetic=False
    ).first()
    if not source:
        source = Source(id=new_id("src"), project_id=project_id, kind="jira",
                        name="Jira (imported)")
        db.add(source)
    source.identifier = f"{file_name} ({len(issues)} issues)"
    source.status = "imported"
    source.is_synthetic = False
    source.last_imported_at = utcnow()

    # Idempotent: remove previously imported records from this import source.
    from ..models import Evidence
    for rec in db.query(SourceRecord).filter_by(project_id=project_id, source_id=source.id):
        db.query(Evidence).filter(Evidence.record_id == rec.id).delete(synchronize_session=False)
        db.delete(rec)
    db.flush()

    for issue in issues:
        comment_lines = "\n".join(
            f"[comment {c['created']}] {c['author']}: {c['body']}" for c in issue["comments"]
        )
        content_text = (
            f"{issue['summary']}\n"
            f"Status: {issue['status']}. Assignee: {issue['assignee'] or 'unassigned'}.\n"
            f"{issue['description']}".strip()
        )
        if comment_lines:
            content_text += f"\n\n{comment_lines}"
        ts = None
        if issue["updated"]:
            try:
                ts = __import__("datetime").datetime.fromisoformat(issue["updated"].replace("Z", "+00:00"))
            except ValueError:
                ts = None
        db.add(SourceRecord(
            id=new_id("rec"), project_id=project_id, source_id=source.id, kind="jira_issue",
            external_id=issue["key"], title=issue["summary"], content=content_text,
            url=None, author=issue["assignee"] or None, timestamp=ts,
            meta={"status": issue["status"], "comments": issue["comments"]},
        ))

    source.record_count = len(issues)
    audit(db, project_id, "system", "sources.imported", "source", source.id,
          None, "imported", f"Imported {len(issues)} issues from {file_name}")
    db.flush()
    return source
