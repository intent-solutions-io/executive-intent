# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

**Executive Intent** — secure decision layer over Gmail and Calendar. Connects via OAuth → syncs incrementally → DLP-scans (Nightfall) → indexes as vector embeddings (pgvector) → search with AI retrieval + source provenance.

**Repo**: https://github.com/intent-solutions-io/executive-intent

## Stack

- **Frontend**: Next.js 14 + React 19 + Tailwind CSS
- **Database**: Supabase (Postgres + pgvector)
- **Auth**: Supabase Auth
- **Workflows**: Inngest (durable workflows for sync + indexing)
- **DLP**: Nightfall (PII / sensitive-content scrubbing before indexing)
- **Hosting**: Firebase Hosting
- **Infrastructure**: OpenTofu + Google Cloud

Source under `src/`:
- `src/app/` — Next.js App Router (route groups `(auth)` / `(dashboard)`, API handlers in `src/app/api/*/route.ts`)
- `src/components/` — React UI
- `src/lib/` — integrations: Supabase, Google, Nightfall, Inngest, crypto, embeddings
- `src/__tests__/` + `src/test-utils/` — Vitest setup
- `scripts/proof/` — proof/evidence generation + verification

## Development

```bash
pnpm install          # or npm install
pnpm dev              # Next.js dev server
pnpm test             # Vitest
pnpm test:watch       # Vitest watch mode
pnpm test:coverage    # with coverage
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
pnpm build            # production build
pnpm proof:generate   # proof/evidence generation
pnpm proof:verify     # verify evidence
```

See `AGENTS.md` for the full repository guidelines.

## Secrets (template — adopt SOPS+age)

This repo currently uses environment variables (Firebase Hosting + GCP service account credentials, Supabase keys, Nightfall API key, Inngest signing key). Per `~/.claude/CLAUDE.md` § "SOPS + age secrets standard", this repo should adopt the canonical 4-file pattern:

```bash
cd ~/000-projects/executive-intent
sops-init
```

Tracked separately under VPS-as-the-home Priority 6 (`OPS-z9b`).

## Testing baseline (2026-05-01 — Intent Solutions Testing SOP)

This repo participates in the **Intent Solutions Testing SOP** per `~/.claude/CLAUDE.md` § "Intent Solutions Testing SOP" and the VPS-as-the-home program (`OPS-5nm`, Priority 6).

**Installed**: `@intentsolutions/audit-harness v0.1.0` vendored at `.audit-harness/` with wrapper at `scripts/audit-harness`. Hash-pinning + escape-scan ride along the in-repo install — never reference `~/.claude/` paths from hooks or CI.

**Commands**:

```bash
scripts/audit-harness verify          # exit 2 = HARNESS_TAMPERED
scripts/audit-harness init            # initialize / re-init hash manifest
scripts/audit-harness list            # show pinned files
scripts/audit-harness escape-scan --staged   # scan a diff for escape attempts
```

**Next step**: run `/audit-tests` to produce `TEST_AUDIT.md`. See `000-docs/audit-harness-test-baseline-2026-05-01.md`.

**Upgrade**: `AUDIT_HARNESS_VERSION=vX.Y.Z curl -sSL https://raw.githubusercontent.com/jeremylongshore/audit-harness/main/install.sh | bash`. Or run `/sync-testing-harness` from any session.

## Filing standard

`000-docs/` uses a mixed convention — early entries follow the `NNN-SECTION-name.md` pattern (e.g. `001-ARCH-architecture-overview.md`, `008-UX-user-journey.md`). For consistency with the v3.0 standard at `~/002-command-bible/DOCUMENT-FILING-STANDARD-v3.0.md`, new docs should use `NNN-CC-ABCD-description.ext` format. Sequence continues from `008`.

## Bead workflow

Per `~/.claude/CLAUDE.md` § "Task Tracking with Beads (bd)". Cross-cutting ops work tracks under prefix `OPS` at the home-level beads dir (`~/.beads/`). This repo doesn't have its own beads dir.

## Repo URL

`https://github.com/intent-solutions-io/executive-intent`
