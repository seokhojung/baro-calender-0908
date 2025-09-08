"use client";

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
  scrollbarThumb?: string;
  scrollbarTrack?: string;
}

/**
 * Custom scroll area component with smooth scrolling and touch optimization
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, orientation = 'vertical', scrollbarThumb, scrollbarTrack, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'scroll-smooth-mobile',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full',
            {
              'overflow-y-auto overflow-x-hidden': orientation === 'vertical',
              'overflow-x-auto overflow-y-hidden': orientation === 'horizontal',
              'overflow-auto': orientation === 'both',
            },
            // Custom scrollbar styles
            'scrollbar-thin',
            scrollbarThumb ? `scrollbar-thumb-[${scrollbarThumb}]` : 'scrollbar-thumb-border/30',
            scrollbarTrack ? `scrollbar-track-[${scrollbarTrack}]` : 'scrollbar-track-transparent',
            // Touch-friendly scrolling
            'touch-pan-y',
            // Webkit scrollbar customization
            '[&::-webkit-scrollbar]:w-2',
            '[&::-webkit-scrollbar]:h-2',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:bg-border/30',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb:hover]:bg-border/50',
            // Firefox scrollbar
            'scrollbar-width-thin',
            'scrollbar-color-border/30 transparent'
          )}
          style={{
            // Ensure smooth momentum scrolling on iOS
            WebkitOverflowScrolling: 'touch',
            // Optimize scrolling performance
            willChange: 'scroll-position',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
  forceMount?: boolean;
}

/**
 * Custom scrollbar component (for more advanced use cases)
 */
export const ScrollBar = forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ orientation = 'vertical', forceMount, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex touch-none select-none transition-colors',
          {
            'h-full w-2.5 border-l border-l-transparent p-[1px]': orientation === 'vertical',
            'w-full h-2.5 border-t border-t-transparent p-[1px]': orientation === 'horizontal',
          },
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'relative bg-border rounded-full',
            {
              'flex-1': orientation === 'vertical',
              'h-full': orientation === 'horizontal',
            }
          )}
        />
      </div>
    );
  }
);

ScrollBar.displayName = 'ScrollBar';