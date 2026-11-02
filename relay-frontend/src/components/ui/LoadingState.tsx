import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-ink-500',
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}