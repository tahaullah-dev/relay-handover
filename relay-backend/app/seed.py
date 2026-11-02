"""Idempotent seed of the CampusConnect synthetic demonstration project."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AuditEvent, Claim, Evidence, Project, Source, SourceRecord

PROJECT_ID = "proj_campusconnect"


def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def seed(db: Session) -> None:
    if db.scalar(select(Project).where(Project.id == PROJECT_ID)):
        return  # idempotent

    db.add(Project(
        id=PROJECT_ID,
        name="CampusConnect",
        description=("A campus event discovery and RSVP app built by the TraceForge student tech club. "
                     "Handing over from Alex Chen (graduating) to the new maintainer."),
        repository_url="https://github.com/traceforge/campusconnect",
        departing_person="Alex Chen",
        incoming_person=None,
        created_at=_dt("2026-09-01T10:00:00Z"),
        updated_at=_dt("2026-11-02T09:00:00Z"),
        reconstruction_stage="complete",
        reconstruction_progress=100,
        reconstruction_started_at=_dt("2026-11-01T18:12:00Z"),
        reconstruction_completed_at=_dt("2026-11-01T18:14:32Z"),
    ))
    # Flush the project row first so PostgreSQL FK checks on all child tables
    # (sources, source_records, claims, audit_events) pass in the same transaction.
    db.flush()

    sources = [
        Source(id="src_github", project_id=PROJECT_ID, kind="github", name="GitHub",
               identifier="traceforge/campusconnect", status="connected", record_count=7,
               last_imported_at=_dt("2026-11-01T18:10:11Z"), is_synthetic=True),
        Source(id="src_jira", project_id=PROJECT_ID, kind="jira", name="Jira",
               identifier="CC — CampusConnect Board", status="connected", record_count=4,
               last_imported_at=_dt("2026-11-01T18:10:11Z"), is_synthetic=True),
        Source(id="src_slack", project_id=PROJECT_ID, kind="slack", name="Slack",
               identifier="#campusconnect-dev", status="imported", record_count=6,
               last_imported_at=_dt("2026-10-28T14:02:00Z"), is_synthetic=True),
        Source(id="src_notion", project_id=PROJECT_ID, kind="notion", name="Notion",
               identifier="CampusConnect — Team Wiki", status="imported", record_count=5,
               last_imported_at=_dt("2026-10-28T14:02:00Z"), is_synthetic=True),
    ]
    db.add_all(sources)
    # Flush sources so source_records FK (source_id) is satisfied.
    db.flush()

    R = [
        # --- GitHub records ---
        ("rec_gh_pr47", "src_github", "github_pr", "PR #47",
         "feat(rsvp): finalise confirmation email",
         "feat(rsvp): finalise confirmation email\n\nFinal pass on the RSVP confirmation email for PROJ-123.",
         "https://github.com/traceforge/campusconnect/pull/47", "alex-cc", "2026-10-25T09:18:00Z",
         {"state": "open", "merged": False, "jira_keys": ["PROJ-123"]}),
        ("rec_gh_pr51", "src_github", "github_pr", "PR #51",
         "chore(db): replace pg driver with better-sqlite3",
         "chore(db): replace pg driver with better-sqlite3\n\ndocker-compose no longer starts postgres.",
         "https://github.com/traceforge/campusconnect/pull/51", "alex-cc", "2026-10-19T08:11:00Z",
         {"state": "closed", "merged": True, "merged_at": "2026-10-19T08:11:00Z", "jira_keys": []}),
        ("rec_gh_pr52", "src_github", "github_pr", "PR #52",
         "refactor(notification): batched email sender",
         "refactor(notification): batched email sender\n\nNo ticket reference.",
         "https://github.com/traceforge/campusconnect/pull/52", "alex-cc", "2026-10-27T17:40:00Z",
         {"state": "open", "merged": False, "jira_keys": []}),
        ("rec_gh_commit_a1b2c3", "src_github", "github_commit", "a1b2c3d",
         "chore(db): reset staging after migration",
         "chore(db): reset staging after migration — drops and recreates all tables.",
         "https://github.com/traceforge/campusconnect/commit/a1b2c3", "alex-cc", "2026-10-20T14:05:00Z", {}),
        ("rec_gh_ci", "src_github", "github_commit", ".github/workflows/ci.yml",
         "CI workflow",
         "Workflow file .github/workflows/ci.yml runs lint, typecheck, and vitest on every push and PR.",
         "https://github.com/traceforge/campusconnect/blob/main/.github/workflows/ci.yml", "alex-cc",
         "2026-10-01T08:00:00Z", {}),
        ("rec_gh_authlog", "src_github", "github_commit", "git-log:src/auth",
         "git history for src/auth",
         "git log -- src/auth/ shows 34 commits, all authored by alex-cc. No other contributor has touched this directory.",
         "https://github.com/traceforge/campusconnect/tree/main/src/auth", None, "2026-11-01T18:10:00Z", {}),
        ("rec_gh_eventslog", "src_github", "github_commit", "git-log:src/events",
         "git history for src/events",
         "git log -- src/events/ shows 28 commits by sam-cc, 3 by alex-cc, 1 by priya-cc. Sam is the primary author.",
         "https://github.com/traceforge/campusconnect/tree/main/src/events", None, "2026-11-01T18:10:00Z", {}),
        ("rec_gh_events_code", "src_github", "github_commit", "src/routes/events.ts",
         "events route source",
         "Source code: `const pageSize = Number(query.limit) || 50;` — default is 50, not 20.",
         "https://github.com/traceforge/campusconnect/blob/main/src/routes/events.ts", "alex-cc",
         "2026-10-12T09:00:00Z", {}),
        # --- Jira records ---
        ("rec_jira_123", "src_jira", "jira_issue", "PROJ-123",
         "Event RSVP flow",
         "Status changed to Done. Acceptance criteria met. Ready for release.",
         "https://jira.example/browse/PROJ-123", "Alex Chen", "2026-10-24T16:42:00Z",
         {"status": "Done", "comments": []}),
        ("rec_jira_118", "src_jira", "jira_issue", "PROJ-118",
         "Landing page redesign",
         "Status: Done. Resolution: Fixed. Closed on Oct 10.",
         "https://jira.example/browse/PROJ-118", "Alex Chen", "2026-10-10T12:00:00Z",
         {"status": "Done", "comments": [
             {"author": "Sam Oduya", "created": "2026-10-14T09:22:00Z",
              "body": ("@alex-cc the new hero image looks off on mobile — can you double-check before we "
                       "announce it in the newsletter? I don't want to reopen the ticket if it's minor.")}]}),
        ("rec_jira_130", "src_jira", "jira_issue", "PROJ-130",
         "OAuth login with university SSO",
         "Status: Blocked. Blocker: waiting on IT security review.",
         "https://jira.example/browse/PROJ-130", "Alex Chen", "2026-10-20T09:00:00Z",
         {"status": "Blocked", "comments": []}),
        ("rec_jira_search_pr52", "src_jira", "jira_issue", "search:PR#52",
         "Jira search for PR #52",
         "Jira issue search for references to PR #52 returned 0 results.",
         None, None, "2026-10-28T08:00:00Z", {"status": "n/a", "comments": []}),
        # --- Slack records ---
        ("rec_slack_1", "src_slack", "slack_message", "msg-1729872000", "Slack message",
         "@alex-cc PROJ-123 isn't actually done — the confirmation email template still has the old logo. Can you push the fix before we close the sprint?",
         "https://slack.example/archives/C0123456/p1729872000", "Priya Raman", "2026-10-25T11:04:00Z", {}),
        ("rec_slack_2", "src_slack", "slack_message", "msg-1730400000", "Slack message",
         "Update: we're switching the primary store to SQLite for the demo deployment. Postgres was overkill for the club's hosting budget. I'll update the Notion page tomorrow.",
         "https://slack.example/archives/C0123456/p1730400000", "Alex Chen", "2026-10-18T15:22:00Z", {}),
        ("rec_slack_3", "src_slack", "slack_message", "msg-1729500000", "Slack message",
         "Heard back from IT — they need 2 more weeks for the SSO callback URL review. PROJ-130 stays blocked.",
         "https://slack.example/archives/C0123456/p1729500000", "Alex Chen", "2026-10-21T10:12:00Z", {}),
        ("rec_slack_4", "src_slack", "slack_message", "msg-1729200000", "Slack message",
         "Reminder: if you change copy in Notion, ping me — the email sender pulls from templates/ and I have to regenerate the bundle. It's a manual step.",
         "https://slack.example/archives/C0123456/p1729200000", "Priya Raman", "2026-10-15T13:30:00Z", {}),
        ("rec_slack_5", "src_slack", "slack_message", "msg-1729400000", "Slack message",
         "Heads up: I just wiped staging and re-ran the migration. Seed data is gone — let me know if you need it back.",
         "https://slack.example/archives/C0123456/p1729400000", "Alex Chen", "2026-10-20T14:00:00Z", {}),
        ("rec_slack_6", "src_slack", "slack_message", "msg-1730500000", "Slack message",
         "Do we have any error monitoring set up yet? I can't find Sentry or Rollbar keys anywhere.",
         "https://slack.example/archives/C0123456/p1730500000", "Sam Oduya", "2026-10-19T16:00:00Z", {}),
        # --- Notion records ---
        ("rec_notion_dec004", "src_notion", "notion_page", "page-arch-004", "Architecture Decisions",
         "Decision DEC-004: Use PostgreSQL for the primary relational store. Rationale: mature tooling, strong JSON support.",
         "https://notion.example/architecture/dec-004", "Alex Chen", "2026-09-12T10:00:00Z", {}),
        ("rec_notion_risks", "src_notion", "notion_page", "page-risks", "Risks & Blockers",
         "Risk R-07: SSO integration blocked on IT approval. ETA unknown. Owner: Alex.",
         "https://notion.example/risks", "Alex Chen", "2026-10-22T14:00:00Z", {}),
        ("rec_notion_owners", "src_notion", "notion_page", "page-owners", "Team Responsibilities",
         "Notifications subsystem — owner: Priya Raman. Backup: Alex Chen. Events listing & search — owner: Sam Oduya.",
         "https://notion.example/team/owners", "Alex Chen", "2026-09-01T10:00:00Z", {}),
        ("rec_notion_api", "src_notion", "notion_page", "page-api-events", "API Reference",
         "GET /api/events — paginated. Default page size: 20. Max: 100.",
         "https://notion.example/api/events", "Alex Chen", "2026-09-20T10:00:00Z", {}),
        ("rec_notion_deploy", "src_notion", "notion_page", "page-deploy", "Deployments",
         "Preview deploys: every PR gets a Netlify preview. Production: main branch auto-deploys to campusconnect.club.",
         "https://notion.example/deployments", "Alex Chen", "2026-09-15T11:00:00Z", {}),
    ]
    for (rid, sid, kind, ext, title, content, url, author, ts, meta) in R:
        db.add(SourceRecord(id=rid, project_id=PROJECT_ID, source_id=sid, kind=kind,
                            external_id=ext, title=title, content=content, url=url,
                            author=author, timestamp=_dt(ts), meta=meta))
    # Flush source records so evidence FK (record_id) is satisfied.
    db.flush()

    # Claims: (id, statement, category, trust, review_status, related, note,
    #          dedupe, comment, corrected, reviewed_at, reviewed_by, evidence[(record, stance, excerpt)])
    C = [
        ("clm_001", 'PROJ-123 "Event RSVP flow" is complete and shipped.', "task-status",
         "conflicting", "pending", "PROJ-123",
         "Jira marks the ticket Done, but the linked pull request is still open and a teammate has flagged an outstanding defect in Slack.",
         "done_unmerged:PROJ-123:PR #47", None, None, None, None,
         [("rec_jira_123", "supporting", "Status changed to Done. Acceptance criteria met. Ready for release."),
          ("rec_gh_pr47", "contradicting", 'Pull request #47 "feat(rsvp): finalise confirmation email" is open, 2 approvals pending, not merged.'),
          ("rec_slack_1", "contradicting", "@alex-cc PROJ-123 isn't actually done — the confirmation email template still has the old logo. Can you push the fix before we close the sprint?")]),
        ("clm_002", "The team decided to use PostgreSQL as the primary database.", "decision",
         "conflicting", "pending", "DEC-004",
         "Notion still records PostgreSQL as the decision, but Slack and a merged PR show the decision was superseded by SQLite. The Notion page was never updated.",
         None, None, None, None, None,
         [("rec_notion_dec004", "supporting", "Decision DEC-004: Use PostgreSQL for the primary relational store. Rationale: mature tooling, strong JSON support."),
          ("rec_slack_2", "contradicting", "Update: we're switching the primary store to SQLite for the demo deployment. Postgres was overkill for the club's hosting budget. I'll update the Notion page tomorrow."),
          ("rec_gh_pr51", "contradicting", 'Merged PR #51 "chore(db): replace pg driver with better-sqlite3". docker-compose no longer starts postgres.')]),
        ("clm_003", 'PROJ-130 "OAuth login with university SSO" is blocked waiting on IT approval.', "task-status",
         "verified", "pending", "PROJ-130",
         "Three independent sources agree. Jira, Slack, and Notion all record the same blocker with consistent dates.",
         None, None, None, None, None,
         [("rec_jira_130", "supporting", "Status: Blocked. Blocker: waiting on IT security review."),
          ("rec_slack_3", "supporting", "Heard back from IT — they need 2 more weeks for the SSO callback URL review. PROJ-130 stays blocked."),
          ("rec_notion_risks", "supporting", "Risk R-07: SSO integration blocked on IT approval. ETA unknown. Owner: Alex.")]),
        ("clm_004", 'PR #52 "refactor(notification): batched email sender" has no linked ticket.', "risk",
         "verified", "pending", "PR #52",
         "The PR is open with no linked ticket and no matching Jira issue. This is a process gap — work is happening without traceability.",
         "orphan_pr:PR #52", None, None, None, None,
         [("rec_gh_pr52", "supporting", 'Open PR #52. Title: "refactor(notification): batched email sender". Body contains no Jira key, no issue link.'),
          ("rec_jira_search_pr52", "supporting", "Jira issue search for references to PR #52 returned 0 results.")]),
        ("clm_005", "The `src/auth/` module is a knowledge-concentration risk: only Alex has ever committed to it.", "risk",
         "verified", "pending", "src/auth",
         "Single-source but deterministic: derived from git history. High confidence.",
         None, None, None, None, None,
         [("rec_gh_authlog", "supporting", "git log -- src/auth/ shows 34 commits, all authored by alex-cc. No other contributor has touched this directory.")]),
        ("clm_006", 'PROJ-118 "Landing page redesign" is closed, but a follow-up comment asks for confirmation.', "task-status",
         "conflicting", "pending", "PROJ-118",
         "Ticket is closed, but a comment four days later raises an unresolved concern. The work may not actually be finished.",
         "closed_followup:PROJ-118", None, None, None, None,
         [("rec_jira_118", "supporting", "Status: Done. Resolution: Fixed. Closed on Oct 10."),
          ("rec_jira_118", "contradicting", "@alex-cc the new hero image looks off on mobile — can you double-check before we announce it in the newsletter? I don't want to reopen the ticket if it's minor.")]),
        ("clm_007", "Priya Raman is the owner of the notifications subsystem.", "ownership",
         "single-source", "pending", "src/notifications",
         "Only one source records this. No contradicting evidence, but no corroboration either.",
         None, None, None, None, None,
         [("rec_notion_owners", "supporting", "Notifications subsystem — owner: Priya Raman. Backup: Alex Chen.")]),
        ("clm_008", "The email sender depends on the `templates/` directory being in sync with Notion copy.", "dependency",
         "single-source", "pending", "src/notifications",
         "Single-source Slack message. No contradicting evidence, but this is an implicit process dependency worth surfacing.",
         None, None, None, None, None,
         [("rec_slack_4", "supporting", "Reminder: if you change copy in Notion, ping me — the email sender pulls from templates/ and I have to regenerate the bundle. It's a manual step.")]),
        ("clm_009", "Who is the current point of contact with the university IT team for SSO?", "unresolved-question",
         "no-evidence", "pending", "PROJ-130",
         "No source names a current IT contact. Alex was handling it, but there is no documented handoff.",
         None, None, None, None, None, []),
        ("clm_010", "The team uses GitHub Actions for CI and Netlify for preview deploys.", "decision",
         "verified", "pending", "CI/CD",
         "Two sources agree. GitHub workflow file and Notion deployment page corroborate.",
         None, None, None, None, None,
         [("rec_gh_ci", "supporting", "Workflow file .github/workflows/ci.yml runs lint, typecheck, and vitest on every push and PR."),
          ("rec_notion_deploy", "supporting", "Preview deploys: every PR gets a Netlify preview. Production: main branch auto-deploys to campusconnect.club.")]),
        ("clm_011", "The staging database was wiped on Oct 20 during the schema migration.", "decision",
         "reviewer-confirmed", "confirmed", "DB-MIGRATION",
         "Reviewer confirmed. Two sources agree and the reviewer verified the timeline.",
         None, "Confirmed — I did this myself.", None, "2026-11-01T18:30:00Z", "Alex Chen",
         [("rec_slack_5", "supporting", "Heads up: I just wiped staging and re-ran the migration. Seed data is gone — let me know if you need it back."),
          ("rec_gh_commit_a1b2c3", "supporting", 'Commit a1b2c3 "chore(db): reset staging after migration" — drops and recreates all tables.')]),
        ("clm_012", "The events API returns paginated results with a default page size of 20.", "decision",
         "reviewer-corrected", "corrected", "API /events",
         "Notion says 20, code says 50. Reviewer corrected: the code is authoritative; Notion was never updated.",
         None, "Code is right. Notion is stale.",
         "The events API returns paginated results with a default page size of 50.",
         "2026-11-01T18:32:00Z", "Alex Chen",
         [("rec_notion_api", "supporting", "GET /api/events — paginated. Default page size: 20. Max: 100."),
          ("rec_gh_events_code", "contradicting", "Source code: `const pageSize = Number(query.limit) || 50;` — default is 50, not 20.")]),
        ("clm_013", "The team has not yet decided on a monitoring solution for production errors.", "unresolved-question",
         "single-source", "pending", "MONITORING",
         "One Slack message raises the question. No source records a decision.",
         None, None, None, None, None,
         [("rec_slack_6", "supporting", "Do we have any error monitoring set up yet? I can't find Sentry or Rollbar keys anywhere.")]),
        ("clm_014", "Sam Oduya is responsible for the events listing UI and search.", "ownership",
         "verified", "pending", "src/events",
         "Two sources agree. Notion ownership record matches git history.",
         None, None, None, None, None,
         [("rec_notion_owners", "supporting", "Events listing & search — owner: Sam Oduya."),
          ("rec_gh_eventslog", "supporting", "git log -- src/events/ shows 28 commits by sam-cc, 3 by alex-cc, 1 by priya-cc. Sam is the primary author.")]),
        ("clm_015", "The `stripe` dependency in package.json is unused — the team decided not to integrate payments.", "decision",
         "no-evidence", "pending", "package.json",
         "The dependency is present in package.json, but no source records a decision to remove it or a reason it remains. No Slack, Jira, or Notion discussion found.",
         None, None, None, None, None, []),
    ]
    for (cid, stmt, cat, trust, rstatus, rel, note, dedupe, comment, corrected, rat, rby, evs) in C:
        db.add(Claim(
            id=cid, project_id=PROJECT_ID, statement=stmt, category=cat,
            trust_label=trust, review_status=rstatus, related_identifier=rel,
            verification_note=note, dedupe_key=dedupe, origin="synthetic",
            reviewer_comment=comment, corrected_statement=corrected,
            last_reviewed_at=_dt(rat) if rat else None, reviewed_by=rby,
        ))
        for i, (rec_id, stance, excerpt) in enumerate(evs):
            db.add(Evidence(id=f"ev_{cid}_{i}", claim_id=cid, record_id=rec_id,
                            stance=stance, excerpt=excerpt))
    # Flush claims+evidence before audit events (audit_events.project_id FK).
    db.flush()

    audits = [
        ("2026-11-01T18:10:11Z", "Alex Chen", "sources.connected", "source", "src_github", None, "connected",
         "Connected traceforge/campusconnect (read-only)."),
        ("2026-11-01T18:10:11Z", "Alex Chen", "sources.connected", "source", "src_jira", None, "connected",
         "Connected CC Jira board (read-only)."),
        ("2026-11-01T18:12:00Z", "Alex Chen", "reconstruction.started", "reconstruction", PROJECT_ID, "idle", "ingesting", None),
        ("2026-11-01T18:14:32Z", "system", "reconstruction.completed", "reconstruction", PROJECT_ID, "preparing", "complete",
         "Extracted 15 claims across 4 sources."),
        ("2026-11-01T18:30:00Z", "Alex Chen", "claim.confirmed", "claim", "clm_011", "pending", "confirmed",
         "Confirmed — I did this myself."),
        ("2026-11-01T18:32:00Z", "Alex Chen", "claim.corrected", "claim", "clm_012", "pending", "corrected",
         "Code is right. Notion is stale."),
    ]
    for i, (ts, actor, action, etype, eid, prev, new, note) in enumerate(audits):
        db.add(AuditEvent(id=f"aud_seed_{i:03d}", project_id=PROJECT_ID, timestamp=_dt(ts),
                          actor=actor, action=action, entity_type=etype, entity_id=eid,
                          previous_state=prev, new_state=new, note=note))

    db.commit()
