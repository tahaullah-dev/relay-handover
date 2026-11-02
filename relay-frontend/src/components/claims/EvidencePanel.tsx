import { ExternalLink, Quote } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { EvidenceRecord, SourceKind } from '@/types';
import { cn } from '@/lib/utils';

const sourceIcons: Record<SourceKind, string> = {
  github: 'GH',
  jira: 'JR',
  slack: 'SL',
  notion: 'NT',
};

const sourceColors: Record<SourceKind, string> = {
  github: 'bg-ink-900 text-white',
  jira: 'bg-blue-600 text-white',
  slack: 'bg-violet-600 text-white',
  notion: 'bg-ink-800 text-white',
};

function EvidenceItem({
  evidence,
  stance,
}: {
  evidence: EvidenceRecord;
  stance: 'supporting' | 'contradicting';
}) {
  const tone =
    stance === 'supporting'
      ? 'border-green-200 bg-green-50/40'
      : 'border-red-200 bg-red-50/40';
  const quoteTone =
    stance === 'supporting' ? 'text-green-900' : 'text-red-900';

  return (
    <article
      className={cn(
        'min-w-0 rounded-md border p-3',
        tone,
      )}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={cn(
              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold',
              sourceColors[evidence.sourceKind],
            )}
          >
            {sourceIcons[evidence.sourceKind]}
          </span>
          <div className="text-xs min-w-0 flex-1">
            <div className="font-medium text-ink-900 truncate">
              {evidence.sourceName}
              <span className="mx-1 text-ink-400">·</span>
              <span className="font-mono text-ink-600 break-all">
                {evidence.recordId}
              </span>
            </div>
            <div className="text-ink-500 truncate">
              {evidence.author ? `${evidence.author} · ` : ''}
              {formatDate(evidence.timestamp)}
            </div>
          </div>
        </div>
        {evidence.url && (
          <a
            href={evidence.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-ink-600 hover:bg-white hover:text-ink-900 whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            Open source
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="mt-2 flex items-start gap-2 rounded bg-white/70 p-2.5 min-w-0">
        <Quote
          className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', quoteTone)}
        />
        <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-ink-800 min-w-0 flex-1">
          {evidence.excerpt}
        </pre>
      </div>
    </article>
  );
}

export function EvidencePanel({
  supporting,
  contradicting,
  verificationNote,
}: {
  supporting: EvidenceRecord[];
  contradicting: EvidenceRecord[];
  verificationNote: string;
}) {
  return (
    <div className="space-y-5 min-w-0">
      <section className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-600">
            Supporting evidence
          </h4>
          <span className="text-xs text-ink-500">
            ({supporting.length})
          </span>
        </div>
        {supporting.length === 0 ? (
          <p className="rounded-md border border-dashed border-ink-200 bg-ink-50/40 px-3 py-4 text-center text-xs text-ink-500">
            No supporting evidence found in the connected sources.
          </p>
        ) : (
          <div className="space-y-2 min-w-0">
            {supporting.map((e) => (
              <EvidenceItem
                key={e.id}
                evidence={e}
                stance="supporting"
              />
            ))}
          </div>
        )}
      </section>

      <section className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-600">
            Contradicting evidence
          </h4>
          <span className="text-xs text-ink-500">
            ({contradicting.length})
          </span>
        </div>
        {contradicting.length === 0 ? (
          <p className="rounded-md border border-dashed border-ink-200 bg-ink-50/40 px-3 py-4 text-center text-xs text-ink-500">
            No contradicting evidence found.
          </p>
        ) : (
          <div className="space-y-2 min-w-0">
            {contradicting.map((e) => (
              <EvidenceItem
                key={e.id}
                evidence={e}
                stance="contradicting"
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-ink-200 bg-ink-50/60 p-3 min-w-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-600">
          Verification explanation
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-700 break-words">
          {verificationNote}
        </p>
      </section>
    </div>
  );
}
