export type SourceKind = 'github' | 'jira' | 'slack' | 'notion';

export type SourceStatus = 'connected' | 'imported' | 'pending' | 'error';

export interface Source {
  id: string;
  kind: SourceKind;
  name: string;
  identifier: string; // repo URL, board key, channel name, page title
  status: SourceStatus;
  recordCount: number;
  lastImportedAt: string | null;
  isSynthetic: boolean;
}

export type TrustLabel =
  | 'verified'
  | 'single-source'
  | 'conflicting'
  | 'no-evidence'
  | 'reviewer-confirmed'
  | 'reviewer-corrected';

export type ClaimCategory =
  | 'decision'
  | 'task-status'
  | 'ownership'
  | 'dependency'
  | 'risk'
  | 'unresolved-question';

export type ReviewStatus =
  | 'pending'
  | 'confirmed'
  | 'corrected'
  | 'rejected'
  | 'needs-evidence';

export interface EvidenceRecord {
  id: string;
  sourceKind: SourceKind;
  sourceName: string;
  sourceIdentifier: string;
  recordId: string; // e.g. PROJ-123, PR #47, message ts
  timestamp: string;
  author: string | null;
  excerpt: string;
  url: string | null;
  stance: 'supporting' | 'contradicting' | 'neutral';
}

export interface Claim {
  id: string;
  statement: string;
  category: ClaimCategory;
  trustLabel: TrustLabel;
  reviewStatus: ReviewStatus;
  relatedIdentifier: string | null; // e.g. PROJ-123
  supportingCount: number;
  contradictingCount: number;
  supporting: EvidenceRecord[];
  contradicting: EvidenceRecord[];
  verificationNote: string;
  reviewerComment: string | null;
  correctedStatement: string | null;
  lastReviewedAt: string | null;
  reviewedBy: string | null;
}

export type ReconstructionStage =
  | 'idle'
  | 'ingesting'
  | 'linking'
  | 'extracting'
  | 'verifying'
  | 'preparing'
  | 'complete'
  | 'failed';

export interface ReconstructionStatus {
  stage: ReconstructionStage;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export type HandoverRole = 'developer' | 'stakeholder';

export interface HandoverSection {
  id: string;
  title: string;
  body: string; // markdown-ish
  claims: string[]; // claim ids referenced
}

export interface HandoverPlan {
  horizon: 'day-1' | 'week-1' | 'month-1';
  items: string[];
}

export interface Handover {
  id: string;
  version: number;
  role: HandoverRole;
  approvedAt: string | null;
  approvedBy: string | null;
  sections: HandoverSection[];
  plan: HandoverPlan[];
  generatedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: 'claim' | 'handover' | 'source' | 'reconstruction';
  entityId: string;
  previousState: string | null;
  newState: string;
  note: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string | null;
  departingPerson: string;
  incomingPerson: string | null;
  createdAt: string;
  updatedAt: string;
  sourcesCount: number;
  claimsCount: number;
  verifiedCount: number;
  conflictingCount: number;
  unresolvedCount: number;
  approvedHandoversCount: number;
  reconstruction: ReconstructionStatus;
}