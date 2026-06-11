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
          'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'bg-accent text-background hover:bg-accent-hover focus:ring-accent': variant === 'primary',
            'bg-surface-2 text-foreground hover:bg-border focus:ring-surface-2': variant === 'secondary',
            'border border-border text-foreground hover:bg-surface focus:ring-border': variant === 'outline',
            'text-text-secondary hover:text-foreground hover:bg-surface focus:ring-surface': variant === 'ghost',
            'bg-error text-white hover:bg-red-600 focus:ring-error': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-8 py-3.5 text-base font-semibold': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
