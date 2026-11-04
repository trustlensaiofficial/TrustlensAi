"""HTTP contract tests."""

import json

import pytest

from trustlens.app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def post(client, payload):
    return client.post("/analyze", data=json.dumps(payload), content_type="application/json")


def test_health_reports_what_it_can_and_cannot_do(client):
    body = client.get("/health").get_json()
    assert body["ok"] is True
    assert body["capabilities"]["deterministicRules"] is True
    # Honesty: this service does no network work, and says so.
    assert body["capabilities"]["liveUrlChecks"] is False
    assert body["capabilities"]["contextualAnalysis"] is False


def test_analyze_returns_a_report(client):
    res = post(client, {"text": "Share the OTP now", "context": "bank_scam"})
    assert res.status_code == 200
    report = res.get_json()["report"]
    assert report["assessment"]["level"] == "high_risk"
    assert report["signals"]
    assert report["checklist"]


def test_rejects_missing_text(client):
    assert post(client, {"context": "generic"}).status_code == 400
    assert post(client, {"text": "   "}).status_code == 400


def test_rejects_a_bad_context(client):
    assert post(client, {"text": "hello there", "context": "nonsense"}).status_code == 400


def test_rejects_oversized_input(client):
    assert post(client, {"text": "a" * 9000}).status_code == 413


def test_rejects_a_non_object_body(client):
    res = client.post("/analyze", data="[]", content_type="application/json")
    assert res.status_code == 400


def test_unknown_endpoint_is_helpful(client):
    body = client.get("/nope").get_json()
    assert "health" in body["error"]
