"use client";

import React, { forwardRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  desktopBreakpoint?: number;
  orientation?: 'portrait' | 'landscape' | 'auto';
  touchOptimized?: boolean;
  safeArea?: boolean;
}

/**
 * Responsive layout container with mobile-first approach and touch optimization
 */
export const ResponsiveLayout = forwardRef<HTMLDivElement, ResponsiveLayoutProps>(
  (
    {
      children,
      className,
      mobileBreakpoint = 640,
      tabletBreakpoint = 768,
      desktopBreakpoint = 1024,
      orientation = 'auto',
      touchOptimized = true,
      safeArea = true,
      ...props
    },
    ref
  ) => {
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
    const [isTouch, setIsTouch] = useState(false);
    const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>('portrait');

    useEffect(() => {
      const updateScreenSize = () => {
        const width = window.innerWidth;
        if (width < mobileBreakpoint) {
          setScreenSize('mobile');
        } else if (width < desktopBreakpoint) {
          setScreenSize('tablet');
        } else {
          setScreenSize('desktop');
        }
      };

      const updateTouchCapability = () => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
      };

      const updateOrientation = () => {
        setCurrentOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
      };

      // Initial setup
      updateScreenSize();
      updateTouchCapability();
      updateOrientation();

      // Event listeners
      window.addEventListener('resize', updateScreenSize);
      window.addEventListener('resize', updateOrientation);
      window.addEventListener('orientationchange', updateOrientation);

      return () => {
        window.removeEventListener('resize', updateScreenSize);
        window.removeEventListener('resize', updateOrientation);
        window.removeEventListener('orientationchange', updateOrientation);
      };
    }, [mobileBreakpoint, desktopBreakpoint]);

    const layoutClasses = cn(
      'responsive-layout',
      'w-full min-h-0 flex flex-col',
      {
        // Safe area support
        'safe-area-inset': safeArea,
        
        // Touch optimization
        'touch-manipulation': touchOptimized && isTouch,
        'tap-highlight-transparent': touchOptimized && isTouch,
        
        // Screen size classes
        'layout-mobile': screenSize === 'mobile',
        'layout-tablet': screenSize === 'tablet',
        'layout-desktop': screenSize === 'desktop',
        
        // Touch capability classes
        'layout-touch': isTouch,
        'layout-no-touch': !isTouch,
        
        // Orientation classes
        'layout-portrait': currentOrientation === 'portrait',
        'layout-landscape': currentOrientation === 'landscape',
      },
      className
    );

    return (
      <div
        ref={ref}
        className={layoutClasses}
        data-screen-size={screenSize}
        data-touch={isTouch}
        data-orientation={currentOrientation}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveLayout.displayName = 'ResponsiveLayout';

export interface MobileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  subtitle?: string;
  compact?: boolean;
}

/**
 * Mobile-optimized header component
 */
export const MobileHeader = forwardRef<HTMLDivElement, MobileHeaderProps>(
  ({ title, leftAction, rightAction, subtitle, compact = false, className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'flex items-center justify-between',
          'bg-background border-b border-border',
          'safe-area-inset-top',
          compact ? 'px-4 py-2' : 'px-4 py-4',
          'sm:px-6 lg:px-8',
          className
        )}
        {...props}
      >
        <div className="flex items-center min-w-0">
          {leftAction && (
            <div className="mr-3 flex-shrink-0">
              {leftAction}
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className={cn(
                'font-semibold text-foreground truncate',
                compact ? 'text-lg' : 'text-xl'
              )}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightAction && (
          <div className="ml-3 flex-shrink-0">
            {rightAction}
          </div>
        )}
      </header>
    );
  }
);

MobileHeader.displayName = 'MobileHeader';

export interface MobileBottomBarProps extends React.HTMLAttributes<HTMLDivElement> {
  actions: React.ReactNode[];
  safeArea?: boolean;
}

/**
 * Mobile-optimized bottom navigation bar
 */
export const MobileBottomBar = forwardRef<HTMLDivElement, MobileBottomBarProps>(
  ({ actions, safeArea = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-around',
          'bg-background border-t border-border',
          'px-4 py-3',
          safeArea && 'safe-area-inset-bottom',
          'sm:hidden', // Hide on larger screens
          className
        )}
        {...props}
      >
        {actions.map((action, index) => (
          <div key={index} className="flex-1 flex justify-center">
            {action}
          </div>
        ))}
      </div>
    );
  }
);

MobileBottomBar.displayName = 'MobileBottomBar';

export interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  touchTarget?: 'normal' | 'large';
  children: React.ReactNode;
}

/**
 * Touch-optimized button component
 */
export const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  ({ size = 'md', variant = 'default', touchTarget = 'normal', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'touch-manipulation tap-highlight-transparent',
          
          // Size variants
          {
            'text-sm px-3 py-2': size === 'sm',
            'text-sm px-4 py-2.5': size === 'md',
            'text-base px-6 py-3': size === 'lg',
          },
          
          // Touch target sizes
          {
            'min-h-touch min-w-touch': touchTarget === 'normal',
            'min-h-touch-lg min-w-touch-lg': touchTarget === 'large',
          },
          
          // Variant styles
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80': variant === 'default',
            'hover:bg-accent hover:text-accent-foreground active:bg-accent/80': variant === 'ghost',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80': variant === 'outline',
          },
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchOptimizedButton.displayName = 'TouchOptimizedButton';

export interface GridResponsiveProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  minItemWidth?: string;
}

/**
 * Responsive grid component that adapts to screen size
 */
export const ResponsiveGrid = forwardRef<HTMLDivElement, GridResponsiveProps>(
  ({ children, columns = { mobile: 1, tablet: 2, desktop: 3 }, gap = '4', minItemWidth, className, ...props }, ref) => {
    const gridClasses = cn(
      'grid w-full',
      `gap-${gap}`,
      {
        [`grid-cols-${columns.mobile}`]: columns.mobile,
        [`md:grid-cols-${columns.tablet}`]: columns.tablet,
        [`lg:grid-cols-${columns.desktop}`]: columns.desktop,
      },
      className
    );

    const gridStyle = minItemWidth ? {
      gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
    } : undefined;

    return (
      <div
        ref={ref}
        className={gridClasses}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';