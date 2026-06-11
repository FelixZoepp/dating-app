'use client';

import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: string[];
}

export function Slider({ label, value, onChange, min = 1, max = 5, labels }: SliderProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm font-semibold text-accent">{value}/{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'w-full h-2 bg-surface-2 rounded-full appearance-none cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer'
        )}
      />
      {labels && (
        <div className="flex justify-between mt-1">
          {labels.map((l) => (
            <span key={l} className="text-xs text-text-secondary">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
