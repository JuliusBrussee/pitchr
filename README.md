# Pitchr

AI-powered pitch practice platform built with Next.js, React Three Fiber, and GLSL shaders.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (included with Node.js)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/JuliusBrussee/pitchr.git
cd pitchr

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Codex MCP

This repo includes a project-scoped Codex MCP server configuration in `.codex/config.toml`.

- Run Codex from the repository root (`c:\dev\pitchr`).
- The project must be trusted in Codex for project-scoped config to load.
- Verify the server with:

```bash
codex mcp get supabase
```

- Do not use `codex mcp add` for this repo setup because it writes to user config at `~/.codex/config.toml`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Serve production build |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run e2e:smoke` | Run Playwright smoke flow against local app |
| `npm run e2e:ui` | Open Playwright UI mode |

## Tech Stack

- **Framework:** Next.js 16 / React 19
- **3D:** React Three Fiber + Drei
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest + Testing Library
- **Language:** TypeScript

## Local UI Smoke Testing

Run this to validate core navigation and session controls in a real browser:

```bash
npm run e2e:smoke
```

Notes:
- Playwright will start `npm run dev` automatically from `playwright.config.ts`.
- On first run, install browsers if prompted:

```bash
npx playwright install chromium
```

## Miro Integration

Results page supports Miro fix-board export and sync.

Environment setup in `.env.local`:

```bash
MIRO_ENABLED=true
MIRO_PROVIDER=rest
MIRO_ACCESS_TOKEN=...
MIRO_TEAM_ID=...
NEXT_PUBLIC_MIRO_POLL_INTERVAL_MS=30000
```

If credentials are missing, the app falls back to stub mode and markdown export.

See: `docs/integrations/miro.md`

## License

MIT
