# Security Policy

## Reporting a Vulnerability

If you find a security issue in Pitchr, please report it privately rather than opening a public issue.

- Email: **security@pitchr.app** (preferred)
- Or open a GitHub Security Advisory: https://github.com/JuliusBrussee/pitchr/security/advisories/new

Include:

- A description of the issue and the impact you observed.
- Steps to reproduce or a proof of concept.
- The commit SHA or version where you found it.

We aim to acknowledge reports within 3 business days and provide a remediation timeline within 14 days. Reporters are credited in release notes unless they request otherwise.

## Scope

In scope:

- The Pitchr web app (`app/`, `services/`, `lib/`).
- Supabase edge functions in `supabase/functions/`.
- The static landing page in `docs/landing/`.

Out of scope:

- Third-party services (Supabase, Anthropic, Stripe, ElevenLabs, AssemblyAI). Report those to the respective vendors.
- Issues that require physical access to a user's device or a compromised dependency outside our control.

## Supported Versions

Only the `main` branch is actively maintained. Security fixes are not backported to forks or earlier tags.
