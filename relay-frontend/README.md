# Relay — Frontend

Evidence-backed project handover. Reconstructs project knowledge from GitHub,
Jira, Slack and Notion, verifies every claim against evidence, and generates
a role-based handover the next developer can act on.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide icons
- Axios (API client)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173. The landing page links directly into the synthetic
demo project — no login required.

## Backend integration

Set `VITE_API_BASE_URL` in `.env` to point at the FastAPI backend. When the
variable is unset, the frontend runs entirely on synthetic demo data so judges
can experience the full workflow without a backend.

The API client layer is in `src/api/`. Every call checks `isBackendConfigured()`
and falls back to the demo dataset. To wire up a real backend, implement the
endpoints listed in `IMPLEMENTATION_STATUS.md`.

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy with the included `netlify.toml`, which handles
SPA routing via a catch-all redirect.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck and build for production
- `npm run preview` — preview the production build locally
- `npm run typecheck` — run TypeScript without emitting