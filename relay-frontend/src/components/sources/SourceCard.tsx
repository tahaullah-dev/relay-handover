import { GitBranch, Ticket, MessageSquare, FileText } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import type { Source, SourceKind } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Replaced brand icons with safe, generic Lucide equivalents
const sourceMeta: Record<
  SourceKind,
  { icon: React.ReactNode; tone: string; label: string }
> = {
  github: {
    icon: <GitBranch className="h-5 w-5" />,
    tone: 'bg-ink-900 text-white',
    label: 'GitHub',
  },
  jira: {
    icon: <Ticket className="h-5 w-5" />,
    tone: 'bg-blue-600 text-white',
    label: 'Jira',
  },
  slack: {
    icon: <MessageSquare className="h-5 w-5" />,
    tone: 'bg-violet-600 text-white',
    label: 'Slack',
  },
  notion: {
    icon: <FileText className="h-5 w-5" />,
    tone: 'bg-ink-800 text-white',
    label: 'Notion',
  },
};

const statusMeta: Record<
  Source['status'],
  { label: string; tone: 'positive' | 'info' | 'neutral' | 'warning' }
> = {
  connected: { label: 'Connected', tone: 'positive' },
  imported: { label: 'Imported', tone: 'info' },
  pending: { label: 'Pending', tone: 'neutral' },
  error: { label: 'Error', tone: 'warning' },
};

export function SourceCard({
  source,
  action,
}: {
  source: Source;
  action?: React.ReactNode;
}) {
  const meta = sourceMeta[source.kind];
  const status = statusMeta[source.status];
  return (
    <div
      className={cn(
        'flex flex-col min-w-0 rounded-lg border border-ink-200 bg-white p-4 shadow-card',
      )}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
              meta.tone,
            )}
          >
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-950 truncate">
              {meta.label}
            </div>
            <div className="font-mono text-xs text-ink-500 break-all">
              {source.identifier}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          {source.isSynthetic && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              Synthetic
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs min-w-0">
        <div>
          <dt className="text-ink-500">Records</dt>
          <dd className="mt-0.5 font-mono text-sm font-medium text-ink-900">
            {source.recordCount.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500">Last import</dt>
          <dd className="mt-0.5 text-sm text-ink-900 truncate">
            {formatRelative(source.lastImportedAt)}
          </dd>
        </div>
      </dl>

      {action && <div className="mt-4 pt-1">{action}</div>}
    </div>
  );
}
