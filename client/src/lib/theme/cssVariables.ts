// Performance Optimized Theme Switching Utilities

// CSS 변수 캐싱을 위한 Map
const cssVariableCache = new Map<string, string>()

export class ThemeOptimizer {
  private static cache = new Map<string, string>()
  private static debounceTimers = new Map<string, NodeJS.Timeout>()
  
  // CSS 변수 생성 최적화 (캐싱)
  static getCSSVariable(name: string, fallback?: string): string {
    const cacheKey = `${name}-${fallback || ''}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    const variable = fallback 
      ? `var(--${name}, ${fallback})`
      : `var(--${name})`
    
    this.cache.set(cacheKey, variable)
    return variable
  }
  
  // 테마별 CSS 번들 생성
  static generateThemeCSS(theme: 'light' | 'dark'): string {
    const cacheKey = `theme-css-${theme}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    const variables = theme === 'dark' 
      ? DARK_THEME_VARIABLES 
      : LIGHT_THEME_VARIABLES
    
    const css = Object.entries(variables)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n')
    
    this.cache.set(cacheKey, css)
    return css
  }
  
  // Critical CSS 추출 (인라인으로 삽입할 중요한 CSS)
  static extractCriticalCSS(): string {
    return `
      :root { 
        color-scheme: light;
        ${this.generateThemeCSS('light')} 
      }
      [data-theme="dark"] { 
        color-scheme: dark;
        ${this.generateThemeCSS('dark')} 
      }
      
      /* Critical 애니메이션 */
      * {
        transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
      }
      
      /* 모션 줄이기 */
      @media (prefers-reduced-motion: reduce) {
        * {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }
    `
  }
  
  // 디바운스된 CSS 변수 적용
  static debouncedSetProperty(
    element: HTMLElement | Document['documentElement'],
    property: string,
    value: string,
    delay = 16 // ~1 frame at 60fps
  ): void {
    const key = `${property}-${value}`
    
    // 기존 타이머 취소
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!)
    }
    
    // 새 타이머 설정
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        element.style.setProperty(property, value)
        this.debounceTimers.delete(key)
      })
    }, delay)
    
    this.debounceTimers.set(key, timer)
  }
  
  // 배치 CSS 변수 업데이트 (성능 최적화)
  static batchUpdateProperties(
    element: HTMLElement | Document['documentElement'],
    properties: Record<string, string>
  ): void {
    requestAnimationFrame(() => {
      // DOM 조작을 한 번에 배치 처리
      const entries = Object.entries(properties)
      
      entries.forEach(([property, value]) => {
        element.style.setProperty(property, value)
      })
    })
  }
  
  // CSS 변수 캐시 클리어
  static clearCache(): void {
    this.cache.clear()
    cssVariableCache.clear()
  }
  
  // 메모리 정리
  static cleanup(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    this.clearCache()
  }
}

// 테마 변수 정의
const LIGHT_THEME_VARIABLES = {
  'background': '0 0% 100%',
  'foreground': '222.2 84% 4.9%',
  'card': '0 0% 100%',
  'card-foreground': '222.2 84% 4.9%',
  'popover': '0 0% 100%',
  'popover-foreground': '222.2 84% 4.9%',
  'primary': '222.2 47.4% 11.2%',
  'primary-foreground': '210 40% 98%',
  'secondary': '210 40% 96.1%',
  'secondary-foreground': '222.2 47.4% 11.2%',
  'muted': '210 40% 96.1%',
  'muted-foreground': '215.4 16.3% 46.9%',
  'accent': '210 40% 96.1%',
  'accent-foreground': '222.2 47.4% 11.2%',
  'destructive': '0 84.2% 60.2%',
  'destructive-foreground': '210 40% 98%',
  'border': '214.3 31.8% 91.4%',
  'input': '214.3 31.8% 91.4%',
  'ring': '222.2 84% 4.9%'
}

const DARK_THEME_VARIABLES = {
  'background': '222.2 84% 4.9%',
  'foreground': '210 40% 98%',
  'card': '222.2 84% 4.9%',
  'card-foreground': '210 40% 98%',
  'popover': '222.2 84% 4.9%',
  'popover-foreground': '210 40% 98%',
  'primary': '210 40% 98%',
  'primary-foreground': '222.2 47.4% 11.2%',
  'secondary': '217.2 32.6% 17.5%',
  'secondary-foreground': '210 40% 98%',
  'muted': '217.2 32.6% 17.5%',
  'muted-foreground': '215 20.2% 65.1%',
  'accent': '217.2 32.6% 17.5%',
  'accent-foreground': '210 40% 98%',
  'destructive': '0 62.8% 30.6%',
  'destructive-foreground': '210 40% 98%',
  'border': '217.2 32.6% 17.5%',
  'input': '217.2 32.6% 17.5%',
  'ring': '212.7 26.8% 83.9%'
}

// 테마 로딩 최적화 훅
import { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/themeStore'

export const useOptimizedTheme = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { applyTheme } = useThemeStore()
  
  useEffect(() => {
    // 테마 적용 최적화
    const optimizedApply = debounce(() => {
      setIsTransitioning(true)
      
      requestAnimationFrame(() => {
        applyTheme()
        
        // 전환 완료 후 로딩 상태 해제
        setTimeout(() => {
          setIsLoading(false)
          setIsTransitioning(false)
        }, 300) // 애니메이션 시간과 동기화
      })
    }, 100)
    
    optimizedApply()
    
    return () => {
      // 컴포넌트 언마운트 시 정리
      ThemeOptimizer.cleanup()
    }
  }, [applyTheme])
  
  return { 
    isLoading, 
    isTransitioning,
    optimizeTheme: () => optimizedApply()
  }
}

// 디바운스 유틸리티
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined

  return (...args: Parameters<T>) => {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// CSS 변수 값 가져오기 (캐싱된)
export const getCachedCSSVariable = (name: string): string => {
  if (cssVariableCache.has(name)) {
    return cssVariableCache.get(name)!
  }
  
  if (typeof window === 'undefined') return ''
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim()
  
  cssVariableCache.set(name, value)
  return value
}

// 테마 전환 성능 측정
export const measureThemeTransition = () => {
  const start = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`테마 전환 소요 시간: ${duration.toFixed(2)}ms`)
      return duration
    }
  }
}

// 인라인 크리티컬 CSS 삽입 (초기 로딩 최적화)
export const injectCriticalCSS = () => {
  if (typeof window === 'undefined') return
  
  const criticalCSS = ThemeOptimizer.extractCriticalCSS()
  const style = document.createElement('style')
  style.id = 'critical-theme-css'
  style.innerHTML = criticalCSS
  
  // 기존 크리티컬 CSS 제거
  const existing = document.getElementById('critical-theme-css')
  if (existing) {
    existing.remove()
  }
  
  // head에 삽입 (최우선)
  document.head.insertBefore(style, document.head.firstChild)
}

// 테마 프리로딩 (다음 테마 미리 준비)
export const preloadTheme = (theme: 'light' | 'dark') => {
  const css = ThemeOptimizer.generateThemeCSS(theme)
  const blob = new Blob([css], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = url
  link.onload = () => URL.revokeObjectURL(url)
  
  document.head.appendChild(link)
}

// 시스템 테마 변경 감지 및 최적화
export const optimizedSystemThemeDetection = (callback: (isDark: boolean) => void) => {
  if (typeof window === 'undefined') return () => {}
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  let isFirstCall = true
  
  const handleChange = debounce((e: MediaQueryListEvent) => {
    if (isFirstCall) {
      isFirstCall = false
      return
    }
    
    requestAnimationFrame(() => {
      callback(e.matches)
    })
  }, 50)
  
  mediaQuery.addEventListener('change', handleChange)
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}