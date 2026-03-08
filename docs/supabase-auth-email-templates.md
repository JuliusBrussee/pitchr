# Supabase Auth Email Templates (Pitchr Branding)

Paste each template into **Supabase Dashboard > Authentication > Email Templates**.
Each section has the **Subject** and **Body (HTML)**.

> **Note:** Supabase uses Go template variables like `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.
> These are automatically replaced at send time. Do not modify the `{{ }}` placeholders.
>
> **Design:** All templates use the shared Pitchr email layout — coral/amber accent bar,
> 520px card with 20px radius, gradient CTA buttons, and fading gradient dividers.

---

## 1. Confirm Sign Up

**Subject:** `Confirm your Pitchr account`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#ff5941,#ffaa33);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.65;font-size:15px;">
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;line-height:1.3;">Confirm your email</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">One tap and you are in. Verify your email to activate your Pitchr account.</p>
            <div style="text-align:center;margin:28px 0 8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(255,89,65,0.3);letter-spacing:0.2px;">
                Confirm Email
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
              Did not create a Pitchr account? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06) 15%,rgba(0,0,0,0.06) 85%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 36px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#ff5941,#ffaa33);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.65;font-size:15px;">
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;line-height:1.3;">You are invited</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">Someone thinks you should try Pitchr — the AI pitch coach that scores your pitch and gives you ranked fixes.</p>
            <div style="text-align:center;margin:28px 0 8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(255,89,65,0.3);letter-spacing:0.2px;">
                Accept Invite
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
              Not expecting this? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06) 15%,rgba(0,0,0,0.06) 85%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 36px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#ff5941,#ffaa33);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.65;font-size:15px;">
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;line-height:1.3;">Sign in to Pitchr</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">Tap the button below to sign in. This link expires in 10 minutes and can only be used once.</p>
            <div style="text-align:center;margin:28px 0 8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(255,89,65,0.3);letter-spacing:0.2px;">
                Sign In
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
              Did not request this link? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06) 15%,rgba(0,0,0,0.06) 85%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 36px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#ff5941,#ffaa33);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.65;font-size:15px;">
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;line-height:1.3;">Confirm your new email</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">You requested to change your email address on Pitchr. Tap below to confirm.</p>
            <div style="text-align:center;margin:28px 0 8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(255,89,65,0.3);letter-spacing:0.2px;">
                Confirm New Email
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
              Did not request this? Your account may be compromised — reset your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06) 15%,rgba(0,0,0,0.06) 85%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 36px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#ff5941,#ffaa33);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.65;font-size:15px;">
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;line-height:1.3;">Reset your password</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">We received a request to reset your Pitchr password. Tap below to choose a new one.</p>
            <div style="text-align:center;margin:28px 0 8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(255,89,65,0.3);letter-spacing:0.2px;">
                Reset Password
              </a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
              Did not request this? You can safely ignore this email. Your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06) 15%,rgba(0,0,0,0.06) 85%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 36px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Pitchr &mdash; AI pitch coach</span>
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#ff5941,#ffaa33);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">pitchr</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.65;font-size:15px;">
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;line-height:1.3;">Verification code</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">Enter this code to verify your identity.</p>
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;padding:18px 44px;background:#fff8f6;border:1px solid rgba(255,89,65,0.15);border-radius:14px;font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">
                {{ .Token }}
              </div>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
              This code expires in 10 minutes. Did not request this? Change your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06) 15%,rgba(0,0,0,0.06) 85%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 36px 24px;text-align:center;">
            <span style="color:#9ca3af;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Pitchr &mdash; AI pitch coach</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```
