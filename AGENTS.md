# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: Next.js App Router (route groups like `(auth)` / `(dashboard)`, API handlers in `src/app/api/*/route.ts`)
- `src/components/`: shared React UI components (Tailwind)
- `src/lib/`: integrations + core logic (Supabase, Google, Nightfall, Inngest, crypto, embeddings)
- `src/__tests__/` + `src/test-utils/`: Vitest unit tests and shared test setup
- `scripts/proof/`: proof/evidence generation + verification helpers
- `supabase/`: SQL migrations and Supabase functions
- `infra/tofu/`: OpenTofu (Terraform) config for GCP resources

## Build, Test, and Development Commands

CI runs Node 20 + `pnpm` (v9). Typical local flow:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- `pnpm dev`: run the app on `http://localhost:3000`
- `pnpm lint`: ESLint (Next.js config)
- `pnpm type-check`: TypeScript (`tsc --noEmit`)
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`: Vitest (Node environment)
- `pnpm build` / `pnpm start`: production build + server
- `pnpm proof:generate` / `pnpm proof:verify` / `pnpm proof:screenshots`: proof tooling (uses Playwright for screenshots)

## Coding Style & Naming Conventions

- TypeScript is `strict`; prefer explicit types and avoid `any`.
- Use the `@/` import alias for `src` (example: `import { env } from "@/lib/utils"`).
- Match existing formatting: 2-space indentation, double quotes, semicolons.
- Components are `PascalCase.tsx`; utilities/modules are typically lowercase (for example `src/lib/crypto/envelope.ts`).

## Testing Guidelines

- Name tests `*.test.ts`/`*.test.tsx` and keep them deterministic (mock time via `globalThis.testHelpers` in `src/test-utils/setup.ts`).
- Prefer unit tests around `src/lib/**` logic; avoid hitting real external services in CI.

## Commit & Pull Request Guidelines

- Follow Conventional Commits used in history: `feat: ...`, `fix: ...`, `feat(scope): ...`.
- PRs: include a clear description, link the relevant issue, add screenshots for UI changes, and ensure `pnpm lint && pnpm type-check && pnpm test` pass.

## Security & Configuration Tips

- Copy `.env.example` to `.env.local`; never commit secrets. Only `NEXT_PUBLIC_*` vars are safe to expose to the client.
- For database changes, add additive migrations under `supabase/migrations/###_description.sql`.
