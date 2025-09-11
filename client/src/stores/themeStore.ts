import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectColor, getProjectColor } from '@/lib/design-tokens/colors'

type ThemeMode = 'light' | 'dark' | 'system'
type ProjectColorTheme = ProjectColor
type FontSize = 'small' | 'medium' | 'large'

interface ThemeState {
  // 테마 상태
  mode: ThemeMode
  primaryColor: ProjectColorTheme
  fontSize: FontSize
  reducedMotion: boolean
  highContrast: boolean
  
  // 사용자 설정
  customColors: Record<string, string>
  
  // Actions
  setMode: (mode: ThemeMode) => void
  setPrimaryColor: (color: ProjectColorTheme) => void
  setFontSize: (size: FontSize) => void
  setReducedMotion: (enabled: boolean) => void
  setHighContrast: (enabled: boolean) => void
  updateCustomColor: (key: string, color: string) => void
  
  // 테마 적용
  applyTheme: () => void
  resetToDefaults: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      primaryColor: 'blue',
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,
      customColors: {},
      
      setMode: (mode) => {
        set({ mode })
        get().applyTheme()
      },
      
      setPrimaryColor: (color) => {
        set({ primaryColor: color })
        get().applyTheme()
      },
      
      setFontSize: (fontSize) => {
        set({ fontSize })
        get().applyTheme()
      },
      
      setReducedMotion: (reducedMotion) => {
        set({ reducedMotion })
        get().applyTheme()
      },
      
      setHighContrast: (highContrast) => {
        set({ highContrast })
        get().applyTheme()
      },
      
      updateCustomColor: (key, color) => {
        set((state) => ({
          customColors: { ...state.customColors, [key]: color }
        }))
        get().applyTheme()
      },
      
      applyTheme: () => {
        if (typeof window === 'undefined') return // SSR 대응
        
        const state = get()
        const root = document.documentElement
        
        // 다크/라이트 모드 적용
        if (state.mode === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          root.setAttribute('data-theme', isDark ? 'dark' : 'light')
          root.classList.toggle('dark', isDark)
        } else {
          root.setAttribute('data-theme', state.mode)
          root.classList.toggle('dark', state.mode === 'dark')
        }
        
        // 주 색상 적용
        const primaryColorValue = getProjectColor(state.primaryColor)
        root.style.setProperty('--primary-brand', primaryColorValue)
        
        // 폰트 크기 적용
        const fontSizes = {
          small: '14px',
          medium: '16px',
          large: '18px'
        }
        root.style.setProperty('--base-font-size', fontSizes[state.fontSize])
        document.documentElement.style.fontSize = fontSizes[state.fontSize]
        
        // 모션 설정
        if (state.reducedMotion) {
          root.style.setProperty('--transition-fast', 'none')
          root.style.setProperty('--transition-normal', 'none')
          root.style.setProperty('--transition-slow', 'none')
          root.classList.add('reduce-motion')
        } else {
          root.style.removeProperty('--transition-fast')
          root.style.removeProperty('--transition-normal')
          root.style.removeProperty('--transition-slow')
          root.classList.remove('reduce-motion')
        }
        
        // 고대비 모드
        if (state.highContrast) {
          root.classList.add('high-contrast')
        } else {
          root.classList.remove('high-contrast')
        }
        
        // 커스텀 색상 적용
        Object.entries(state.customColors).forEach(([key, color]) => {
          root.style.setProperty(`--custom-${key}`, color)
        })
      },
      
      resetToDefaults: () => {
        set({
          mode: 'system',
          primaryColor: 'blue',
          fontSize: 'medium',
          reducedMotion: false,
          highContrast: false,
          customColors: {}
        })
        get().applyTheme()
      }
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({
        mode: state.mode,
        primaryColor: state.primaryColor,
        fontSize: state.fontSize,
        reducedMotion: state.reducedMotion,
        highContrast: state.highContrast,
        customColors: state.customColors
      })
    }
  )
)

// 시스템 테마 변경 감지 훅
export const useSystemTheme = () => {
  const { mode, applyTheme } = useThemeStore()
  
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme()
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }
  
  return () => {}
}

// 테마 초기화 함수 (앱 시작 시 실행)
export const initializeTheme = () => {
  const store = useThemeStore.getState()
  
  // 시스템 기본 설정 감지
  if (typeof window !== 'undefined') {
    // 시스템 모션 설정 감지
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !store.reducedMotion) {
      store.setReducedMotion(true)
    }
    
    // 시스템 고대비 설정 감지
    if (window.matchMedia('(prefers-contrast: high)').matches && !store.highContrast) {
      store.setHighContrast(true)
    }
  }
  
  // 초기 테마 적용
  store.applyTheme()
}

// 테마별 CSS 클래스 제공
export const getThemeClasses = () => {
  const { mode, highContrast, reducedMotion } = useThemeStore()
  
  return [
    mode === 'dark' ? 'dark' : 'light',
    highContrast && 'high-contrast',
    reducedMotion && 'reduce-motion'
  ].filter(Boolean).join(' ')
}