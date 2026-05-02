# 009-OD-SOPS-audit-harness-baseline-2026-05-01

**Document type**: Standard Operating Procedure (SOPS) — testing baseline
**Category**: Operations & Deployment (OD)
**Program**: VPS-as-the-home (`OPS-5nm`), Priority 6 (`OPS-z9b`) — fan-out batch
**Pilot reference**: jeremylongshore/Hybrid-ai-stack-intent-solutions PR #4

## What got installed

`@intentsolutions/audit-harness v0.1.0` vendored via:

```bash
curl -sSL https://raw.githubusercontent.com/jeremylongshore/audit-harness/main/install.sh | bash
```

Drops `.audit-harness/` (scripts) and `scripts/audit-harness` (wrapper).

## CLAUDE.md authored (was missing)

This repo had no `CLAUDE.md` before this batch. Authored per the IS template covering:
- What this is (Gmail/Calendar decision layer with DLP + vector search)
- Stack (Next.js 14, Supabase + pgvector, Nightfall DLP, Inngest, Firebase Hosting)
- Source layout (`src/app/`, `src/lib/`, `src/__tests__/`)
- Development commands (`pnpm dev/test/lint/type-check/build/proof:*`)
- Secrets guidance (recommend `sops-init`)
- Testing baseline (this section + harness)
- Filing standard (sequence continues from `008-`)

## Deferred

- `/audit-tests` skill run → `TEST_AUDIT.md`
- `tests/TESTING.md` policy authorship
- Pre-commit + CI wiring for `escape-scan --staged`
- SOPS+age adoption (`sops-init`)

## Cross-references

- Plan: `~/000-projects/intentsolutions-vps-runbook/plans/2026-05-01-vps-as-the-home/00-plan.md` § Priority 6
- Tracker: `~/000-projects/intentsolutions-vps-runbook/docs/repo-baseline-tracker.md`
- IS Testing SOP: `~/.claude/CLAUDE.md`
- Bead: `OPS-z9b`
