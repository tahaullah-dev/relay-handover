import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { fetchClaims } from '@/api/claims';
import type { Claim, ReviewStatus } from '@/types';
import { CATEGORY_META, REVIEW_STATUS_META } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionHeading,
} from '@/components/ui/Card';
import { TrustLabelBadge } from '@/components/claims/TrustLabel';
import { EvidencePanel } from '@/components/claims/EvidencePanel';
import { ReviewActions } from '@/components/claims/ReviewActions';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDateTime } from '@/lib/utils';
import { reviewClaim } from '@/api/claims';
import { Link } from 'react-router-dom';

export function ClaimDetail() {
  const { projectId = '', claimId = '' } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewerName, setReviewerName] = useState('Alex Chen');
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await fetchClaims(projectId);
      const found = all.find((c) => c.id === claimId) ?? null;
      setClaim(found);
      if (!found) setError('Claim not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claim');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, claimId]);

  const handleAction = async (
    action: 'confirm' | 'correct' | 'reject' | 'needs-evidence',
    opts: { correctedStatement?: string; comment?: string },
  ) => {
    setBusy(true);
    setFlash(null);
    try {
      const result = await reviewClaim(projectId, claimId, {
        action,
        correctedStatement: opts.correctedStatement,
        comment: opts.comment,
        reviewer: reviewerName,
      });
      setClaim(result.claim);
      const label = REVIEW_STATUS_META[result.reviewStatus as ReviewStatus].label;
      setFlash(`Review saved — ${label}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Review failed. Please retry.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading claim…" />;
  if (error && !claim) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (!claim) return null;

  const category = CATEGORY_META[claim.category];
  const reviewMeta = REVIEW_STATUS_META[claim.reviewStatus];
  const displayedStatement =
    claim.reviewStatus === 'corrected' && claim.correctedStatement
      ? claim.correctedStatement
      : claim.statement;

  return (
    <div className="mx-auto max-w-5xl space-y-6 min-w-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
          onClick={() => navigate(`/projects/${projectId}/claims`)}
        >
          All claims
        </Button>
      </div>

      <SectionHeading
        eyebrow={`Claim ${claim.id} · ${category.label}`}
        title={displayedStatement}
        description={
          claim.relatedIdentifier
            ? `Related identifier: ${claim.relatedIdentifier}`
            : undefined
        }
        action={<TrustLabelBadge value={claim.trustLabel} />}
      />

      {claim.reviewStatus === 'corrected' && claim.correctedStatement && (
        <Card className="min-w-0">
          <CardContent className="text-sm">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
              Original statement
            </div>
            <p className="mt-1 text-ink-600 line-through break-words">
              {claim.statement}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-5 min-w-0">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <EvidencePanel
              supporting={claim.supporting}
              contradicting={claim.contradicting}
              verificationNote={claim.verificationNote}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>Review</CardTitle>
              <Badge tone={reviewMeta.tone}>{reviewMeta.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 min-w-0">
            <ReviewActions
              claim={claim}
              reviewerName={reviewerName}
              onReviewerNameChange={setReviewerName}
              onAction={handleAction}
              busy={busy}
            />

            {flash && (
              <div className="rounded-md border border-green-200 bg-green-50/60 px-3 py-2 text-xs text-green-800 break-words">
                {flash}
              </div>
            )}

            {claim.reviewerComment && (
              <div className="rounded-md border border-ink-200 bg-ink-50/60 p-3 min-w-0">
                <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
                  Reviewer comment
                </div>
                <p className="mt-1 text-sm text-ink-700 break-words">
                  {claim.reviewerComment}
                </p>
                <div className="mt-1.5 text-[11px] text-ink-500 break-words">
                  {claim.reviewedBy} ·{' '}
                  {formatDateTime(claim.lastReviewedAt)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
              <div className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 shrink-0" />
                <span>Review history recorded.</span>
              </div>
              <Link
                to={`/projects/${projectId}/audit`}
                className="sm:ml-auto font-medium text-ink-700 hover:text-ink-950"
              >
                View audit →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
