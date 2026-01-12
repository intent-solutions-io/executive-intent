# 001-ARCH: Architecture Overview

## Executive Intent - Architecture

### Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 + React 19 | App router, SSR, API routes |
| Styling | Tailwind CSS | Utility-first styling |
| Database | Supabase (Postgres + pgvector) | Data persistence + vector search |
| Auth | Supabase Auth | JWT-based authentication |
| Workflows | Inngest | Background jobs, event-driven pipelines |
| Hosting | Firebase Hosting | Static + SSR deployment |
| IaC | OpenTofu | Infrastructure as code |
| CI/CD | GitHub Actions + WIF | Automated deployments |

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│   Next.js   │────▶│  Supabase   │
│  Browser    │◀────│   App       │◀────│   Auth      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Inngest   │
                    │  Workflows  │
                    └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │  Gmail   │     │ Nightfall│     │ Vertex AI│
   │   API    │     │   DLP    │     │ Embed    │
   └──────────┘     └──────────┘     └──────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  pgvector   │
                    └─────────────┘
```

### Security Model

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Row Level Security (RLS) on all tables
3. **Token Storage**: KMS envelope encryption for OAuth refresh tokens
4. **DLP**: Nightfall scans before any content is indexed
5. **Audit**: All operations logged to audit_events table

### Inngest Workflows

| Event | Description |
|-------|-------------|
| `google/connect.completed` | Initialize sync after OAuth |
| `gmail/sync.requested` | Incremental Gmail sync |
| `calendar/sync.requested` | Incremental Calendar sync |
| `dlp/scan.requested` | Nightfall DLP scan |
| `embedding/index.requested` | Generate embeddings |
| `retention/enforce.requested` | Data retention cleanup |
| `google/disconnect.requested` | Purge data on disconnect |

### Directory Structure

See project root for full structure. Key directories:

- `src/app/` - Next.js App Router pages
- `src/lib/` - Core libraries and utilities
- `src/components/` - React components
- `supabase/` - Database migrations
- `infra/tofu/` - OpenTofu infrastructure
- `.github/workflows/` - CI/CD pipelines
