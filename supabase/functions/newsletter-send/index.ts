// Edge Function: newsletter-send
// Sends scheduled newsletter campaigns to waitlist subscribers.
// Intended to be called weekly from a Supabase cron job.

import { handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { sendResendEmail } from '../_shared/email.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const DEFAULT_RECIPIENT_LIMIT = 1000000;
const MAX_RECIPIENT_LIMIT = 1000000;
const PAGE_SIZE = 1000;

interface NewsletterCampaignRow {
  id: string;
  slug: string;
  subject: string;
  preview_text: string | null;
  html_body: string;
  text_body: string | null;
  scheduled_for: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
}

interface WaitlistRecipientRow {
  id: string;
  email: string;
  unsubscribe_token: string;
}

interface DeliverySentRow {
  waitlist_id: string;
}

interface NewsletterSendPayload {
  campaignId?: string;
  recipientLimit?: number;
  dryRun?: boolean;
}

function getAppBaseUrl(): string {
  const raw = Deno.env.get('APP_BASE_URL') ??
    Deno.env.get('NEXT_PUBLIC_APP_URL') ??
    'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

function isAuthorized(req: Request): boolean {
  const expectedToken = Deno.env.get('NEWSLETTER_CRON_BEARER_TOKEN');
  if (!expectedToken) return true;

  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${expectedToken}`;
}

function clampRecipientLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_RECIPIENT_LIMIT;
  }
  return Math.min(MAX_RECIPIENT_LIMIT, Math.max(1, Math.round(value)));
}

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildCampaignHtml(
  campaign: NewsletterCampaignRow,
  unsubscribeUrl: string,
): string {
  const baseHtml = campaign.html_body.includes('{{unsubscribe_url}}')
    ? campaign.html_body.replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
    : `${campaign.html_body}
      <p style="margin-top:24px;font-size:12px;color:#6b7280;">
        You are receiving this because you joined the Pitchr waitlist.
        <a href="${unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a>
      </p>`;

  const preheader = campaign.preview_text
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(campaign.preview_text)}
      </div>`
    : '';

  return `${preheader}${baseHtml}`;
}

function buildCampaignText(
  campaign: NewsletterCampaignRow,
  unsubscribeUrl: string,
): string {
  const baseText = campaign.text_body ?? campaign.preview_text ?? campaign.subject;

  if (baseText.includes('{{unsubscribe_url}}')) {
    return baseText.replaceAll('{{unsubscribe_url}}', unsubscribeUrl);
  }

  return `${baseText}\n\nUnsubscribe: ${unsubscribeUrl}`;
}

async function getCampaign(
  supabase: ReturnType<typeof createAdminClient>,
  payload: NewsletterSendPayload,
): Promise<NewsletterCampaignRow | null> {
  if (payload.campaignId) {
    if (!UUID_REGEX.test(payload.campaignId)) {
      throw new Error('Invalid campaignId');
    }

    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('id, slug, subject, preview_text, html_body, text_body, scheduled_for, status')
      .eq('id', payload.campaignId)
      .eq('status', 'scheduled')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return (data ?? null) as NewsletterCampaignRow | null;
  }

  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('id, slug, subject, preview_text, html_body, text_body, scheduled_for, status')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }

  return (data ?? null) as NewsletterCampaignRow | null;
}

async function loadRecipients(
  supabase: ReturnType<typeof createAdminClient>,
  recipientLimit: number,
): Promise<WaitlistRecipientRow[]> {
  const recipients: WaitlistRecipientRow[] = [];
  let from = 0;

  while (recipients.length < recipientLimit) {
    const pageSize = Math.min(PAGE_SIZE, recipientLimit - recipients.length);
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('waitlist')
      .select('id, email, unsubscribe_token')
      .eq('newsletter_opt_in', true)
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch recipients: ${error.message}`);
    }

    const rows = (data ?? []) as WaitlistRecipientRow[];
    recipients.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return recipients;
}

async function loadSentWaitlistIds(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
): Promise<Set<string>> {
  const sentWaitlistIds = new Set<string>();
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('newsletter_deliveries')
      .select('waitlist_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'sent')
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch delivery state: ${error.message}`);
    }

    const rows = (data ?? []) as DeliverySentRow[];
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      sentWaitlistIds.add(row.waitlist_id);
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return sentWaitlistIds;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  if (!isAuthorized(req)) {
    return errorResponse('Unauthorized', 401);
  }

  const payload: NewsletterSendPayload = {};

  if (req.method === 'POST') {
    try {
      const body = await req.json() as NewsletterSendPayload;
      payload.campaignId = body.campaignId;
      payload.recipientLimit = body.recipientLimit;
      payload.dryRun = body.dryRun;
    } catch {
      // Keep defaults for cron calls with empty body.
    }
  } else {
    const url = new URL(req.url);
    payload.campaignId = url.searchParams.get('campaignId') ?? undefined;

    const limitRaw = url.searchParams.get('recipientLimit');
    if (limitRaw) {
      const parsed = Number(limitRaw);
      if (Number.isFinite(parsed)) {
        payload.recipientLimit = parsed;
      }
    }
    payload.dryRun = parseBoolean(url.searchParams.get('dryRun'));
  }

  const recipientLimit = clampRecipientLimit(payload.recipientLimit);

  try {
    const supabase = createAdminClient();
    const campaign = await getCampaign(supabase, payload);

    if (!campaign) {
      return jsonResponse(
        { message: 'No scheduled newsletter campaign is due right now.' },
        200,
      );
    }

    const recipients = await loadRecipients(supabase, recipientLimit);
    const sentWaitlistIds = await loadSentWaitlistIds(supabase, campaign.id);

    const pendingRecipients = recipients.filter(
      (recipient) => !sentWaitlistIds.has(recipient.id),
    );

    if (payload.dryRun) {
      return jsonResponse(
        {
          campaignId: campaign.id,
          slug: campaign.slug,
          scheduledFor: campaign.scheduled_for,
          recipientsScanned: recipients.length,
          recipientsPending: pendingRecipients.length,
          recipientLimit,
          dryRun: true,
        },
        200,
      );
    }

    const { data: lockRow, error: lockError } = await supabase
      .from('newsletter_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaign.id)
      .eq('status', 'scheduled')
      .select('id')
      .maybeSingle();

    if (lockError) {
      return errorResponse(`Failed to lock campaign: ${lockError.message}`, 500);
    }

    if (!lockRow) {
      return jsonResponse(
        { message: 'Campaign is already being processed or already sent.' },
        409,
      );
    }

    const appBaseUrl = getAppBaseUrl();
    const successfulWaitlistIds: string[] = [];
    let sentCount = 0;
    let failedCount = 0;

    try {
      for (const recipient of pendingRecipients) {
        const unsubscribeUrl =
          `${appBaseUrl}/api/newsletter/unsubscribe?token=${recipient.unsubscribe_token}`;
        const html = buildCampaignHtml(campaign, unsubscribeUrl);
        const text = buildCampaignText(campaign, unsubscribeUrl);

        try {
          const sendResult = await sendResendEmail({
            to: recipient.email,
            subject: campaign.subject,
            html,
            text,
          });

          const { error: insertDeliveryError } = await supabase
            .from('newsletter_deliveries')
            .upsert(
              {
                campaign_id: campaign.id,
                waitlist_id: recipient.id,
                email: recipient.email,
                status: 'sent',
                provider_message_id: sendResult.id,
                error: null,
                sent_at: new Date().toISOString(),
              },
              { onConflict: 'campaign_id,waitlist_id' },
            );

          if (insertDeliveryError) {
            console.error(
              '[newsletter-send] Failed to persist sent delivery:',
              insertDeliveryError.message,
            );
          }

          successfulWaitlistIds.push(recipient.id);
          sentCount += 1;
        } catch (sendError) {
          failedCount += 1;
          const message = sendError instanceof Error ? sendError.message : 'Unknown send failure';

          const { error: insertError } = await supabase
            .from('newsletter_deliveries')
            .upsert(
              {
                campaign_id: campaign.id,
                waitlist_id: recipient.id,
                email: recipient.email,
                status: 'failed',
                provider_message_id: null,
                error: message.slice(0, 1024),
                sent_at: new Date().toISOString(),
              },
              { onConflict: 'campaign_id,waitlist_id' },
            );

          if (insertError) {
            console.error(
              '[newsletter-send] Failed to persist failed delivery:',
              insertError.message,
            );
          }
        }
      }

      if (successfulWaitlistIds.length > 0) {
        const { error: updateWaitlistError } = await supabase
          .from('waitlist')
          .update({ newsletter_last_sent_at: new Date().toISOString() })
          .in('id', successfulWaitlistIds);

        if (updateWaitlistError) {
          console.error(
            '[newsletter-send] Failed to update newsletter_last_sent_at:',
            updateWaitlistError.message,
          );
        }
      }

      const [recipientCountRes, sentCountRes] = await Promise.all([
        supabase
          .from('waitlist')
          .select('id', { count: 'exact', head: true })
          .eq('newsletter_opt_in', true)
          .is('unsubscribed_at', null),
        supabase
          .from('newsletter_deliveries')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent'),
      ]);

      const totalRecipients = recipientCountRes.count ?? 0;
      const totalSent = sentCountRes.count ?? 0;
      const isComplete = totalRecipients === 0 || totalSent >= totalRecipients;

      const { error: finalizeError } = await supabase
        .from('newsletter_campaigns')
        .update({
          status: isComplete ? 'sent' : 'scheduled',
          sent_at: isComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (finalizeError) {
        console.error('[newsletter-send] Failed to finalize campaign:', finalizeError.message);
      }

      return jsonResponse(
        {
          campaignId: campaign.id,
          slug: campaign.slug,
          sentThisRun: sentCount,
          failedThisRun: failedCount,
          totalRecipients,
          totalSent,
          status: isComplete ? 'sent' : 'scheduled',
          recipientLimit,
        },
        200,
      );
    } catch (processingError) {
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      return errorResponse(
        processingError instanceof Error
          ? processingError.message
          : 'Failed to process newsletter campaign.',
        500,
      );
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to send newsletter.',
      500,
    );
  }
});
