# Supabase Setup Guide

## 1. Project Credentials

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard → Settings → API

## 2. Run Migrations

All SQL migrations live in `migrations/` at the project root. Run them **in order** in the Supabase Dashboard → SQL Editor:

| File | What it does |
|------|-------------|
| `01-create-decks-table.sql` | Creates the `decks` table (deck metadata) |
| `02-create-slides-table.sql` | Creates the `slides` table (per-slide text, FK to decks) |
| `03-create-decks-storage-bucket.sql` | Creates the `decks` storage bucket (public, 50 MB limit) |
| `04-storage-policies.sql` | Adds public read/upload/delete policies (no auth in MVP) |
| `05-create-runs-table.sql` | Creates the `runs` table for pitch analysis payloads |
| `08-add-run-lifecycle-columns.sql` | Adds async run lifecycle columns (`queued/running/complete/failed`) |
| `09-create-recordings-bucket.sql` | Creates the `recordings` storage bucket |
| `10-recordings-storage-policies.sql` | Adds public recording read/upload/delete policies |
| `11-create-qa-sessions-table.sql` | Creates `qa_sessions` linked to `runs` for live VC Q&A persistence |
| `12-create-qa-resource-gaps-table.sql` | Creates `qa_resource_gaps` queue for async knowledge refresh |
| `13-add-user-id-columns.sql` | Adds `user_id` columns to existing tables for auth scoping |
| `14-rls-user-scoped-policies.sql` | RLS policies scoped to authenticated user |
| `15-storage-user-scoped-policies.sql` | Storage policies scoped to authenticated user |
| `16-create-settings-table.sql` | Creates `settings` table for user preferences |
| `17-create-waitlist-table.sql` | Creates `waitlist` table for pre-launch signups |
| `18-create-subscriptions-table.sql` | Creates `subscriptions` table (plan, Stripe IDs, period) |
| `19-create-usage-tracking-table.sql` | Creates `usage_events` table for rate limiting |
| `20-create-billing-events-table.sql` | Creates `billing_events` table for Stripe webhook idempotency |
| `21-create-day-passes-table.sql` | Creates `day_passes` table for 24h access passes |

**Quick run (all at once):**

```bash
cat migrations/*.sql | pbcopy
```

Then paste into the SQL Editor and execute.

All migrations use `if not exists` / `on conflict` guards, so they're safe to re-run.

## 4. Additional Environment Variables

For live VC Q&A and post-analysis features, add:

```env
ELEVENLABS_API_KEY_CONVAI=your-elevenlabs-api-key
ELEVENLABS_CONVAI_AGENT_ID=your-convai-agent-id
ENABLE_SECTION_FEEDBACK=true
ENABLE_REWRITE_DIFF=true
```

## 3. Verify Setup

After running the migrations, verify in Supabase Dashboard:

- **Table Editor:** `decks` and `slides` tables should appear
- **Storage:** `decks` bucket should appear
- **API:** Test with `curl` or browser:
  ```
  GET https://your-project.supabase.co/rest/v1/decks
  Headers: apikey: your-anon-key
  ```

## File Path Convention

Uploaded files are stored as:

```
decks/{deck_id}/original.pptx   (or .pdf)
decks/{deck_id}/slides.pdf      (converted PDF, always present)
```
