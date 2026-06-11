'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border bg-surface text-foreground placeholder:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none',
            error ? 'border-error' : 'border-border',
            className
          )}
          rows={4}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
