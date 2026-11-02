import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAudit } from '@/api/audit';
import type { AuditEntry } from '@/types';
import { Card, CardContent, SectionHeading } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime, initials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ScrollText } from 'lucide-react';

const ACTION_TONE: Record<string, string> = {
  'claim.confirmed': 'bg-green-50 text-green-700 ring-green-600/20',
  'claim.corrected': 'bg-violet-50 text-violet-700 ring-violet-600/20',
  'claim.rejected': 'bg-red-50 text-red-700 ring-red-600/20',
  'claim.needs-evidence': 'bg-amber-50 text-amber-800 ring-amber-600/20',
  'handover.approved': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'reconstruction.started': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'reconstruction.completed': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'sources.connected': 'bg-ink-100 text-ink-700 ring-ink-500/20',
};

export function Audit() {
  const { projectId = '' } = useParams();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAudit(projectId);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) return <LoadingState label="Loading audit…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="h-5 w-5" />}
        title="No audit entries yet"
        description="Audit entries appear here as claims are reviewed and handovers are approved."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 min-w-0">
      <SectionHeading
        eyebrow="Audit"
        title="Activity log"
        description="Every review, approval and reconstruction is recorded with who, what and when."
      />

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="divide-y divide-ink-100 p-0">
          {entries.map((e) => {
            const tone =
              ACTION_TONE[e.action] ??
              'bg-ink-100 text-ink-700 ring-ink-500/20';
            return (
              <div
                key={e.id}
                className="flex items-start gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-ink-50/40 min-w-0"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700',
                  )}
                >
                  {initials(e.actor)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-sm font-medium text-ink-950 break-words">
                      {e.actor}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap',
                        tone,
                      )}
                    >
                      {e.action}
                    </span>
                    <span className="font-mono text-[11px] text-ink-500 break-all">
                      {e.entityType}/{e.entityId}
                    </span>
                  </div>
                  {e.note && (
                    <p className="mt-1 text-sm text-ink-600 break-words">{e.note}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    <span className="whitespace-nowrap">{formatDateTime(e.timestamp)}</span>
                    {e.previousState && (
                      <span className="font-mono break-all">
                        {e.previousState} → {e.newState}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
