import type {
  AuditEntry,
  Claim,
  Handover,
  ProjectSummary,
  ReconstructionStatus,
  Source,
} from '@/types';

export const DEMO_PROJECT_ID = 'proj_campusconnect';

const now = new Date('2026-11-02T09:00:00Z').toISOString();

export const DEMO_RECONSTRUCTION: ReconstructionStatus = {
  stage: 'complete',
  progressPercent: 100,
  startedAt: new Date('2026-11-01T18:12:00Z').toISOString(),
  completedAt: new Date('2026-11-01T18:14:32Z').toISOString(),
  errorMessage: null,
};

export const DEMO_SOURCES: Source[] = [
  {
    id: 'src_github',
    kind: 'github',
    name: 'GitHub',
    identifier: 'traceforge/campusconnect',
    status: 'connected',
    recordCount: 142,
    lastImportedAt: new Date('2026-11-01T18:10:11Z').toISOString(),
    isSynthetic: true,
  },
  {
    id: 'src_jira',
    kind: 'jira',
    name: 'Jira',
    identifier: 'CC — CampusConnect Board',
    status: 'connected',
    recordCount: 38,
    lastImportedAt: new Date('2026-11-01T18:10:11Z').toISOString(),
    isSynthetic: true,
  },
  {
    id: 'src_slack',
    kind: 'slack',
    name: 'Slack',
    identifier: '#campusconnect-dev',
    status: 'imported',
    recordCount: 214,
    lastImportedAt: new Date('2026-10-28T14:02:00Z').toISOString(),
    isSynthetic: true,
  },
  {
    id: 'src_notion',
    kind: 'notion',
    name: 'Notion',
    identifier: 'CampusConnect — Team Wiki',
    status: 'imported',
    recordCount: 17,
    lastImportedAt: new Date('2026-10-28T14:02:00Z').toISOString(),
    isSynthetic: true,
  },
];

export const DEMO_CLAIMS: Claim[] = [
  {
    id: 'clm_001',
    statement: 'PROJ-123 "Event RSVP flow" is complete and shipped.',
    category: 'task-status',
    trustLabel: 'conflicting',
    reviewStatus: 'pending',
    relatedIdentifier: 'PROJ-123',
    supportingCount: 1,
    contradictingCount: 2,
    supporting: [
      {
        id: 'ev_001a',
        sourceKind: 'jira',
        sourceName: 'Jira',
        sourceIdentifier: 'CC Board',
        recordId: 'PROJ-123',
        timestamp: '2026-10-24T16:42:00Z',
        author: 'Alex Chen',
        excerpt:
          'Status changed to Done. Acceptance criteria met. Ready for release.',
        url: 'https://jira.example/browse/PROJ-123',
        stance: 'supporting',
      },
    ],
    contradicting: [
      {
        id: 'ev_001b',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'PR #47',
        timestamp: '2026-10-25T09:18:00Z',
        author: 'alex-cc',
        excerpt:
          'Pull request #47 "feat(rsvp): finalise confirmation email" is open, 2 approvals pending, not merged.',
        url: 'https://github.com/traceforge/campusconnect/pull/47',
        stance: 'contradicting',
      },
      {
        id: 'ev_001c',
        sourceKind: 'slack',
        sourceName: 'Slack',
        sourceIdentifier: '#campusconnect-dev',
        recordId: 'msg-1729872000',
        timestamp: '2026-10-25T11:04:00Z',
        author: 'Priya Raman',
        excerpt:
          "@alex-cc PROJ-123 isn't actually done — the confirmation email template still has the old logo. Can you push the fix before we close the sprint?",
        url: 'https://slack.example/archives/C0123456/p1729872000',
        stance: 'contradicting',
      },
    ],
    verificationNote:
      'Jira marks the ticket Done, but the linked pull request is still open and a teammate has flagged an outstanding defect in Slack.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_002',
    statement:
      'The team decided to use PostgreSQL as the primary database.',
    category: 'decision',
    trustLabel: 'conflicting',
    reviewStatus: 'pending',
    relatedIdentifier: 'DEC-004',
    supportingCount: 1,
    contradictingCount: 2,
    supporting: [
      {
        id: 'ev_002a',
        sourceKind: 'notion',
        sourceName: 'Notion',
        sourceIdentifier: 'Architecture Decisions',
        recordId: 'page-arch-004',
        timestamp: '2026-09-12T10:00:00Z',
        author: 'Alex Chen',
        excerpt:
          'Decision DEC-004: Use PostgreSQL for the primary relational store. Rationale: mature tooling, strong JSON support.',
        url: 'https://notion.example/architecture/dec-004',
        stance: 'supporting',
      },
    ],
    contradicting: [
      {
        id: 'ev_002b',
        sourceKind: 'slack',
        sourceName: 'Slack',
        sourceIdentifier: '#campusconnect-dev',
        recordId: 'msg-1730400000',
        timestamp: '2026-10-18T15:22:00Z',
        author: 'Alex Chen',
        excerpt:
          "Update: we're switching the primary store to SQLite for the demo deployment. Postgres was overkill for the club's hosting budget. I'll update the Notion page tomorrow.",
        url: 'https://slack.example/archives/C0123456/p1730400000',
        stance: 'contradicting',
      },
      {
        id: 'ev_002c',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'PR #51',
        timestamp: '2026-10-19T08:11:00Z',
        author: 'alex-cc',
        excerpt:
          'Merged PR #51 "chore(db): replace pg driver with better-sqlite3". docker-compose no longer starts postgres.',
        url: 'https://github.com/traceforge/campusconnect/pull/51',
        stance: 'contradicting',
      },
    ],
    verificationNote:
      'Notion still records PostgreSQL as the decision, but Slack and a merged PR show the decision was superseded by SQLite. The Notion page was never updated.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_003',
    statement:
      'PROJ-130 "OAuth login with university SSO" is blocked waiting on IT approval.',
    category: 'task-status',
    trustLabel: 'verified',
    reviewStatus: 'pending',
    relatedIdentifier: 'PROJ-130',
    supportingCount: 3,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_003a',
        sourceKind: 'jira',
        sourceName: 'Jira',
        sourceIdentifier: 'CC Board',
        recordId: 'PROJ-130',
        timestamp: '2026-10-20T09:00:00Z',
        author: 'Alex Chen',
        excerpt: 'Status: Blocked. Blocker: waiting on IT security review.',
        url: 'https://jira.example/browse/PROJ-130',
        stance: 'supporting',
      },
      {
        id: 'ev_003b',
        sourceKind: 'slack',
        sourceName: 'Slack',
        sourceIdentifier: '#campusconnect-dev',
        recordId: 'msg-1729500000',
        timestamp: '2026-10-21T10:12:00Z',
        author: 'Alex Chen',
        excerpt:
          'Heard back from IT — they need 2 more weeks for the SSO callback URL review. PROJ-130 stays blocked.',
        url: 'https://slack.example/archives/C0123456/p1729500000',
        stance: 'supporting',
      },
      {
        id: 'ev_003c',
        sourceKind: 'notion',
        sourceName: 'Notion',
        sourceIdentifier: 'Risks & Blockers',
        recordId: 'page-risks',
        timestamp: '2026-10-22T14:00:00Z',
        author: 'Alex Chen',
        excerpt:
          'Risk R-07: SSO integration blocked on IT approval. ETA unknown. Owner: Alex.',
        url: 'https://notion.example/risks',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Three independent sources agree. Jira, Slack, and Notion all record the same blocker with consistent dates.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_004',
    statement:
      'PR #52 "refactor(notification): batched email sender" has no linked ticket.',
    category: 'risk',
    trustLabel: 'verified',
    reviewStatus: 'pending',
    relatedIdentifier: 'PR #52',
    supportingCount: 2,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_004a',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'PR #52',
        timestamp: '2026-10-27T17:40:00Z',
        author: 'alex-cc',
        excerpt:
          'Open PR #52. Title: "refactor(notification): batched email sender". Body contains no Jira key, no issue link.',
        url: 'https://github.com/traceforge/campusconnect/pull/52',
        stance: 'supporting',
      },
      {
        id: 'ev_004b',
        sourceKind: 'jira',
        sourceName: 'Jira',
        sourceIdentifier: 'CC Board',
        recordId: 'search:PR#52',
        timestamp: '2026-10-28T08:00:00Z',
        author: null,
        excerpt:
          'Jira issue search for references to PR #52 returned 0 results.',
        url: null,
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'The PR is open with no linked ticket and no matching Jira issue. This is a process gap — work is happening without traceability.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_005',
    statement:
      'The `src/auth/` module is a knowledge-concentration risk: only Alex has ever committed to it.',
    category: 'risk',
    trustLabel: 'verified',
    reviewStatus: 'pending',
    relatedIdentifier: 'src/auth',
    supportingCount: 1,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_005a',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'git-log:src/auth',
        timestamp: '2026-11-01T18:10:00Z',
        author: null,
        excerpt:
          'git log -- src/auth/ shows 34 commits, all authored by alex-cc. No other contributor has touched this directory.',
        url: 'https://github.com/traceforge/campusconnect/tree/main/src/auth',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Single-source but deterministic: derived from git history. High confidence.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_006',
    statement:
      'PROJ-118 "Landing page redesign" is closed, but a follow-up comment asks for confirmation.',
    category: 'task-status',
    trustLabel: 'conflicting',
    reviewStatus: 'pending',
    relatedIdentifier: 'PROJ-118',
    supportingCount: 1,
    contradictingCount: 1,
    supporting: [
      {
        id: 'ev_006a',
        sourceKind: 'jira',
        sourceName: 'Jira',
        sourceIdentifier: 'CC Board',
        recordId: 'PROJ-118',
        timestamp: '2026-10-10T12:00:00Z',
        author: 'Alex Chen',
        excerpt: 'Status: Done. Resolution: Fixed. Closed on Oct 10.',
        url: 'https://jira.example/browse/PROJ-118',
        stance: 'supporting',
      },
    ],
    contradicting: [
      {
        id: 'ev_006b',
        sourceKind: 'jira',
        sourceName: 'Jira',
        sourceIdentifier: 'CC Board',
        recordId: 'PROJ-118-comment',
        timestamp: '2026-10-14T09:22:00Z',
        author: 'Sam Oduya',
        excerpt:
          "@alex-cc the new hero image looks off on mobile — can you double-check before we announce it in the newsletter? I don't want to reopen the ticket if it's minor.",
        url: 'https://jira.example/browse/PROJ-118?focusedCommentId=98765',
        stance: 'contradicting',
      },
    ],
    verificationNote:
      'Ticket is closed, but a comment four days later raises an unresolved concern. The work may not actually be finished.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_007',
    statement: 'Priya Raman is the owner of the notifications subsystem.',
    category: 'ownership',
    trustLabel: 'single-source',
    reviewStatus: 'pending',
    relatedIdentifier: 'src/notifications',
    supportingCount: 1,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_007a',
        sourceKind: 'notion',
        sourceName: 'Notion',
        sourceIdentifier: 'Team Responsibilities',
        recordId: 'page-owners',
        timestamp: '2026-09-01T10:00:00Z',
        author: 'Alex Chen',
        excerpt:
          'Notifications subsystem — owner: Priya Raman. Backup: Alex Chen.',
        url: 'https://notion.example/team/owners',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Only one source records this. No contradicting evidence, but no corroboration either.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_008',
    statement:
      'The email sender depends on the `templates/` directory being in sync with Notion copy.',
    category: 'dependency',
    trustLabel: 'single-source',
    reviewStatus: 'pending',
    relatedIdentifier: 'src/notifications',
    supportingCount: 1,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_008a',
        sourceKind: 'slack',
        sourceName: 'Slack',
        sourceIdentifier: '#campusconnect-dev',
        recordId: 'msg-1729200000',
        timestamp: '2026-10-15T13:30:00Z',
        author: 'Priya Raman',
        excerpt:
          "Reminder: if you change copy in Notion, ping me — the email sender pulls from templates/ and I have to regenerate the bundle. It's a manual step.",
        url: 'https://slack.example/archives/C0123456/p1729200000',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Single-source Slack message. No contradicting evidence, but this is an implicit process dependency worth surfacing.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_009',
    statement:
      'Who is the current point of contact with the university IT team for SSO?',
    category: 'unresolved-question',
    trustLabel: 'no-evidence',
    reviewStatus: 'pending',
    relatedIdentifier: 'PROJ-130',
    supportingCount: 0,
    contradictingCount: 0,
    supporting: [],
    contradicting: [],
    verificationNote:
      'No source names a current IT contact. Alex was handling it, but there is no documented handoff.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_010',
    statement:
      'The team uses GitHub Actions for CI and Netlify for preview deploys.',
    category: 'decision',
    trustLabel: 'verified',
    reviewStatus: 'pending',
    relatedIdentifier: 'CI/CD',
    supportingCount: 2,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_010a',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: '.github/workflows/ci.yml',
        timestamp: '2026-10-01T08:00:00Z',
        author: 'alex-cc',
        excerpt:
          'Workflow file .github/workflows/ci.yml runs lint, typecheck, and vitest on every push and PR.',
        url: 'https://github.com/traceforge/campusconnect/blob/main/.github/workflows/ci.yml',
        stance: 'supporting',
      },
      {
        id: 'ev_010b',
        sourceKind: 'notion',
        sourceName: 'Notion',
        sourceIdentifier: 'Deployments',
        recordId: 'page-deploy',
        timestamp: '2026-09-15T11:00:00Z',
        author: 'Alex Chen',
        excerpt:
          'Preview deploys: every PR gets a Netlify preview. Production: main branch auto-deploys to campusconnect.club.',
        url: 'https://notion.example/deployments',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Two sources agree. GitHub workflow file and Notion deployment page corroborate.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_011',
    statement:
      'The staging database was wiped on Oct 20 during the schema migration.',
    category: 'decision',
    trustLabel: 'reviewer-confirmed',
    reviewStatus: 'confirmed',
    relatedIdentifier: 'DB-MIGRATION',
    supportingCount: 2,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_011a',
        sourceKind: 'slack',
        sourceName: 'Slack',
        sourceIdentifier: '#campusconnect-dev',
        recordId: 'msg-1729400000',
        timestamp: '2026-10-20T14:00:00Z',
        author: 'Alex Chen',
        excerpt:
          'Heads up: I just wiped staging and re-ran the migration. Seed data is gone — let me know if you need it back.',
        url: 'https://slack.example/archives/C0123456/p1729400000',
        stance: 'supporting',
      },
      {
        id: 'ev_011b',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'commit-a1b2c3',
        timestamp: '2026-10-20T14:05:00Z',
        author: 'alex-cc',
        excerpt:
          'Commit a1b2c3 "chore(db): reset staging after migration" — drops and recreates all tables.',
        url: 'https://github.com/traceforge/campusconnect/commit/a1b2c3',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Reviewer confirmed. Two sources agree and the reviewer verified the timeline.',
    reviewerComment: 'Confirmed — I did this myself.',
    correctedStatement: null,
    lastReviewedAt: new Date('2026-11-01T18:30:00Z').toISOString(),
    reviewedBy: 'Alex Chen',
  },
  {
    id: 'clm_012',
    statement:
      'The events API returns paginated results with a default page size of 20.',
    category: 'decision',
    trustLabel: 'reviewer-corrected',
    reviewStatus: 'corrected',
    relatedIdentifier: 'API /events',
    supportingCount: 1,
    contradictingCount: 1,
    supporting: [
      {
        id: 'ev_012a',
        sourceKind: 'notion',
        sourceName: 'Notion',
        sourceIdentifier: 'API Reference',
        recordId: 'page-api-events',
        timestamp: '2026-09-20T10:00:00Z',
        author: 'Alex Chen',
        excerpt:
          'GET /api/events — paginated. Default page size: 20. Max: 100.',
        url: 'https://notion.example/api/events',
        stance: 'supporting',
      },
    ],
    contradicting: [
      {
        id: 'ev_012b',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'src/routes/events.ts',
        timestamp: '2026-10-12T09:00:00Z',
        author: 'alex-cc',
        excerpt:
          'Source code: `const pageSize = Number(query.limit) || 50;` — default is 50, not 20.',
        url: 'https://github.com/traceforge/campusconnect/blob/main/src/routes/events.ts',
        stance: 'contradicting',
      },
    ],
    verificationNote:
      'Notion says 20, code says 50. Reviewer corrected: the code is authoritative; Notion was never updated.',
    reviewerComment: 'Code is right. Notion is stale.',
    correctedStatement:
      'The events API returns paginated results with a default page size of 50.',
    lastReviewedAt: new Date('2026-11-01T18:32:00Z').toISOString(),
    reviewedBy: 'Alex Chen',
  },
  {
    id: 'clm_013',
    statement:
      'The team has not yet decided on a monitoring solution for production errors.',
    category: 'unresolved-question',
    trustLabel: 'single-source',
    reviewStatus: 'pending',
    relatedIdentifier: 'MONITORING',
    supportingCount: 1,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_013a',
        sourceKind: 'slack',
        sourceName: 'Slack',
        sourceIdentifier: '#campusconnect-dev',
        recordId: 'msg-1730500000',
        timestamp: '2026-10-19T16:00:00Z',
        author: 'Sam Oduya',
        excerpt:
          "Do we have any error monitoring set up yet? I can't find Sentry or Rollbar keys anywhere.",
        url: 'https://slack.example/archives/C0123456/p1730500000',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'One Slack message raises the question. No source records a decision.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_014',
    statement:
      'Sam Oduya is responsible for the events listing UI and search.',
    category: 'ownership',
    trustLabel: 'verified',
    reviewStatus: 'pending',
    relatedIdentifier: 'src/events',
    supportingCount: 2,
    contradictingCount: 0,
    supporting: [
      {
        id: 'ev_014a',
        sourceKind: 'notion',
        sourceName: 'Notion',
        sourceIdentifier: 'Team Responsibilities',
        recordId: 'page-owners',
        timestamp: '2026-09-01T10:00:00Z',
        author: 'Alex Chen',
        excerpt: 'Events listing & search — owner: Sam Oduya.',
        url: 'https://notion.example/team/owners',
        stance: 'supporting',
      },
      {
        id: 'ev_014b',
        sourceKind: 'github',
        sourceName: 'GitHub',
        sourceIdentifier: 'traceforge/campusconnect',
        recordId: 'git-log:src/events',
        timestamp: '2026-11-01T18:10:00Z',
        author: null,
        excerpt:
          'git log -- src/events/ shows 28 commits by sam-cc, 3 by alex-cc, 1 by priya-cc. Sam is the primary author.',
        url: 'https://github.com/traceforge/campusconnect/tree/main/src/events',
        stance: 'supporting',
      },
    ],
    contradicting: [],
    verificationNote:
      'Two sources agree. Notion ownership record matches git history.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
  {
    id: 'clm_015',
    statement:
      'The `stripe` dependency in package.json is unused — the team decided not to integrate payments.',
    category: 'decision',
    trustLabel: 'no-evidence',
    reviewStatus: 'pending',
    relatedIdentifier: 'package.json',
    supportingCount: 0,
    contradictingCount: 0,
    supporting: [],
    contradicting: [],
    verificationNote:
      'The dependency is present in package.json, but no source records a decision to remove it or a reason it remains. No Slack, Jira, or Notion discussion found.',
    reviewerComment: null,
    correctedStatement: null,
    lastReviewedAt: null,
    reviewedBy: null,
  },
];

export const DEMO_PROJECT: ProjectSummary = {
  id: DEMO_PROJECT_ID,
  name: 'CampusConnect',
  description:
    'A campus event discovery and RSVP app built by the TraceForge student tech club. Handing over from Alex Chen (graduating) to the new maintainer.',
  repositoryUrl: 'https://github.com/traceforge/campusconnect',
  departingPerson: 'Alex Chen',
  incomingPerson: null,
  createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
  updatedAt: now,
  sourcesCount: DEMO_SOURCES.length,
  claimsCount: DEMO_CLAIMS.length,
  verifiedCount: DEMO_CLAIMS.filter((c) => c.trustLabel === 'verified').length,
  conflictingCount: DEMO_CLAIMS.filter(
    (c) => c.trustLabel === 'conflicting',
  ).length,
  unresolvedCount: DEMO_CLAIMS.filter(
    (c) => c.category === 'unresolved-question',
  ).length,
  approvedHandoversCount: 0,
  reconstruction: DEMO_RECONSTRUCTION,
};

export const DEMO_AUDIT: AuditEntry[] = [
  {
    id: 'aud_001',
    timestamp: new Date('2026-11-01T18:10:11Z').toISOString(),
    actor: 'Alex Chen',
    action: 'sources.connected',
    entityType: 'source',
    entityId: 'src_github',
    previousState: null,
    newState: 'connected',
    note: 'Connected traceforge/campusconnect (read-only).',
  },
  {
    id: 'aud_002',
    timestamp: new Date('2026-11-01T18:10:11Z').toISOString(),
    actor: 'Alex Chen',
    action: 'sources.connected',
    entityType: 'source',
    entityId: 'src_jira',
    previousState: null,
    newState: 'connected',
    note: 'Connected CC Jira board (read-only).',
  },
  {
    id: 'aud_003',
    timestamp: new Date('2026-11-01T18:12:00Z').toISOString(),
    actor: 'Alex Chen',
    action: 'reconstruction.started',
    entityType: 'reconstruction',
    entityId: DEMO_PROJECT_ID,
    previousState: 'idle',
    newState: 'ingesting',
    note: null,
  },
  {
    id: 'aud_004',
    timestamp: new Date('2026-11-01T18:14:32Z').toISOString(),
    actor: 'system',
    action: 'reconstruction.completed',
    entityType: 'reconstruction',
    entityId: DEMO_PROJECT_ID,
    previousState: 'preparing',
    newState: 'complete',
    note: `Extracted ${DEMO_CLAIMS.length} claims across 4 sources.`,
  },
  {
    id: 'aud_005',
    timestamp: new Date('2026-11-01T18:30:00Z').toISOString(),
    actor: 'Alex Chen',
    action: 'claim.confirmed',
    entityType: 'claim',
    entityId: 'clm_011',
    previousState: 'pending',
    newState: 'confirmed',
    note: 'Confirmed — I did this myself.',
  },
  {
    id: 'aud_006',
    timestamp: new Date('2026-11-01T18:32:00Z').toISOString(),
    actor: 'Alex Chen',
    action: 'claim.corrected',
    entityType: 'claim',
    entityId: 'clm_012',
    previousState: 'pending',
    newState: 'corrected',
    note: 'Code is right. Notion is stale.',
  },
];

export const DEMO_HANDOVER_DEVELOPER: Handover = {
  id: 'hov_dev_v1',
  version: 1,
  role: 'developer',
  approvedAt: null,
  approvedBy: null,
  generatedAt: new Date('2026-11-02T09:00:00Z').toISOString(),
  sections: [
    {
      id: 'sec_overview',
      title: 'Project overview',
      body:
        'CampusConnect is a campus event discovery and RSVP app. It is built in TypeScript on a Node backend with a React frontend, deployed to Netlify (frontend) and a small VPS (backend). The primary data store is SQLite; PostgreSQL was evaluated and rejected in October.',
      claims: ['clm_002', 'clm_010'],
    },
    {
      id: 'sec_status',
      title: 'Current project status',
      body:
        'The team is mid-sprint. Most of the events listing and search work is complete. The RSVP flow is *not* complete despite what Jira says — see the conflicting evidence on PROJ-123. SSO login is blocked on IT approval.',
      claims: ['clm_001', 'clm_003', 'clm_006'],
    },
    {
      id: 'sec_decisions',
      title: 'Important decisions',
      body:
        '- **Database**: SQLite, not PostgreSQL (decision superseded Oct 18).\n- **CI/CD**: GitHub Actions + Netlify preview deploys.\n- **Payments**: Not integrating Stripe — dependency is unused.',
      claims: ['clm_002', 'clm_010', 'clm_015'],
    },
    {
      id: 'sec_blockers',
      title: 'Blocked tasks',
      body:
        '- **PROJ-130** (SSO login): blocked on university IT security review. No named IT contact on file.\n- **PROJ-123** (RSVP flow): blocked on a logo fix in the confirmation email template.',
      claims: ['clm_001', 'clm_003', 'clm_009'],
    },
    {
      id: 'sec_ownership',
      title: 'Ownership and responsibilities',
      body:
        '- **Events listing & search**: Sam Oduya (verified by Notion + git history).\n- **Notifications**: Priya Raman (single-source — Notion only, please confirm).\n- **Auth module**: Alex Chen was the sole contributor. **This is a knowledge-concentration risk.**',
      claims: ['clm_005', 'clm_007', 'clm_014'],
    },
    {
      id: 'sec_risks',
      title: 'Risks',
      body:
        '1. **Auth module knowledge concentration** — only Alex has committed to `src/auth/`.\n2. **Orphan PR #52** — open refactor with no linked ticket.\n3. **Stale Notion docs** — architecture decisions page still says PostgreSQL.\n4. **Silent dependency** — email sender requires manual bundle regeneration when Notion copy changes.',
      claims: ['clm_004', 'clm_005', 'clm_008'],
    },
    {
      id: 'sec_unresolved',
      title: 'Unresolved questions',
      body:
        '- Who is the current IT contact for SSO?\n- Has the team decided on a production error monitoring solution?\n- Why is the `stripe` dependency still in `package.json`?',
      claims: ['clm_009', 'clm_013', 'clm_015'],
    },
    {
      id: 'sec_entrypoints',
      title: 'Codebase entry points',
      body:
        '- `src/routes/events.ts` — events API (default page size is 50, not 20).\n- `src/notifications/` — email sender, owned by Priya.\n- `src/auth/` — SSO flow, **read carefully before touching**.\n- `.github/workflows/ci.yml` — CI pipeline.\n- `docker-compose.yml` — local dev (SQLite, no Postgres).',
      claims: ['clm_002', 'clm_005', 'clm_010', 'clm_012'],
    },
  ],
  plan: [
    {
      horizon: 'day-1',
      items: [
        'Clone the repo and run `npm install && npm run dev`. Confirm the app starts.',
        'Read `src/auth/` end-to-end. Schedule a 30-minute walkthrough with Alex before they graduate.',
        'Reply to the PROJ-123 Slack thread and close the logo issue, or reassign it.',
        'Confirm Priya is still the notifications owner.',
      ],
    },
    {
      horizon: 'week-1',
      items: [
        'Create a Jira ticket for PR #52 and link it.',
        'Update the Notion architecture page: PostgreSQL → SQLite.',
        'Reach out to university IT to re-establish the SSO blocker conversation.',
        'Decide on an error monitoring solution (Sentry suggested by Sam).',
      ],
    },
    {
      horizon: 'month-1',
      items: [
        'Pair with a second contributor on `src/auth/` to reduce knowledge concentration.',
        'Automate the Notion → `templates/` sync that Priya flagged.',
        'Remove the unused `stripe` dependency or document why it remains.',
        'Run a retro on the PROJ-123 "Done but not done" incident and tighten the Definition of Done.',
      ],
    },
  ],
};

export const DEMO_HANDOVER_STAKEHOLDER: Handover = {
  id: 'hov_sh_v1',
  version: 1,
  role: 'stakeholder',
  approvedAt: null,
  approvedBy: null,
  generatedAt: new Date('2026-11-02T09:00:00Z').toISOString(),
  sections: [
    {
      id: 'sec_sh_overview',
      title: 'Project status',
      body:
        'CampusConnect is progressing well overall. The events listing is live and stable. Two areas need attention before the next campus push: the RSVP flow has an outstanding defect, and the SSO login is blocked on university IT.',
      claims: ['clm_001', 'clm_003'],
    },
    {
      id: 'sec_sh_decisions',
      title: 'Major decisions',
      body:
        '- The team switched from PostgreSQL to SQLite to fit the club\'s hosting budget.\n- CI and preview deploys are fully automated via GitHub Actions and Netlify.',
      claims: ['clm_002', 'clm_010'],
    },
    {
      id: 'sec_sh_risks',
      title: 'High-level risks',
      body:
        '1. **Knowledge concentration**: the authentication module was built entirely by the departing lead.\n2. **External dependency**: SSO login is blocked on university IT with no named contact.\n3. **Documentation drift**: internal architecture docs are out of date.',
      claims: ['clm_005', 'clm_009'],
    },
    {
      id: 'sec_sh_unresolved',
      title: 'Open questions for leadership',
      body:
        '- Can the club advisor help introduce the new maintainer to the university IT contact?\n- Should the team budget for a production error monitoring tool?',
      claims: ['clm_009', 'clm_013'],
    },
  ],
  plan: [
    {
      horizon: 'day-1',
      items: [
        'Introduce the new maintainer to the club advisor and any external stakeholders.',
      ],
    },
    {
      horizon: 'week-1',
      items: [
        'Confirm the IT contact for SSO with the advisor.',
        'Approve a small budget for error monitoring if the team recommends one.',
      ],
    },
    {
      horizon: 'month-1',
      items: [
        'Check in on the auth-module knowledge-transfer plan.',
        'Review whether the RSVP flow is ready for the next campus event.',
      ],
    },
  ],
};