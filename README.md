# Executive Intent

> Your inbox + calendar, organized for decisions. DLP-enforced. Source-linked. Executive-ready.

Executive Intent is a secure decision layer over Gmail and Calendar that:

1. **Connects** to your Google account via OAuth
2. **Syncs** emails and calendar events incrementally
3. **Scans** all content with Nightfall DLP before indexing
4. **Indexes** allowed/redacted content as vector embeddings
5. **Searches** with AI-powered retrieval and source provenance

## Stack

- **Frontend**: Next.js 14 + React 19 + Tailwind CSS
- **Database**: Supabase (Postgres + pgvector)
- **Auth**: Supabase Auth
- **Workflows**: Inngest
- **Hosting**: Firebase Hosting
- **Infrastructure**: OpenTofu + Google Cloud

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI (optional, for local development)
- Google Cloud project (for KMS + Secret Manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/intent-solutions-io/executive-intent.git
cd executive-intent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Environment Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/`
3. Create a Google Cloud project and enable:
   - Cloud KMS
   - Secret Manager
   - Gmail API
   - Calendar API
4. Set up Google OAuth credentials
5. Get a Nightfall API key at [nightfall.ai](https://nightfall.ai)

## Project Structure

```
├── 000-docs/           # Documentation (doc-filing compliant)
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # React components
│   ├── lib/            # Core libraries
│   └── types/          # TypeScript types
├── supabase/           # Database migrations
├── infra/tofu/         # OpenTofu infrastructure
└── .github/workflows/  # CI/CD pipelines
```

## Security

- All content is scanned by Nightfall DLP before indexing
- OAuth tokens are encrypted using Cloud KMS envelope encryption
- Tenant isolation via Row Level Security (RLS)
- Full audit trail of all operations

## License

Proprietary - Intent Solutions IO
