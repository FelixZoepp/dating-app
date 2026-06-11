'use client';

import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer',
        selected
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border bg-surface text-text-secondary hover:border-accent/50 hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {label}
    </button>
  );
}
