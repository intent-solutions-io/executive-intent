# Executive Intent - Evidence Bundle

**Generated:** Jan 14, 2026, 12:42 PM CST
**Builder:** Claude Code

## Receipts

- **Commit:** `e5d6084e6bb426b50338549dc0605f5bdc72b3e5` (main)
- **CI Run:** [local](https://github.com/intent-solutions-io/executive-intent/actions)
- **Deploy URL:** [https://executive-intent.web.app](https://executive-intent.web.app)
- **Deployed:** Jan 14, 2026, 12:42 PM CST

## Pipeline Health

**Overall Status:** ○ Configured

> Pipeline at configured stage (bottleneck: google_oauth, inngest) [NO_TOKEN, NO_DATA_OBSERVED_YET]

| Metric | Count |
|--------|-------|
| Documents Total | 11 |
| Documents Chunked | 11 |
| Documents Embedded | 11 |
| Documents DLP Scanned | 11 |
| Fully Processed | 11 |
| **Processing Rate** | **11/11 (100%)** |

### Subsystem Status

| Subsystem | Status |
|-----------|--------|
| supabase | ✓ Verified |
| inngest | ○ Configured |
| nightfall | ✓ Verified |
| google_oauth | ○ Configured |
| embeddings | ✓ Verified |

## Integration Details

### Supabase: ✓ Verified
> Eligible docs reconcile (11/11 chunked, 11/11 embedded) [ALL_CHECKS_PASSED, DATA_FLOWING]

- Project: `abseweczdjkqxvvptqrv`
- Schema Version: 003
- pgvector: Enabled
- RLS: Verified
- Documents: 11
- Chunks: 11
- Vectors: 11
- Checked: Jan 14, 2026, 12:42 PM CST

### Inngest: ○ Configured
> Inngest configured; no observable workflow activity yet (no audit_events) [NO_DATA_OBSERVED_YET]

- Environment: production
- Recent Failures: 0
- Last Run IDs: None
- Last Success: Never
- Checked: Jan 14, 2026, 12:42 PM CST

### Nightfall DLP: ✓ Verified
> DLP verified: 11 allowed, 0 redacted, 0 quarantined [ALL_CHECKS_PASSED, DATA_FLOWING]

- Policy: executive-intent-dlp
- Scans: 11 allowed, 0 redacted, 0 quarantined
- Last Scan: Jan 12, 2026, 01:34 AM CST
- Checked: Jan 14, 2026, 12:42 PM CST

### Google OAuth: ○ Configured
> No OAuth-scoped active connection found (ignoring IMAP test connections) [NO_TOKEN, NO_DATA_OBSERVED_YET]

- Token Valid: No
- Scopes: https://www.googleapis.com/auth/gmail.readonly, https://www.googleapis.com/auth/calendar.readonly, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/userinfo.profile
- Last Connect: Never
- Checked: Jan 14, 2026, 12:42 PM CST

### Embeddings: ✓ Verified
> Retrieval verified (1/1 >= 1) [THRESHOLD_MET, DATA_FLOWING]

- Vector Count: 11
- Last Index: Jan 14, 2026, 12:37 PM CST

#### Retrieval Test

- **Result:** ✓ PASSED
- Success Rate: 1/1 (threshold: 1)
- Top-K: 10

##### Sample Queries

**Query:** "Welcome to Nightfall - Please verify your email"
| Doc ID | Chunk ID | Score |
|--------|----------|-------|
| 9bf1d5fb... | e9a1b0a2... | 1.000 |
| f288dfaa... | 9945b433... | 1.000 |
| 1ba33796... | ba7b435d... | 1.000 |

- Checked: Jan 14, 2026, 12:42 PM CST

## Security

Redaction rules applied: tokens, passwords, api_keys, jwt, oauth_secrets

## Notes

Integrations configured but not yet connected - complete setup to begin. Retrieval test passed (1/1).

---

*This evidence bundle was generated automatically by the CI pipeline.*