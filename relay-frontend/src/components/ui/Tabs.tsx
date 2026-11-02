import { cn } from '@/lib/utils';

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: string; count?: number }[];
  className?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-ink-200 bg-ink-50 p-1 scrollbar-none',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium transition-colors whitespace-nowrap',
              active
                ? 'bg-white text-ink-950 shadow-soft'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-medium',
                  active
                    ? 'bg-ink-100 text-ink-700'
                    : 'bg-ink-200/60 text-ink-600',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
