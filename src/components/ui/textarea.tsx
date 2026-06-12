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
          <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-1.5 font-[family-name:var(--font-body)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white text-foreground placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-container focus:border-transparent resize-none font-[family-name:var(--font-body)]',
            error ? 'border-error' : 'border-border-light',
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
