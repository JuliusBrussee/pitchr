# Contributing to Pitchr

Thanks for your interest in helping Pitchr. This guide covers how to file issues, set up a local environment, and submit pull requests.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## Ways to Contribute

- **Bug reports** — file an issue describing what you expected vs. what happened, with reproduction steps.
- **Feature ideas** — open a discussion or issue with the use case before you build, so we can scope it together.
- **Pull requests** — small, focused changes are easiest to review. Link the issue you're addressing.
- **Docs** — typo fixes, clearer examples, and better setup instructions are always welcome.

## Local Setup

Requirements:

- Node.js 18+
- Yarn 4 (pinned via `packageManager`)
- A Supabase project (URL + anon key)
- An Anthropic key (or OpenRouter key) for analysis

```bash
git clone https://github.com/JuliusBrussee/pitchr.git
cd pitchr
yarn install
cp .env.example .env.local   # fill in keys
yarn dev                     # http://localhost:3000
```

Run the test suite:

```bash
yarn test          # one-shot
yarn test:watch    # watch mode
yarn typecheck     # type-only build
```

## Branching

- `main` — stable. PRs target `main`.
- Feature branches — `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) where it fits:

```
feat(analysis): add weighted rubric calibration
fix(billing): handle Stripe webhook idempotency
docs(readme): clarify env setup
```

Keep commits focused. Squash work-in-progress noise before opening the PR.

## Pull Requests

1. Fork + create a feature branch.
2. Add or update tests for behavior changes.
3. Run `yarn test` and `yarn typecheck` locally.
4. Open the PR against `main` with a clear summary and screenshots for UI changes.
5. CI must pass before review.

## Architecture Reference

The repo follows an MVC layout adapted for the Next.js App Router:

```
Views:       app/(app)/ + views/components/    React UI
Controllers: app/api/                          HTTP orchestration
Services:    services/                         business logic, LLM calls
Models:      models/                           schemas, storage adapters
```

See `.planning/codebase/` for architecture, conventions, and integration notes.

## Reporting Security Issues

Please **do not** open public issues for security problems. See [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree your contributions will be licensed under the [AGPL-3.0-or-later](./LICENSE).
