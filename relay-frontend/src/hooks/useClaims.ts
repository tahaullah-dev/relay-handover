import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchClaims, reviewClaim } from '@/api/claims';
import type { Claim, ReviewStatus, TrustLabel } from '@/types';

export type TrustFilter = TrustLabel | 'all';

export function useClaims(projectId: string) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TrustFilter>('all');
  const [query, setQuery] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClaims(projectId);
      setClaims(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load claims',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claims.filter((c) => {
      if (filter !== 'all' && c.trustLabel !== filter) return false;
      if (!q) return true;
      return (
        c.statement.toLowerCase().includes(q) ||
        (c.relatedIdentifier ?? '').toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [claims, filter, query]);

  const applyReview = useCallback(
    (updated: Claim) => {
      setClaims((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
    [],
  );

  const review = useCallback(
    async (
      claimId: string,
      action: 'confirm' | 'correct' | 'reject' | 'needs-evidence',
      opts: { correctedStatement?: string; comment?: string; reviewer: string },
    ): Promise<{ trustLabel: TrustLabel; reviewStatus: ReviewStatus }> => {
      setReviewingId(claimId);
      try {
        const result = await reviewClaim(projectId, claimId, {
          action,
          correctedStatement: opts.correctedStatement,
          comment: opts.comment,
          reviewer: opts.reviewer,
        });
        applyReview(result.claim);
        return {
          trustLabel: result.trustLabel,
          reviewStatus: result.reviewStatus,
        };
      } finally {
        setReviewingId(null);
      }
    },
    [projectId, applyReview],
  );

  return {
    claims,
    filtered,
    loading,
    error,
    filter,
    setFilter,
    query,
    setQuery,
    reviewingId,
    review,
    reload: load,
  };
}