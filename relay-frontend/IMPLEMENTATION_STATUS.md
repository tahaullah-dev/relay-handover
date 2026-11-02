# Implementation status

Last updated: 2026-11-02.

## Implemented pages

- Landing (`/`)
- Dashboard (`/projects/:projectId`)
- Sources (`/projects/:projectId/sources`)
- Reconstruction (`/projects/:projectId/reconstruction`)
- Claims list (`/projects/:projectId/claims`)
- Claim detail (`/projects/:projectId/claims/:claimId`)
- Handover (`/projects/:projectId/handover`)
- Audit (`/projects/:projectId/audit`)

## Reusable components

Design system (`src/components/ui`): `Button`, `Card`, `Badge`, `Input`,
`Textarea`, `Modal`, `Tabs`, `EmptyState`, `LoadingState`, `ErrorState`,
`Tooltip`.

Feature components: `TrustLabelBadge`, `ClaimCard`, `EvidencePanel`,
`ReviewActions`, `SourceCard`, `HandoverSectionView`, `RoleSelector`.

Layout: `AppLayout` with sidebar navigation and demo banner.

## API endpoints integrated

The frontend is backend-agnostic. When `VITE_API_BASE_URL` is unset, every
endpoint is served from the synthetic demo dataset in `src/data/demo.ts`.

When the backend is configured, the following endpoints are called:

- `GET /projects/:id`
- `GET /projects/:id/reconstruction`
- `POST /projects/:id/reconstruction`
- `GET /projects/:id/sources`
- `POST /projects/:id/sources/github`
- `POST /projects/:id/sources/:kind/upload`
- `GET /projects/:id/claims`
- `POST /projects/:id/claims/:claimId/review`
- `GET /projects/:id/handover?role=...`
- `POST /projects/:id/handover`
- `POST /projects/:id/handover/:handoverId/approve`
- `GET /projects/:id/audit`

## API endpoints still required from backend

None for the demo to work. For a real deployment, the backend must implement
the endpoints above with the request/response shapes defined in
`src/types/index.ts`.

## Functional interactions

- Landing → demo project navigation (no login)
- Source connect/upload flows with success states
- Reconstruction trigger with progress visualisation
- Claims filter by trust label, search by text/identifier
- Claim detail with supporting + contradicting evidence panels
- Reviewer actions: confirm, correct, reject, needs-evidence
- Review persistence (local in demo, via API when backend is configured)
- Handover generation, role switching, approval
- Print/PDF export via `window.print` with print-friendly CSS
- Audit log rendering

## Responsive design

All pages are responsive down to 360px. Sidebar collapses to a top bar is not
yet implemented — the sidebar is hidden below `lg` via standard Tailwind
breakpoints and can be extended if required.

## Tests executed

Manual walkthrough of the full judge journey:

1. Landing → Explore demo project ✓
2. Dashboard renders with correct metrics ✓
3. Sources page shows four synthetic sources ✓
4. Reconstruction page shows five completed stages ✓
5. Claims page lists 15 claims, filters and search work ✓
6. Conflicting claim `clm_001` (PROJ-123) opens with supporting + contradicting evidence ✓
7. Reviewer corrects `clm_002` (PostgreSQL → SQLite) — state persists in session ✓
8. Handover generates for developer role, then stakeholder role ✓
9. Stakeholder view omits code-level detail ✓
10. Audit log shows review actions ✓

No automated test suite is wired up yet.

## Known frontend issues

- Sidebar does not collapse to a hamburger menu on mobile — it is hidden
  below the `lg` breakpoint. Acceptable for the demo; should be fixed before
  production.
- File upload on the Sources page is a placeholder in the demo (accepts a
  file name rather than a real file).
- The handover "Print / PDF" button uses `window.print` — styling is good
  but not pixel-perfect for every section.

## Files created

See the file tree at the top of the submission. All files are under
`relay-frontend/`.

## Instructions for the next agent

1. Run `npm install && npm run dev` and walk the judge journey.
2. If the backend is ready, set `VITE_API_BASE_URL` in `.env` and verify
   each endpoint in `src/api/`.
3. Replace the synthetic data fallbacks in `src/api/*.ts` with real calls
   once the backend contract is finalised.
4. Add a mobile sidebar collapse if the demo will be shown on phones.
5. Add Vitest + React Testing Library tests for the claim review flow —
   this is the highest-value screen to lock down.