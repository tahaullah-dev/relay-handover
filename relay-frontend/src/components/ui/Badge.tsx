import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone =
  | 'green'
  | 'blue'
  | 'amber'
  | 'gray'
  | 'emerald'
  | 'violet'
  | 'red'
  | 'neutral'
  | 'info'
  | 'positive'
  | 'warning';

const toneStyles: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  gray: 'bg-ink-100 text-ink-700 ring-ink-500/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  neutral: 'bg-ink-100 text-ink-700 ring-ink-500/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  positive: 'bg-green-50 text-green-700 ring-green-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({
  className,
  tone = 'neutral',
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}