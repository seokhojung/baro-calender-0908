"use client";

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Touch-friendly switch component with accessibility support
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
    };

    return (
      <label
        className={cn(
          'relative inline-flex items-center h-6 w-11 cursor-pointer',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-full',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
        <span
          className={cn(
            'block w-11 h-6 bg-muted border-2 border-transparent rounded-full transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            checked ? 'bg-primary' : 'bg-input'
          )}
        />
        <span
          className={cn(
            'absolute left-0.5 top-0.5 bg-background border border-border rounded-full h-5 w-5 transition-transform',
            'shadow-sm',
            checked ? 'translate-x-5 border-primary' : 'translate-x-0'
          )}
        />
      </label>
    );
  }
);

Switch.displayName = 'Switch';