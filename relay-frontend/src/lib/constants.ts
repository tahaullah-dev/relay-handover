import type { ClaimCategory, TrustLabel, ReviewStatus } from '@/types';

export const TRUST_LABEL_META: Record<
  TrustLabel,
  { label: string; tone: 'green' | 'blue' | 'amber' | 'gray' | 'emerald' | 'violet' }
> = {
  verified: { label: 'Verified', tone: 'green' },
  'single-source': { label: 'Single-source', tone: 'blue' },
  conflicting: { label: 'Conflicting', tone: 'amber' },
  'no-evidence': { label: 'No evidence found', tone: 'gray' },
  'reviewer-confirmed': { label: 'Reviewer-confirmed', tone: 'emerald' },
  'reviewer-corrected': { label: 'Reviewer-corrected', tone: 'violet' },
};

export const CATEGORY_META: Record<
  ClaimCategory,
  { label: string; short: string }
> = {
  decision: { label: 'Decision', short: 'DEC' },
  'task-status': { label: 'Task status', short: 'TSK' },
  ownership: { label: 'Ownership', short: 'OWN' },
  dependency: { label: 'Dependency', short: 'DEP' },
  risk: { label: 'Risk', short: 'RSK' },
  'unresolved-question': { label: 'Unresolved question', short: 'Q' },
};

export const REVIEW_STATUS_META: Record<
  ReviewStatus,
  { label: string; tone: 'neutral' | 'positive' | 'warning' | 'info' }
> = {
  pending: { label: 'Pending review', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'positive' },
  corrected: { label: 'Corrected', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'warning' },
  'needs-evidence': { label: 'Needs more evidence', tone: 'warning' },
};

export const DEMO_BANNER_TEXT =
  'Demo project — synthetic data with planted inconsistencies. No real GitHub / Jira / Slack / Notion accounts are connected.';