import { api, isBackendConfigured, toApiError } from './client';
import { DEMO_CLAIMS } from '@/data/demo';
import type { Claim, ReviewStatus, TrustLabel } from '@/types';

export async function fetchClaims(projectId: string): Promise<Claim[]> {
  if (!isBackendConfigured()) {
    return DEMO_CLAIMS.map((c) => ({
      ...c,
      supporting: [...c.supporting],
      contradicting: [...c.contradicting],
    }));
  }
  const { data } = await api.get<Claim[]>(`/projects/${projectId}/claims`);
  return data;
}

export interface ReviewClaimPayload {
  action: 'confirm' | 'correct' | 'reject' | 'needs-evidence';
  correctedStatement?: string;
  comment?: string;
  reviewer: string;
}

export interface ReviewClaimResult {
  claim: Claim;
  trustLabel: TrustLabel;
  reviewStatus: ReviewStatus;
}

export async function reviewClaim(
  projectId: string,
  claimId: string,
  payload: ReviewClaimPayload,
): Promise<ReviewClaimResult> {
  if (!isBackendConfigured()) {
    // Demo: apply the review locally.
    const original = DEMO_CLAIMS.find((c) => c.id === claimId);
    if (!original) {
      throw new Error(`Claim ${claimId} not found in demo data`);
    }

    let reviewStatus: ReviewStatus;
    let trustLabel: TrustLabel;
    switch (payload.action) {
      case 'confirm':
        reviewStatus = 'confirmed';
        trustLabel =
          original.trustLabel === 'reviewer-corrected'
            ? 'reviewer-corrected'
            : 'reviewer-confirmed';
        break;
      case 'correct':
        reviewStatus = 'corrected';
        trustLabel = 'reviewer-corrected';
        break;
      case 'reject':
        reviewStatus = 'rejected';
        trustLabel = original.trustLabel;
        break;
      case 'needs-evidence':
        reviewStatus = 'needs-evidence';
        trustLabel = original.trustLabel;
        break;
    }

    const updated: Claim = {
      ...original,
      reviewStatus,
      trustLabel,
      reviewerComment: payload.comment ?? null,
      correctedStatement:
        payload.action === 'correct'
          ? payload.correctedStatement ?? original.statement
          : null,
      lastReviewedAt: new Date().toISOString(),
      reviewedBy: payload.reviewer,
    };

    return { claim: updated, trustLabel, reviewStatus };
  }

  try {
    const { data } = await api.post<ReviewClaimResult>(
      `/projects/${projectId}/claims/${claimId}/review`,
      payload,
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}