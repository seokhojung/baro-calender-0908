'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECT_COLORS, ProjectColor, getProjectColorConfig } from '@/types/project';

interface ColorPickerProps {
  value: ProjectColor;
  onChange: (color: ProjectColor) => void;
  className?: string;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  className,
  disabled = false
}) => {
  return (
    <div 
      className={cn("color-picker grid grid-cols-4 gap-2 p-4", className)}
      role="radiogroup"
      aria-label="프로젝트 색상 선택"
    >
      {Object.entries(PROJECT_COLORS).map(([key, config]) => (
        <button
          key={key}
          type="button"
          className={cn(
            "w-12 h-12 rounded-full border-2 transition-all duration-200",
            "hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2",
            "focus-visible:ring-blue-500 focus-visible:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            value === key 
              ? "border-foreground scale-110 shadow-lg" 
              : "border-transparent hover:border-muted-foreground"
          )}
          style={{ 
            backgroundColor: config.primary,
            '--ring-offset-color': 'hsl(var(--background))'
          } as React.CSSProperties}
          onClick={() => !disabled && onChange(key as ProjectColor)}
          disabled={disabled}
          aria-label={`색상 선택: ${config.name}`}
          aria-pressed={value === key}
          role="radio"
          aria-checked={value === key}
        >
          {value === key && (
            <Check 
              className="w-6 h-6 text-white mx-auto drop-shadow-sm" 
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  );
};

// Compact version for inline use
export const ColorPickerInline: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  className,
  disabled = false
}) => {
  return (
    <div 
      className={cn("flex gap-1", className)}
      role="radiogroup"
      aria-label="프로젝트 색상 선택"
    >
      {Object.entries(PROJECT_COLORS).map(([key, config]) => (
        <button
          key={key}
          type="button"
          className={cn(
            "w-6 h-6 rounded-full border transition-all duration-150",
            "hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2",
            "focus-visible:ring-blue-500 focus-visible:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            value === key 
              ? "border-foreground scale-110" 
              : "border-transparent hover:border-muted-foreground"
          )}
          style={{ backgroundColor: config.primary }}
          onClick={() => !disabled && onChange(key as ProjectColor)}
          disabled={disabled}
          aria-label={`색상 선택: ${config.name}`}
          aria-pressed={value === key}
          role="radio"
          aria-checked={value === key}
        >
          {value === key && (
            <Check 
              className="w-3 h-3 text-white mx-auto" 
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  );
};

// Color indicator component
export const ColorIndicator: React.FC<{
  color: ProjectColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ color, size = 'md', className }) => {
  const config = getProjectColorConfig(color);
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };
  
  return (
    <div 
      className={cn(
        "rounded-full flex-shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: config.primary }}
      role="img"
      aria-label={`프로젝트 색상: ${config.name}`}
    />
  );
};