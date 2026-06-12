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
        'px-5 py-3 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer font-[family-name:var(--font-body)]',
        selected
          ? 'border-accent-container bg-accent-container text-on-primary shadow-md shadow-accent-container/20'
          : 'border-border-light bg-white text-text-secondary hover:border-border hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {label}
    </button>
  );
}
