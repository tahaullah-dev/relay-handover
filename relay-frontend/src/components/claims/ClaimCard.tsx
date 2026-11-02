import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { CATEGORY_META, REVIEW_STATUS_META } from '@/lib/constants';
import type { Claim } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { TrustLabelBadge } from './TrustLabel';
import { cn } from '@/lib/utils';

const categoryIcons: Record<Claim['category'], React.ReactNode> = {
  decision: <Sparkles className="h-3.5 w-3.5" />,
  'task-status': <CheckCircle2 className="h-3.5 w-3.5" />,
  ownership: <ThumbsUp className="h-3.5 w-3.5" />,
  dependency: <ArrowUpRight className="h-3.5 w-3.5" />,
  risk: <ShieldAlert className="h-3.5 w-3.5" />,
  'unresolved-question': <MessageSquareWarning className="h-3.5 w-3.5" />,
};

export function ClaimCard({
  claim,
  projectId,
}: {
  claim: Claim;
  projectId: string;
}) {
  const category = CATEGORY_META[claim.category];
  const review = REVIEW_STATUS_META[claim.reviewStatus];
  const isConflicting = claim.trustLabel === 'conflicting';
  const isReviewed =
    claim.reviewStatus === 'confirmed' ||
    claim.reviewStatus === 'corrected';

  const statement =
    claim.reviewStatus === 'corrected' && claim.correctedStatement
      ? claim.correctedStatement
      : claim.statement;

  return (
    <Link
      to={`/projects/${projectId}/claims/${claim.id}`}
      className={cn(
        'group block min-w-0 rounded-lg border bg-white p-4 shadow-card transition-all',
        'hover:border-ink-300 hover:shadow-elevated',
        isConflicting
          ? 'border-amber-200 bg-amber-50/30'
          : 'border-ink-200',
      )}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              <span className="inline-flex items-center gap-1">
                {categoryIcons[claim.category]}
                {category.label}
              </span>
            </Badge>
            <TrustLabelBadge value={claim.trustLabel} />
            {isReviewed && (
              <Badge tone={review.tone}>
                <ShieldCheck className="h-3 w-3" />
                {review.label}
              </Badge>
            )}
            {claim.relatedIdentifier && (
              <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs text-ink-600 break-all">
                {claim.relatedIdentifier}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-900 break-words">
            {statement}
          </p>
          {claim.reviewStatus === 'corrected' && claim.correctedStatement && (
            <p className="mt-1.5 text-xs text-ink-500 line-through break-words">
              Original: {claim.statement}
            </p>
          )}
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-600 mt-0.5" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500 min-w-0">
        <span className="inline-flex items-center gap-1 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {claim.supportingCount} supporting
        </span>
        <span className="inline-flex items-center gap-1 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {claim.contradictingCount} contradicting
        </span>
        {claim.reviewedBy && (
          <span className="sm:ml-auto break-words">
            Reviewed by {claim.reviewedBy}
          </span>
        )}
      </div>
    </Link>
  );
}
