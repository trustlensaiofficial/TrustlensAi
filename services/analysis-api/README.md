# TrustLens Analysis API (Python / Flask)

The deterministic detection engine, as a standalone Flask service.

## Why this exists

The product's warning-sign detection is pure text analysis: regular expressions
over a message, returning the exact spans that matched. It has no dependency on
React, on Next.js, or on any runtime detail of the web app — so it can live on
its own, and other clients (a future Android app, a bank's batch pipeline, a CLI)
can use it without running a Node server.

## What is honest about its status

This service implements the **deterministic rule layer**: the generic rules, the
bank/UPI context rules, and the Tamil rules. That is the layer the product
depends on and the layer that must keep working when everything else is
unavailable.

It does **not** implement the live URL evidence gathering or the AI explanation
layer. Those stay in the Next.js app, which already has the SSRF-hardened fetch
path and the model client. Nothing here calls out to the network at all.

The Next.js app is the production backend today. This service is the same rules
in Python, with its own tests, kept in step by a shared corpus of cases — it is
not a stub, and it is not currently in the request path for the deployed site.

## Run it

```bash
cd services/analysis-api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m trustlens.app            # http://127.0.0.1:5001
```

Production-style:

```bash
gunicorn -w 4 -b 0.0.0.0:5001 'trustlens.app:create_app()'
```

## Test it

```bash
pytest -q
```

## Endpoints

### `GET /health`

```json
{ "ok": true, "service": "trustlens-analysis-api", "rules": 41 }
```

### `POST /analyze`

```json
{ "text": "Your account will be blocked. Share the OTP now.", "context": "bank_scam" }
```

Returns the assessment, every matched signal with its exact span, and the
checklist. `context` is one of `generic`, `bank_scam`, `job_offer`, `invoice`,
`proposal`, `website`.

```bash
curl -s -X POST http://127.0.0.1:5001/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"Unga account block aagidum. OTP share pannunga.","context":"bank_scam"}'
```
