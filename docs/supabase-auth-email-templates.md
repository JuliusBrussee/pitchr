# Supabase Auth Email Templates (Pitchr Branding)

Paste each template into **Supabase Dashboard > Authentication > Email Templates**.
Each section has the **Subject** and **Body (HTML)**.

> **Note:** Supabase uses Go template variables like `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.
> These are automatically replaced at send time. Do not modify the `{{ }}` placeholders.
>
> **Design:** Editorial layout — Georgia serif headings (weight 400), 2px coral accent bar,
> 520px card, flat coral CTA buttons, generous whitespace. Matches the landing page.

---

## 1. Confirm Sign Up

**Subject:** `Confirm your Pitchr account`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="height:2px;background-color:#ff5941;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.7;font-size:15px;">
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#111827;line-height:1.25;font-family:Georgia,'Times New Roman',Times,serif;">Confirm your email</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">Verify your email to activate your Pitchr account.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background-color:#ff5941;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                Confirm Email
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              Did not create a Pitchr account? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 2. Invite User

**Subject:** `You've been invited to Pitchr`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="height:2px;background-color:#ff5941;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.7;font-size:15px;">
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#111827;line-height:1.25;font-family:Georgia,'Times New Roman',Times,serif;">You have been invited</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">Someone thinks you should try Pitchr. Score your pitch, get ranked fixes, and see a rewritten script.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background-color:#ff5941;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                Accept Invite
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              Not expecting this? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 3. Magic Link

**Subject:** `Your Pitchr sign-in link`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="height:2px;background-color:#ff5941;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.7;font-size:15px;">
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#111827;line-height:1.25;font-family:Georgia,'Times New Roman',Times,serif;">Sign in to Pitchr</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">This link expires in 10 minutes and can only be used once.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background-color:#ff5941;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                Sign In
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              Did not request this link? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email address`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="height:2px;background-color:#ff5941;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.7;font-size:15px;">
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#111827;line-height:1.25;font-family:Georgia,'Times New Roman',Times,serif;">Confirm your new email</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">You requested to change your email address on Pitchr.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background-color:#ff5941;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                Confirm New Email
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              Did not request this? Your account may be compromised. Reset your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 5. Reset Password

**Subject:** `Reset your Pitchr password`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="height:2px;background-color:#ff5941;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.7;font-size:15px;">
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#111827;line-height:1.25;font-family:Georgia,'Times New Roman',Times,serif;">Reset your password</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">We received a request to reset your Pitchr password.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background-color:#ff5941;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                Reset Password
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              Did not request this? You can safely ignore this email. Your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 6. Reauthentication

**Subject:** `Your Pitchr verification code`

> **Note:** Reauthentication uses a one-time code (`{{ .Token }}`), not a URL.

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9fb;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="height:2px;background-color:#ff5941;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.7;font-size:15px;">
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#111827;line-height:1.25;font-family:Georgia,'Times New Roman',Times,serif;">Verification code</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">Enter this code to verify your identity.</p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;padding:16px 40px;background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.08);border-radius:12px;font-size:32px;font-weight:500;letter-spacing:6px;color:#111827;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">
                {{ .Token }}
              </div>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              This code expires in 10 minutes. Did not request this? Change your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```
