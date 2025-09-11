import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
type BreakpointValues = Record<Breakpoint, number>

const breakpoints: BreakpointValues = {
  xs: 375,   // Mobile (small)
  sm: 640,   // Mobile (large)
  md: 768,   // Tablet (portrait)
  lg: 1024,  // Tablet (landscape) / Desktop (small)
  xl: 1280,  // Desktop (medium)
  '2xl': 1536, // Desktop (large)
  '3xl': 1920, // Desktop (extra large)
}

export const useResponsive = () => {
  const [windowWidth, setWindowWidth] = useState<number>(0)
  const [windowHeight, setWindowHeight] = useState<number>(0)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }
    
    // 초기값 설정
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const isBreakpoint = (breakpoint: Breakpoint) => {
    return windowWidth >= breakpoints[breakpoint]
  }
  
  const isMobile = windowWidth < breakpoints.sm
  const isTablet = windowWidth >= breakpoints.sm && windowWidth < breakpoints.lg
  const isDesktop = windowWidth >= breakpoints.lg
  
  const currentBreakpoint = (): Breakpoint => {
    if (windowWidth >= breakpoints['3xl']) return '3xl'
    if (windowWidth >= breakpoints['2xl']) return '2xl'
    if (windowWidth >= breakpoints.xl) return 'xl'
    if (windowWidth >= breakpoints.lg) return 'lg'
    if (windowWidth >= breakpoints.md) return 'md'
    if (windowWidth >= breakpoints.sm) return 'sm'
    return 'xs'
  }
  
  // 디바이스 방향 감지
  const isLandscape = windowWidth > windowHeight
  const isPortrait = windowHeight >= windowWidth
  
  // 터치 디바이스 감지 (approximate)
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  
  return {
    windowWidth,
    windowHeight,
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    isTouchDevice,
    currentBreakpoint: currentBreakpoint(),
  }
}

// 반응형 그리드 컴포넌트
export interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number
  className?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 4,
  className,
}) => {
  const gridClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.xs && `xs:grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    `gap-${gap}`,
  ].filter(Boolean).join(' ')
  
  return (
    <div className={cn('grid', gridClasses, className)}>
      {children}
    </div>
  )
}

// 반응형 컨테이너 컴포넌트
export interface ResponsiveContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  size = 'lg',
  padding = true,
  className,
}) => {
  const containerClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-none',
  }
  
  return (
    <div 
      className={cn(
        'mx-auto w-full',
        containerClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

// 반응형 스택 컴포넌트 (수직/수평 레이아웃 전환)
export interface ResponsiveStackProps {
  children: React.ReactNode
  direction?: {
    default?: 'vertical' | 'horizontal'
    sm?: 'vertical' | 'horizontal'
    md?: 'vertical' | 'horizontal'
    lg?: 'vertical' | 'horizontal'
  }
  gap?: number
  className?: string
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { default: 'vertical', md: 'horizontal' },
  gap = 4,
  className,
}) => {
  const getDirectionClass = (dir: 'vertical' | 'horizontal') => {
    return dir === 'horizontal' ? 'flex-row' : 'flex-col'
  }
  
  const stackClasses = [
    'flex',
    direction.default && getDirectionClass(direction.default),
    direction.sm && `sm:${getDirectionClass(direction.sm)}`,
    direction.md && `md:${getDirectionClass(direction.md)}`,
    direction.lg && `lg:${getDirectionClass(direction.lg)}`,
    `gap-${gap}`,
  ].filter(Boolean).join(' ')
  
  return (
    <div className={cn(stackClasses, className)}>
      {children}
    </div>
  )
}

// 반응형 이미지 컴포넌트
export interface ResponsiveImageProps {
  src: string
  alt: string
  sizes?: {
    default?: { width: number; height: number }
    sm?: { width: number; height: number }
    md?: { width: number; height: number }
    lg?: { width: number; height: number }
  }
  className?: string
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes,
  className,
}) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        loading="lazy"
      />
    </div>
  )
}

// 반응형 비율 컨테이너
export interface AspectRatioProps {
  children: React.ReactNode
  ratio?: number // width / height
  className?: string
}

export const AspectRatio: React.FC<AspectRatioProps> = ({
  children,
  ratio = 16 / 9,
  className,
}) => {
  return (
    <div className={cn('relative w-full', className)}>
      <div 
        className="absolute inset-0"
        style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
      />
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  )
}

// 미디어 쿼리 훅
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)
    
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])
  
  return matches
}

// 시스템 선호도 훅
export const useSystemPreferences = () => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)')
  
  return {
    prefersDark,
    prefersReducedMotion,
    prefersHighContrast,
  }
}