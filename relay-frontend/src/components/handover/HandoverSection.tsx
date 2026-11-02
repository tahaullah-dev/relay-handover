import type { HandoverSection as Section } from '@/types';
import { cn } from '@/lib/utils';

export function HandoverSectionView({
  section,
  index,
}: {
  section: Section;
  index: number;
}) {
  const paragraphs = section.body
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      id={section.id}
      className={cn(
        'scroll-mt-24 border-l-2 border-ink-200 py-4 sm:py-5 pl-3 sm:pl-5 min-w-0',
        'hover:border-ink-400',
      )}
    >
      <div className="flex items-baseline gap-2.5 sm:gap-3 min-w-0">
        <span className="font-mono text-xs text-ink-400 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-base font-semibold text-ink-950 break-words min-w-0">
          {section.title}
        </h3>
      </div>
      <div className="mt-3 space-y-2 min-w-0">
        {paragraphs.map((p, i) => {
          const isListItem = p.startsWith('- ');
          const text = isListItem ? p.slice(2) : p;
          const formatted = formatInline(text);
          if (isListItem) {
            return (
              <div key={i} className="flex gap-2 text-sm text-ink-700 min-w-0">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                <div className="leading-relaxed break-words min-w-0 flex-1">{formatted}</div>
              </div>
            );
          }
          return (
            <div key={i} className="text-sm leading-relaxed text-ink-700 break-words min-w-0">
              {formatted}
            </div>
          );
        })}
      </div>
      {section.claims.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {section.claims.map((cid) => (
            <span
              key={cid}
              className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600 break-all"
            >
              {cid}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function formatInline(text: string): React.ReactNode {
  // Very small markdown-ish formatter: **bold** and `code`.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0] ?? '';
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-ink-900 break-words">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-ink-100 px-1 py-0.5 font-mono text-xs text-ink-800 break-all"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}
