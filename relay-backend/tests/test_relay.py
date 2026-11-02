"""Relay backend test suite. Run with: pytest -v"""
import pytest

PROJECT = "proj_campusconnect"


# --- Startup & persistence ---

def test_app_starts_and_meta(client):
    r = client.get("/meta")
    assert r.status_code == 200
    assert r.json()["mode"] == "live"


def test_seed_persisted(client):
    r = client.get(f"/projects/{PROJECT}")
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "CampusConnect"
    assert body["claimsCount"] == 15
    assert body["sourcesCount"] == 4


def test_project_404(client):
    assert client.get("/projects/does-not-exist").status_code == 404


# --- GitHub URL validation (no network needed) ---

@pytest.mark.parametrize("url", [
    "https://gitlab.com/foo/bar",
    "javascript:alert(1)",
    "https://github.com/",
    "https://evil.com/github.com/foo/bar",
    "not a url",
])
def test_github_url_rejected(client, url):
    r = client.post(f"/projects/{PROJECT}/sources/github", json={"repositoryUrl": url})
    assert r.status_code == 422


def test_github_url_parser():
    from app.services.github_ingest import parse_repo_url
    assert parse_repo_url("https://github.com/owner/repo") == ("owner", "repo")
    assert parse_repo_url("github.com/owner/repo/") == ("owner", "repo")
    assert parse_repo_url("https://github.com/owner/repo.git") == ("owner", "repo")
    with pytest.raises(ValueError):
        parse_repo_url("https://gitlab.com/owner/repo")


# --- Jira import ---

JIRA_JSON = """
{"issues": [
  {"key": "TEST-1", "fields": {
      "summary": "Build login", "description": "Login screen",
      "status": {"name": "Done"}, "assignee": {"displayName": "Alex"},
      "comment": {"comments": []}, "updated": "2026-10-01T10:00:00Z"}},
  {"key": "TEST-2", "fields": {
      "summary": "Fix build", "status": {"name": "In Progress"},
      "comment": {"comments": []}, "updated": "2026-10-02T10:00:00Z"}}
]}
"""


def test_jira_json_import(client):
    r = client.post(f"/projects/{PROJECT}/sources/jira/upload",
                    json={"fileName": "export.json", "content": JIRA_JSON})
    assert r.status_code == 200
    assert r.json()["recordCount"] == 2
    assert r.json()["isSynthetic"] is False


def test_jira_csv_import(client):
    csv_content = "Issue key,Summary,Status,Assignee\nTEST-9,CSV issue,Done,Alex\n"
    r = client.post(f"/projects/{PROJECT}/sources/jira/upload",
                    json={"fileName": "export.csv", "content": csv_content})
    assert r.status_code == 200
    assert r.json()["recordCount"] == 1


def test_jira_invalid_import(client):
    r = client.post(f"/projects/{PROJECT}/sources/jira/upload",
                    json={"fileName": "bad.json", "content": "{not json"})
    assert r.status_code == 422


def test_slack_upload_honestly_501(client):
    r = client.post(f"/projects/{PROJECT}/sources/slack/upload",
                    json={"fileName": "x.json", "content": "{}"})
    assert r.status_code == 501
    assert "out of scope" in r.json()["detail"]


# --- Linking ---

def test_linking_finds_jira_keys():
    from app.services.linking import find_jira_keys
    assert find_jira_keys("Fix PROJ-123 and CC-7") == {"PROJ-123", "CC-7"}
    assert find_jira_keys("no keys here") == set()


# --- Done/unmerged mandatory rule ---

def test_done_unmerged_rule_fires_on_seed(client):
    r = client.post(f"/projects/{PROJECT}/reconstruction")
    assert r.status_code == 200
    claims = client.get(f"/projects/{PROJECT}/claims").json()
    match = [c for c in claims if c["relatedIdentifier"] == "PROJ-123"
             and c["trustLabel"] == "conflicting"]
    assert match, "Done/unmerged contradiction for PROJ-123 not detected"
    claim = match[0]
    assert claim["supportingCount"] >= 1
    assert claim["contradictingCount"] >= 1
    stances = {e["stance"] for e in claim["supporting"] + claim["contradicting"]}
    assert stances == {"supporting", "contradicting"}
    for e in claim["supporting"] + claim["contradicting"]:
        assert e["excerpt"]
        assert e["sourceKind"] in ("jira", "github", "slack")


def test_orphan_pr_rule(client):
    claims = client.get(f"/projects/{PROJECT}/claims").json()
    assert any("PR #52" in c["statement"] and c["category"] == "risk" for c in claims)


# --- Trust labels ---

def test_trust_labels(client):
    claims = client.get(f"/projects/{PROJECT}/claims").json()
    by_id = {c["id"]: c for c in claims}
    assert by_id["clm_003"]["trustLabel"] == "verified"
    assert by_id["clm_007"]["trustLabel"] == "single-source"
    assert by_id["clm_009"]["trustLabel"] == "no-evidence"


# --- Exact-quote verification ---

def test_exact_quote_verification():
    from app.services.verification import quote_matches
    assert quote_matches("Status: Done.", "Status:  Done. Extra")
    assert not quote_matches("Status: Shipped.", "Status: Done.")


# --- Gemini response validation (no network) ---

def test_gemini_validation_rejects_unknown_records():
    from app.services.extraction import validate_extraction
    payload = {"claims": [{
        "statement": "We use Redis", "category": "decision",
        "related_identifier": None,
        "citations": [{"record_id": "rec_DOES_NOT_EXIST", "excerpt": "redis"}],
    }]}
    result = validate_extraction(payload, {"rec_real"})
    assert len(result.claims) == 1
    assert result.claims[0].citations == []  # unknown reference rejected


def test_gemini_validation_rejects_malformed():
    from app.services.extraction import validate_extraction
    with pytest.raises(ValueError):
        validate_extraction({"claims": [{"statement": "x", "category": "not-a-category"}]}, set())


# --- Reviewer persistence ---

def test_review_confirm_persists(client):
    r = client.post(f"/projects/{PROJECT}/claims/clm_003/review",
                    json={"action": "confirm", "reviewer": "Test Reviewer",
                          "comment": "Looks right"})
    assert r.status_code == 200
    assert r.json()["trustLabel"] == "reviewer-confirmed"
    # Persistence: a fresh GET reflects the change (no optimistic UI involved)
    claims = client.get(f"/projects/{PROJECT}/claims").json()
    match = next(c for c in claims if c["id"] == "clm_003")
    assert match["reviewStatus"] == "confirmed"
    assert match["trustLabel"] == "reviewer-confirmed"
    assert match["reviewedBy"] == "Test Reviewer"


def test_review_correct_persists(client):
    r = client.post(f"/projects/{PROJECT}/claims/clm_007/review",
                    json={"action": "correct", "reviewer": "Test Reviewer",
                          "correctedStatement": "Priya Raman and Alex Chen co-own notifications.",
                          "comment": "Backup owner should be listed too"})
    assert r.status_code == 200
    assert r.json()["trustLabel"] == "reviewer-corrected"
    claims = client.get(f"/projects/{PROJECT}/claims").json()
    match = next(c for c in claims if c["id"] == "clm_007")
    assert match["correctedStatement"].startswith("Priya Raman and Alex Chen")


def test_review_requires_corrected_statement(client):
    r = client.post(f"/projects/{PROJECT}/claims/clm_008/review",
                    json={"action": "correct", "reviewer": "X"})
    assert r.status_code == 422


def test_review_audit_entry(client):
    events = client.get(f"/projects/{PROJECT}/audit").json()
    assert any(e["action"] == "claim.confirmed" and e["entityId"] == "clm_003" for e in events)


# --- Handover ---

def test_handover_generation_developer(client):
    r = client.post(f"/projects/{PROJECT}/handover", json={"role": "developer"})
    assert r.status_code == 200
    body = r.json()
    titles = [s["title"] for s in body["sections"]]
    assert "Codebase entry points" in titles
    assert len(body["plan"]) == 3


def test_handover_stakeholder_excludes_code_detail(client):
    r = client.post(f"/projects/{PROJECT}/handover", json={"role": "stakeholder"})
    assert r.status_code == 200
    titles = [s["title"] for s in r.json()["sections"]]
    assert "Codebase entry points" not in titles
    assert "Dependencies" not in titles


def test_handover_get_latest(client):
    r = client.get(f"/projects/{PROJECT}/handover?role=developer")
    assert r.status_code == 200
    assert r.json()["role"] == "developer"


def test_handover_404_for_unknown_role_project(client):
    assert client.get("/projects/nope/handover?role=developer").status_code == 404


def test_approval_blocked_by_unresolved_conflicts(client):
    r = client.post(f"/projects/{PROJECT}/handover", json={"role": "developer"})
    hid = r.json()["id"]
    # clm_001 / clm_002 are conflicting + pending → approval must be refused
    r2 = client.post(f"/projects/{PROJECT}/handover/{hid}/approve",
                     json={"approver": "Judge"})
    assert r2.status_code == 409
    assert "conflict" in r2.json()["detail"].lower()


def test_approval_with_acknowledgement_then_immutable(client):
    r = client.post(f"/projects/{PROJECT}/handover", json={"role": "developer"})
    hid = r.json()["id"]
    r2 = client.post(f"/projects/{PROJECT}/handover/{hid}/approve",
                     json={"approver": "Judge", "acknowledgeConflicts": True})
    assert r2.status_code == 200
    assert r2.json()["approvedBy"] == "Judge"
    # Approved snapshot is immutable
    r3 = client.post(f"/projects/{PROJECT}/handover/{hid}/approve",
                     json={"approver": "Someone Else", "acknowledgeConflicts": True})
    assert r3.status_code == 409


def test_handover_versioning(client):
    before = client.get(f"/projects/{PROJECT}/handover?role=developer").json()["version"]
    r = client.post(f"/projects/{PROJECT}/handover", json={"role": "developer"})
    assert r.json()["version"] == before + 1


# --- Error handling ---

def test_review_unknown_claim(client):
    r = client.post(f"/projects/{PROJECT}/claims/nope/review",
                    json={"action": "confirm", "reviewer": "X"})
    assert r.status_code == 404


def test_unknown_source_kind(client):
    r = client.post(f"/projects/{PROJECT}/sources/email/upload",
                    json={"fileName": "x", "content": "y"})
    assert r.status_code == 404