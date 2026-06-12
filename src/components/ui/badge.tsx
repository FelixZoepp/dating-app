import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'premium';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-body)]',
        {
          'bg-surface-2 text-text-secondary': variant === 'default',
          'bg-green-50 text-green-700': variant === 'success',
          'bg-amber-50 text-amber-700': variant === 'warning',
          'bg-red-50 text-error': variant === 'danger',
          'bg-accent-container/90 text-on-primary border border-accent-bright/30': variant === 'premium',
        },
        className
      )}
      {...props}
    />
  );
}
