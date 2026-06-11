import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'premium';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-surface-2 text-text-secondary': variant === 'default',
          'bg-success/15 text-success': variant === 'success',
          'bg-accent-muted text-accent': variant === 'warning',
          'bg-error/15 text-error': variant === 'danger',
          'bg-gradient-to-r from-accent to-amber-500 text-background font-semibold': variant === 'premium',
        },
        className
      )}
      {...props}
    />
  );
}
