# Executive Intent Proof System

This document describes the evidence generation and verification system for Executive Intent, built by Claude Code.

## Overview

The proof system generates machine-readable evidence bundles that demonstrate Executive Intent's integrations are properly configured and operational. Evidence is regenerated on every CI/CD deployment, ensuring claims are always verifiable against the actual system state.

## How It Works

1. **Integration Checks** - Five scripts verify each integration:
   - Supabase (database, pgvector, RLS)
   - Inngest (workflow orchestration)
   - Nightfall (DLP enforcement)
   - Google OAuth (Gmail + Calendar access)
   - Embeddings (vector indexing)

2. **Evidence Generation** - Results are compiled into:
   - `public/evidence/evidence.json` - Machine-readable proof
   - `public/evidence/evidence.md` - Human-readable summary

3. **Secret Detection** - All output is scanned for credential patterns (JWTs, API keys, OAuth secrets) and blocked or redacted if found.

4. **CI Integration** - GitHub Actions runs `proof:generate` and `proof:verify` on every deploy, ensuring the deployed site always reflects current system state.

## Running Locally

```bash
# Generate evidence bundle
pnpm proof:generate

# Verify evidence (schema validation, secret detection)
pnpm proof:verify
```

## Evidence Bundle Schema

```json
{
  "product": "Executive Intent",
  "generated_at": "ISO timestamp",
  "builder": "Claude Code",
  "commit": { "hash": "...", "branch": "..." },
  "ci": { "provider": "...", "workflow": "...", "run_id": "...", "run_url": "..." },
  "deploy": { "target": "...", "firebase_project": "...", "site": "...", "url": "...", "completed_at": "..." },
  "integrations": {
    "supabase": { "status": "OK|DEGRADED|BLOCKED", "project_ref": "...", ... },
    "inngest": { "status": "...", "env": "...", "last_run_ids": [...], ... },
    "nightfall": { "status": "...", "policy_name": "...", "last_scan_counts": {...}, ... },
    "google_oauth": { "status": "...", "scopes": [...], "last_connect_at": "...", ... },
    "embeddings": { "status": "...", "vector_count": N, "retrieval_test": {...}, ... }
  },
  "redactions": { "rules_applied": [...] },
  "notes": "Summary of system state"
}
```

## Integration Status Values

| Status | Meaning |
|--------|---------|
| `OK` | Integration verified and operational |
| `DEGRADED` | Integration works but has issues |
| `BLOCKED` | Integration not configured or unavailable |

## CI/CD Pipeline

The GitHub Actions workflow (`deploy.yml`) includes:

1. Lint, type-check, and test
2. Build Next.js application
3. **Generate evidence bundle** (`pnpm proof:generate`)
4. **Verify evidence bundle** (`pnpm proof:verify`) - fails CI if invalid
5. Authenticate to GCP via Workload Identity Federation
6. Deploy to Firebase Hosting

Evidence is generated fresh on every deploy. The deployed site at `https://executive-intent.web.app` always displays current system state.

## Security

- No secrets are included in evidence bundles
- Secret patterns are detected via regex and blocked/redacted
- Redaction rules are documented in `evidence.json` under `redactions.rules_applied`
- Only safe metadata is exposed (counts, timestamps, status codes)

## Files

| File | Purpose |
|------|---------|
| `scripts/proof/generate.ts` | Main evidence generator |
| `scripts/proof/verify.ts` | Schema and secret validation |
| `scripts/proof/checks/*.ts` | Individual integration checks |
| `src/lib/evidence/types.ts` | TypeScript type definitions |
| `src/lib/evidence/format.ts` | Formatting utilities |
| `src/lib/evidence/loadEvidence.ts` | Client/server evidence loaders |
| `public/evidence/evidence.json` | Generated evidence (JSON) |
| `public/evidence/evidence.md` | Generated evidence (Markdown) |

## Verification

To independently verify the evidence:

1. Download `evidence.json` from the deployed site
2. Check the CI run URL - see the build that generated it
3. Verify the git commit - inspect the source code
4. Compare integration status against vendor dashboards

The evidence is reproducible: running `pnpm proof:generate` locally produces equivalent output.
