import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-ink-200 bg-white shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('min-w-0 border-b border-ink-100 px-4 py-3.5 sm:px-5 sm:py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-semibold text-ink-900 break-words', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('mt-1 text-sm text-ink-500 break-words', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('min-w-0 px-4 py-3.5 sm:px-5 sm:py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center border-t border-ink-100 px-4 py-3 sm:px-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 min-w-0">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
            {eyebrow}
          </div>
        )}
        <h2 className="mt-1 text-xl font-semibold text-ink-950 break-words">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-500 break-words">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2 flex-wrap">
          {action}
        </div>
      )}
    </div>
  );
}
