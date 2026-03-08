# Supabase Auth Email Templates (Pitchr Branding)

Paste each template into **Supabase Dashboard > Authentication > Email Templates**.
Each section has the **Subject** and **Body (HTML)**.

> **Note:** Supabase uses Go template variables like `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.
> These are automatically replaced at send time. Do not modify the `{{ }}` placeholders.
>
> **Design:** Dark glassmorphic layout — Helvetica Neue headings, 3px coral-to-orange
> gradient accent bar, 520px glass-bordered card on near-black bg, gradient CTA buttons with glow,
> layered shadows. Email-safe (no backdrop-filter). MSO fallbacks for Outlook.

---

## 1. Confirm Sign Up

**Subject:** `Confirm your Pitchr account`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#ff5941,#ffaa33);"><!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="#ff5941" color2="#ffaa33" angle="90"/></v:rect><![endif]--></td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ededec;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Pitchr<span style="color:#ff5941;">.</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#d1d1cf;line-height:1.65;font-size:14px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Confirm your email</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">Verify your email to activate your Pitchr account.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 16px rgba(255,89,65,0.3);">
                Confirm Email
              </a>
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;text-align:center;line-height:1.6;">
              Did not create a Pitchr account? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#6b7280;font-size:12px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
```

---

## 2. Invite User

**Subject:** `You've been invited to Pitchr`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#ff5941,#ffaa33);"><!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="#ff5941" color2="#ffaa33" angle="90"/></v:rect><![endif]--></td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ededec;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Pitchr<span style="color:#ff5941;">.</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#d1d1cf;line-height:1.65;font-size:14px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">You have been invited</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">Someone thinks you should try Pitchr. Score your pitch, get ranked fixes, and see a rewritten script.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 16px rgba(255,89,65,0.3);">
                Accept Invite
              </a>
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;text-align:center;line-height:1.6;">
              Not expecting this? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#6b7280;font-size:12px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
```

---

## 3. Magic Link

**Subject:** `Your Pitchr sign-in link`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#ff5941,#ffaa33);"><!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="#ff5941" color2="#ffaa33" angle="90"/></v:rect><![endif]--></td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ededec;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Pitchr<span style="color:#ff5941;">.</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#d1d1cf;line-height:1.65;font-size:14px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Sign in to Pitchr</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">This link expires in 10 minutes and can only be used once.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 16px rgba(255,89,65,0.3);">
                Sign In
              </a>
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;text-align:center;line-height:1.6;">
              Did not request this link? You can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#6b7280;font-size:12px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email address`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#ff5941,#ffaa33);"><!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="#ff5941" color2="#ffaa33" angle="90"/></v:rect><![endif]--></td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ededec;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Pitchr<span style="color:#ff5941;">.</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#d1d1cf;line-height:1.65;font-size:14px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Confirm your new email</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">You requested to change your email address on Pitchr.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 16px rgba(255,89,65,0.3);">
                Confirm New Email
              </a>
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;text-align:center;line-height:1.6;">
              Did not request this? Your account may be compromised. Reset your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#6b7280;font-size:12px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
```

---

## 5. Reset Password

**Subject:** `Reset your Pitchr password`

**Body:**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#ff5941,#ffaa33);"><!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="#ff5941" color2="#ffaa33" angle="90"/></v:rect><![endif]--></td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ededec;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Pitchr<span style="color:#ff5941;">.</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#d1d1cf;line-height:1.65;font-size:14px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Reset your password</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">We received a request to reset your Pitchr password.</p>
            <div style="text-align:center;margin:32px 0 12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff5941,#e63b26);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 16px rgba(255,89,65,0.3);">
                Reset Password
              </a>
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;text-align:center;line-height:1.6;">
              Did not request this? You can safely ignore this email. Your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#6b7280;font-size:12px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#ff5941,#ffaa33);"><!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="#ff5941" color2="#ffaa33" angle="90"/></v:rect><![endif]--></td></tr>
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ededec;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Pitchr<span style="color:#ff5941;">.</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#d1d1cf;line-height:1.65;font-size:14px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Verification code</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">Enter this code to verify your identity.</p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;padding:16px 40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:32px;font-weight:500;letter-spacing:6px;color:#ffffff;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">
                {{ .Token }}
              </div>
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;text-align:center;line-height:1.6;">
              This code expires in 10 minutes. Did not request this? Change your password immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent);"></div></td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;text-align:center;">
            <span style="color:#6b7280;font-size:12px;font-family:'Helvetica Neue',Helvetica,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">pitchr &mdash; ai pitch coach</span>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
```
