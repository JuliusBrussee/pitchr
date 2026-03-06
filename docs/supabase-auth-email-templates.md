# Supabase Auth Email Templates (Pitchr Branding)

Paste each template into **Supabase Dashboard > Authentication > Email Templates**.
Each section has the **Subject** and **Body (HTML)**.

> **Note:** Supabase uses Go template variables like `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.
> These are automatically replaced at send time. Do not modify the `{{ }}` placeholders.

---

## 1. Confirm Sign Up

**Subject:** `Confirm your Pitchr account`

**Body:**

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Confirm your email</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
              Thanks for signing up. Tap the button below to verify your email and activate your account.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                Confirm Email
              </a>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              If you didn't create a Pitchr account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">You're invited</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
              Someone invited you to join Pitchr, the AI pitch coach that scores your pitch and gives you ranked fixes. Tap below to create your account.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                Accept Invite
              </a>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Sign in to Pitchr</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
              Tap the button below to sign in. This link expires in 10 minutes and can only be used once.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                Sign In
              </a>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              If you didn't request this link, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Confirm your new email</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
              You requested to change your email address on Pitchr. Tap below to confirm this new address.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                Confirm New Email
              </a>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              If you didn't request this change, your account may be compromised. Please reset your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Reset your password</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
              We received a request to reset your Pitchr password. Tap below to choose a new one.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                Reset Password
              </a>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              If you didn't request a password reset, you can safely ignore this email. Your password won't change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pitchr &mdash; AI pitch coach</span>
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

**Body:**

> **Note:** Reauthentication uses a one-time code (`{{ .Token }}`), not a URL.

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Verification code</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
              Enter this code to verify your identity and continue with your action.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;padding:16px 40px;background:#f8f9fa;border:1px solid rgba(0,0,0,0.08);border-radius:12px;font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">
                {{ .Token }}
              </div>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              This code expires in 10 minutes. If you didn't request this, please change your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pitchr &mdash; AI pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```
