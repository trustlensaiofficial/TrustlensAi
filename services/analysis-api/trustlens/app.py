"""Flask application exposing the deterministic analysis engine."""

from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from .report import build
from .rules import CONTEXTS, ALL_RULES

#: Mirrors the Next.js limit, so the two backends accept the same inputs.
MAX_TEXT = 8_000


def create_app() -> Flask:
    app = Flask(__name__)
    # The browser app and this service are different origins in development.
    CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "OPTIONS"])

    @app.get("/health")
    def health():
        return jsonify(
            ok=True,
            service="trustlens-analysis-api",
            rules=len(ALL_RULES),
            capabilities={
                "deterministicRules": True,
                # Stated plainly: this service does no network work at all.
                "liveUrlChecks": False,
                "contextualAnalysis": False,
            },
            notes=[
                "Deterministic rules only. Live link checks and the AI layer are "
                "served by the Next.js application.",
            ],
        )

    @app.post("/analyze")
    def analyze():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify(error="Send a JSON object with a 'text' field."), 400

        text = payload.get("text")
        if not isinstance(text, str) or not text.strip():
            return jsonify(error="'text' is required and must be a non-empty string."), 400
        if len(text) > MAX_TEXT:
            return jsonify(error=f"'text' must be {MAX_TEXT} characters or fewer."), 413

        context = payload.get("context", "generic")
        if context not in CONTEXTS:
            return jsonify(error=f"'context' must be one of: {', '.join(CONTEXTS)}."), 400

        return jsonify(report=build(text, context))

    @app.errorhandler(404)
    def not_found(_):
        return jsonify(error="No such endpoint. Try GET /health or POST /analyze."), 404

    return app


app = create_app()

if __name__ == "__main__":
    # Development only. Production uses gunicorn; see the README.
    app.run(host="127.0.0.1", port=5001, debug=False)
