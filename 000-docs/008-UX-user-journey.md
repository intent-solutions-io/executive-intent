# 008-UX: User Journey

## Executive Intent - User Journey

### Personas

| Persona | Goals | Concerns |
|---------|-------|----------|
| **Executive/Operator** | Single place for commitments, threads, decisions | Speed, trust, "show me the source" |
| **Admin/Security Owner** | Permissions, data minimization, auditability | Proof that DLP happens before indexing |

---

## Journey Overview

**Executive Intent** is a secure decision layer over Gmail + Calendar:

1. Connect Google
2. Sync Gmail + Calendar
3. Nightfall DLP scans content
4. Allowed/redacted content becomes vector-indexed
5. User searches/asks questions and gets answers with provenance
6. Ongoing sync + controls + clean offboarding

---

## Stage 1: Entry + Authentication

### Step 1.1: Visit Executive Intent
- User lands on the web app
- Sees a clear promise: "Your inbox + calendar, organized for decisions. DLP enforced."

### Step 1.2: Sign in
- User signs in (Supabase Auth)
- After sign-in, UI routes to onboarding if no data connections exist

**User outcome:** "I'm in, now show me how to connect."

---

## Stage 2: Connect Google (OAuth)

### Step 2.1: Connect Gmail + Calendar
- User clicks **Connect Google**
- Redirects to Google consent screen
- Approves requested scopes (read-only by default)

### Step 2.2: Return to Executive Intent
- User is routed to **Connection Status** screen:
  - Connected ✅
  - Permissions summary
  - Last sync status (initially "not started")

**User outcome:** "It's connected and I can see what it will access."

---

## Stage 3: Initial Import (First Sync)

### Step 3.1: Start the first sync
- Sync begins automatically after connect (or user clicks "Start Import")
- UI shows multi-step progress:
  - Fetching Gmail…
  - Fetching Calendar…
  - Scanning for sensitive data…
  - Indexing for search…

### Step 3.2: Progress + transparency
- Show counters as they move:
  - Items processed
  - Items indexed
  - Items redacted
  - Items quarantined

**User outcome:** "I can tell what's happening and it feels controlled."

---

## Stage 4: Safety Gate (Nightfall DLP)

Every message/event goes through Nightfall before it becomes searchable.

### Step 4.1: DLP decision outcomes
- **Allowed:** content can be indexed
- **Redacted:** sensitive spans removed, then indexed
- **Quarantined:** metadata only; no text stored, no embeddings

### Step 4.2: User-visible "Data Safety" summary
Executive Intent shows a simple panel:
- Indexed: N
- Redacted: N
- Quarantined: N

### Step 4.3: Quarantine details (without leaking content)
- User can open a quarantined item to see:
  - Source: Gmail/Calendar
  - Date/time
  - Participants
  - DLP category counts (no raw sensitive text)

**User outcome:** "It's not blindly ingesting everything; it's filtering."

---

## Stage 5: Home Screen (Decision OS)

Once data is indexed, the user lands on the primary dashboard.

### Step 5.1: The core interaction
At the top: a single **Search / Ask** box:
- "What did I commit to this week?"
- "What's the latest thread with [Name]?"
- "What meetings mention budget, hiring, or roadmap?"

### Step 5.2: Decision views (prebuilt panels)
- **Upcoming obligations** (Calendar-first + email context)
- **Open loops** (threads with no reply in X days)
- **Top people / topics** (by recency + volume)
- **Stale but important** (older items resurfaced by signals)

**User outcome:** "This is my operating picture, not just a search box."

---

## Stage 6: Search → Results With Provenance

### Step 6.1: User runs a query
- User searches or asks a question
- System retrieves relevant chunks (vector search) and groups them

### Step 6.2: Results are always source-linked
Each result includes:
- Gmail thread/event title
- Timestamp
- Participants
- Sanitized snippet (redacted if needed)
- "Open in Gmail" / "Open in Calendar" link

### Step 6.3: Trust requirement (non-negotiable UX rule)
Executive Intent must never show an answer without showing:
- The supporting sources
- The exact items it came from

**User outcome:** "I trust it because it shows receipts."

---

## Stage 7: Continuous Sync

### Step 7.1: Background sync schedule
- Inngest runs periodic sync:
  - New emails/events pulled incrementally
  - DLP enforced
  - Embeddings updated

### Step 7.2: Visible freshness indicator
On the dashboard:
- "Last synced: X minutes ago"
- "New since last sync: indexed N / redacted N / quarantined N"

**User outcome:** "It's alive and current without me babysitting it."

---

## Stage 8: Controls (Privacy, Retention, Offboarding)

### Step 8.1: Privacy & retention settings
User (or admin) can:
- Set retention window (30/90/365 days)
- Trigger delete-by-range (Phase 2)
- Review DLP outcomes

### Step 8.2: Disconnect Google (clean exit)
- User clicks **Disconnect**
- Executive Intent revokes tokens and purges stored content/vectors
- UI confirms completion

**User outcome:** "I can leave cleanly and prove it."

---

## One-Sentence Summary

**Executive Intent** turns Gmail + Calendar into a decision-ready system by enforcing Nightfall DLP before indexing and enabling fast, source-linked retrieval over sanitized embeddings.
