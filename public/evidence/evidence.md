# Executive Intent - Evidence Bundle

**Generated:** Jan 13, 2026, 01:52 PM CST
**Builder:** Claude Code

## Receipts

- **Commit:** `a9ded2b09cac01405fb42ca7caf1f72a2d452316` (main)
- **CI Run:** [local](https://github.com/intent-solutions-io/executive-intent/actions)
- **Deploy URL:** [https://executive-intent.web.app](https://executive-intent.web.app)
- **Deployed:** Jan 13, 2026, 01:52 PM CST

## Pipeline Health

**Overall Status:** ⚠ Degraded

> Pipeline degraded: supabase, embeddings needs attention [DOC_CHUNK_MISMATCH, DOC_VECTOR_MISMATCH, API_UNREACHABLE]

| Metric | Count |
|--------|-------|
| Documents Total | 11 |
| Documents Chunked | 2 |
| Documents Embedded | 2 |
| Documents DLP Scanned | 11 |
| Fully Processed | 2 |
| **Processing Rate** | **2/11 (18%)** |

### Subsystem Status

| Subsystem | Status |
|-----------|--------|
| supabase | ⚠ Degraded |
| inngest | ○ Configured |
| nightfall | ✓ Verified |
| google_oauth | ○ Configured |
| embeddings | ⚠ Degraded |

## Integration Details

### Supabase: ⚠ Degraded
> Coverage mismatch (eligible: 11, chunked: 2, embedded: 2) [DOC_CHUNK_MISMATCH, DOC_VECTOR_MISMATCH]

- Project: `abseweczdjkqxvvptqrv`
- Schema Version: 003
- pgvector: Enabled
- RLS: Verified
- Documents: 11
- Chunks: 2
- Vectors: 2
- Checked: Jan 13, 2026, 01:52 PM CST

### Inngest: ○ Configured
> Inngest configured; no observable workflow activity yet (no audit_events) [NO_DATA_OBSERVED_YET]

- Environment: production
- Recent Failures: 0
- Last Run IDs: None
- Last Success: Never
- Checked: Jan 13, 2026, 01:52 PM CST

### Nightfall DLP: ✓ Verified
> DLP verified: 11 allowed, 0 redacted, 0 quarantined [ALL_CHECKS_PASSED, DATA_FLOWING]

- Policy: executive-intent-dlp
- Scans: 11 allowed, 0 redacted, 0 quarantined
- Last Scan: Jan 12, 2026, 01:34 AM CST
- Checked: Jan 13, 2026, 01:52 PM CST

### Google OAuth: ○ Configured
> No OAuth-scoped active connection found (ignoring IMAP test connections) [NO_TOKEN, NO_DATA_OBSERVED_YET]

- Token Valid: No
- Scopes: https://www.googleapis.com/auth/gmail.readonly, https://www.googleapis.com/auth/calendar.readonly, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/userinfo.profile
- Last Connect: Never
- Checked: Jan 13, 2026, 01:52 PM CST

### Embeddings: ⚠ Degraded
> Embedding provider could not embed retrieval probes [API_UNREACHABLE]

- Vector Count: 2
- Last Index: Jan 12, 2026, 01:32 AM CST

#### Retrieval Test

- **Result:** ✗ FAILED
- Success Rate: 0/10 (threshold: 8)
- Top-K: 10
- Failures: 0 no results, 10 errors

##### Sample Queries

**Query:** "executive summary"
_No results_

**Query:** "action items"
_No results_

**Query:** "meeting notes"
_No results_

- Checked: Jan 13, 2026, 01:52 PM CST

## Security

Redaction rules applied: tokens, passwords, api_keys, jwt, oauth_secrets

## Notes

Some integrations degraded - system operational but needs attention. 2 of 11 documents fully processed. Retrieval test needs improvement (0/10, need 8).

---

*This evidence bundle was generated automatically by the CI pipeline.*