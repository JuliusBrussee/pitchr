# Waitlist Email + Weekly Newsletter Setup

This repo now supports:

1. Transactional welcome email when a user joins the waitlist (`POST /api/waitlist`)
2. Weekly newsletter sends from Supabase Edge Function (`newsletter-send`)

## 1. Apply migrations

Run Supabase migrations so waitlist/newsletter tables exist:

- `supabase/migrations/20260228000004_waitlist_email_newsletters.sql`

## 2. Configure environment variables

### Next.js app (`.env.local`)

- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL` (for unsubscribe links)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO` (optional)

### Supabase Edge secrets

Set these in Supabase project secrets:

- `APP_BASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO` (optional)
- `NEWSLETTER_CRON_BEARER_TOKEN` (shared secret for cron trigger)

## 3. Deploy edge function

```bash
supabase functions deploy newsletter-send --no-verify-jwt
```

## 4. Create a newsletter campaign

Insert one scheduled campaign per weekly update:

```sql
insert into public.newsletter_campaigns (
  slug,
  subject,
  preview_text,
  html_body,
  text_body,
  scheduled_for,
  status
) values (
  'week-1-build-update',
  'Pitchr Weekly Build Update',
  'What shipped this week and what is next.',
  '<h2>Pitchr Build Update</h2><p>We shipped...</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
  'Pitchr Build Update\n\nWe shipped...\n\nUnsubscribe: {{unsubscribe_url}}',
  now() + interval '1 day',
  'scheduled'
);
```

`{{unsubscribe_url}}` is replaced automatically during send.

## 5. Add weekly Supabase cron trigger

Run this in Supabase SQL editor (replace `<project-ref>` and `<token>`):

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('newsletter_send_weekly')
where exists (
  select 1 from cron.job where jobname = 'newsletter_send_weekly'
);

select cron.schedule(
  'newsletter_send_weekly',
  '0 14 * * 1',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/newsletter-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <token>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

The cron expression above sends every Monday at 14:00 UTC.

## 6. Optional manual trigger

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/newsletter-send" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```
