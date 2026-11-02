import { Code2, Briefcase } from 'lucide-react';
import type { HandoverRole } from '@/types';
import { cn } from '@/lib/utils';

export function RoleSelector({
  value,
  onChange,
}: {
  value: HandoverRole;
  onChange: (v: HandoverRole) => void;
}) {
  const options: { value: HandoverRole; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'developer',
      label: 'Developer',
      icon: <Code2 className="h-4 w-4 shrink-0" />,
      description: 'Full evidence chain, codebase entry points, blockers.',
    },
    {
      value: 'stakeholder',
      label: 'Stakeholder',
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
      description: 'High-level status, risks, decisions. No code detail.',
    },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-ink-50 p-1 max-w-full">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors',
              active
                ? 'bg-white text-ink-950 shadow-soft'
                : 'text-ink-600 hover:text-ink-900',
            )}
            title={o.description}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
