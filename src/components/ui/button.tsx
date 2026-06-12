'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-[family-name:var(--font-body)]',
          {
            'bg-accent-container text-on-primary hover:bg-accent shadow-md shadow-accent-container/20': variant === 'primary',
            'bg-surface-2 text-foreground hover:bg-surface-high': variant === 'secondary',
            'border border-border text-accent hover:bg-accent-muted': variant === 'outline',
            'text-text-secondary hover:text-foreground hover:bg-surface': variant === 'ghost',
            'bg-error text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-2.5 text-sm': size === 'md',
            'px-8 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
