import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaitlistWelcomeEmail } from "@/services/emailService";

const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_FIELD_LENGTH = 512;
const DEFAULT_PRIVACY_NOTICE_VERSION = process.env.GDPR_POLICY_VERSION ?? "2026-03-04";

interface WaitlistInsertRow {
  id: string;
  email: string;
  unsubscribe_token?: string | null;
  welcome_email_sent_at?: string | null;
  unsubscribed_at?: string | null;
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as PostgrestLikeError;
  return (
    value.code === "42703" || value.message?.includes("does not exist") === true
  );
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as PostgrestLikeError;
  return (
    value.code === "42P01" ||
    (value.message?.includes("relation") === true &&
      value.message?.includes("does not exist") === true)
  );
}

function isAdminClientConfigError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    )
  );
}

function logWaitlistError(context: string, error: unknown) {
  if (error && typeof error === "object") {
    const value = error as PostgrestLikeError;
    console.error(`[waitlist] ${context}`, {
      code: value.code,
      message: value.message,
      details: value.details,
      hint: value.hint,
    });
    return;
  }
  console.error(`[waitlist] ${context}`, error);
}

async function sendWelcomeEmailIfNeeded(
  row: WaitlistInsertRow,
  canPersistSendState: boolean,
) {
  if (row.welcome_email_sent_at) return;

  try {
    await sendWaitlistWelcomeEmail({
      email: row.email,
      unsubscribeToken: row.unsubscribe_token,
    });
  } catch (error) {
    console.error("[waitlist] Failed to send welcome email:", error);
    return;
  }

  if (!canPersistSendState || !row.id) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("waitlist")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", row.id);

    if (error && !isMissingColumnError(error)) {
      console.error(
        "[waitlist] Failed to persist welcome_email_sent_at:",
        error,
      );
    }
  } catch (error) {
    console.error("[waitlist] Failed to persist welcome_email_sent_at:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      const parsed = await request.json();
      if (parsed && typeof parsed === "object") {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    // --- Validate email ---
    const rawEmail = body?.email;
    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const email = rawEmail.toLowerCase().trim();

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json({ error: "Email is too long" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (body?.privacy_notice_acknowledged !== true) {
      return NextResponse.json(
        { error: "Privacy notice acknowledgement is required" },
        { status: 400 },
      );
    }

    // --- Collect analytics metadata ---
    const truncate = (val: unknown): string | null => {
      if (typeof val !== "string" || !val.trim()) return null;
      return val.trim().slice(0, MAX_FIELD_LENGTH);
    };

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;

    const privacyNoticeVersion =
      truncate(body.privacy_notice_version) ?? DEFAULT_PRIVACY_NOTICE_VERSION;
    const privacyAcknowledgedAt = new Date().toISOString();

    const baseRow = {
      email,
      referrer: truncate(body.referrer),
      utm_source: truncate(body.utm_source),
      utm_medium: truncate(body.utm_medium),
      utm_campaign: truncate(body.utm_campaign),
      landing_page: truncate(body.landing_page),
      user_agent:
        request.headers.get("user-agent")?.slice(0, MAX_FIELD_LENGTH) ?? null,
      ip_address: ip,
      privacy_notice_version: privacyNoticeVersion,
      privacy_acknowledged_at: privacyAcknowledgedAt,
    };

    const newsletterRow = {
      ...baseRow,
      newsletter_opt_in: body?.newsletter_opt_in === true,
    };

    const supabase = createAdminClient();
    let canPersistSendState = true;
    const insertResult = await supabase
      .from("waitlist")
      .insert(newsletterRow)
      .select(
        "id, email, unsubscribe_token, welcome_email_sent_at, unsubscribed_at",
      )
      .single();
    let data = insertResult.data as WaitlistInsertRow | null;
    let error = insertResult.error;

    // Backward compatibility: some environments still have legacy waitlist schema.
    if (error && isMissingColumnError(error)) {
      console.warn(
        "[waitlist] Falling back to legacy insert shape (missing newsletter columns).",
      );
      canPersistSendState = false;
      const legacyInsert = await supabase
        .from("waitlist")
        .insert(baseRow)
        .select("id, email")
        .single();
      data = legacyInsert.data as WaitlistInsertRow | null;
      error = legacyInsert.error;
    }

    // Older waitlist tables may only have an email column.
    if (error && isMissingColumnError(error)) {
      console.warn(
        "[waitlist] Falling back to email-only insert shape (missing analytics columns).",
      );
      const minimalInsert = await supabase
        .from("waitlist")
        .insert({ email })
        .select("id, email")
        .single();
      data = minimalInsert.data as WaitlistInsertRow | null;
      error = minimalInsert.error;
    }

    if (error) {
      // Unique constraint violation = already on waitlist
      if (error.code === "23505") {
        const existingResult = await supabase
          .from("waitlist")
          .select(
            "id, email, unsubscribe_token, welcome_email_sent_at, unsubscribed_at",
          )
          .eq("email", email)
          .maybeSingle();
        let existingRow = existingResult.data as WaitlistInsertRow | null;

        if (
          existingResult.error &&
          isMissingColumnError(existingResult.error)
        ) {
          canPersistSendState = false;
          const legacyExistingResult = await supabase
            .from("waitlist")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();
          existingRow = legacyExistingResult.data as WaitlistInsertRow | null;
          if (legacyExistingResult.error) {
            logWaitlistError(
              "Failed to read existing waitlist row with legacy columns.",
              legacyExistingResult.error,
            );
          }
        } else if (existingResult.error) {
          logWaitlistError(
            "Failed to read existing waitlist row after duplicate insert.",
            existingResult.error,
          );
        }

        if (existingRow) {
          if (existingRow.unsubscribed_at && body?.newsletter_opt_in === true) {
            await supabase
              .from("waitlist")
              .update({
                newsletter_opt_in: true,
                unsubscribed_at: null,
              })
              .eq("id", existingRow.id);
          }
          await sendWelcomeEmailIfNeeded(existingRow, canPersistSendState);
        }

        return NextResponse.json(
          { message: "You're already on the waitlist!" },
          { status: 200 },
        );
      }
      logWaitlistError("Failed to insert waitlist row.", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          {
            error:
              "Waitlist database table is missing. Run Supabase migrations and retry.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }

    await sendWelcomeEmailIfNeeded(
      data as WaitlistInsertRow,
      canPersistSendState,
    );

    return NextResponse.json(
      {
        message:
          "You're on the list! Check your inbox for a confirmation email.",
      },
      { status: 201 },
    );
  } catch (error) {
    logWaitlistError("Unhandled waitlist POST error.", error);
    if (isAdminClientConfigError(error)) {
      return NextResponse.json(
        {
          error:
            "Waitlist server configuration is incomplete. Set SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
