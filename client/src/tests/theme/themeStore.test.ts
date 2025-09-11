/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react'
import { useThemeStore, initializeTheme } from '@/stores/themeStore'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock document.documentElement
const mockDocumentElement = {
  setAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
  },
  style: {
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  },
}

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
})

describe('ThemeStore', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset store state
    useThemeStore.getState().resetToDefaults()
  })

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => useThemeStore())
      
      expect(result.current.mode).toBe('system')
      expect(result.current.primaryColor).toBe('blue')
      expect(result.current.fontSize).toBe('medium')
      expect(result.current.reducedMotion).toBe(false)
      expect(result.current.highContrast).toBe(false)
      expect(result.current.customColors).toEqual({})
    })
  })

  describe('Theme Mode', () => {
    it('should set theme mode to light', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setMode('light')
      })
      
      expect(result.current.mode).toBe('light')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith('dark', false)
    })

    it('should set theme mode to dark', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setMode('dark')
      })
      
      expect(result.current.mode).toBe('dark')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('should handle system theme mode with dark preference', () => {
      // Mock system preference for dark mode
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setMode('system')
      })
      
      expect(result.current.mode).toBe('system')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith('dark', true)
    })
  })

  describe('Primary Color', () => {
    it('should set primary color', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setPrimaryColor('green')
      })
      
      expect(result.current.primaryColor).toBe('green')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--primary-brand', 
        '#10B981'
      )
    })

    it('should handle all project colors', () => {
      const { result } = renderHook(() => useThemeStore())
      const colors = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'indigo'] as const
      
      colors.forEach(color => {
        act(() => {
          result.current.setPrimaryColor(color)
        })
        
        expect(result.current.primaryColor).toBe(color)
      })
    })
  })

  describe('Font Size', () => {
    it('should set font size to small', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setFontSize('small')
      })
      
      expect(result.current.fontSize).toBe('small')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--base-font-size', '14px')
    })

    it('should set font size to large', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setFontSize('large')
      })
      
      expect(result.current.fontSize).toBe('large')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--base-font-size', '18px')
    })
  })

  describe('Accessibility Features', () => {
    it('should enable reduced motion', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setReducedMotion(true)
      })
      
      expect(result.current.reducedMotion).toBe(true)
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--transition-fast', 'none')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--transition-normal', 'none')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--transition-slow', 'none')
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('reduce-motion')
    })

    it('should disable reduced motion', () => {
      const { result } = renderHook(() => useThemeStore())
      
      // First enable it
      act(() => {
        result.current.setReducedMotion(true)
      })
      
      // Then disable it
      act(() => {
        result.current.setReducedMotion(false)
      })
      
      expect(result.current.reducedMotion).toBe(false)
      expect(mockDocumentElement.style.removeProperty).toHaveBeenCalledWith('--transition-fast')
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('reduce-motion')
    })

    it('should enable high contrast mode', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setHighContrast(true)
      })
      
      expect(result.current.highContrast).toBe(true)
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('high-contrast')
    })

    it('should disable high contrast mode', () => {
      const { result } = renderHook(() => useThemeStore())
      
      // First enable it
      act(() => {
        result.current.setHighContrast(true)
      })
      
      // Then disable it
      act(() => {
        result.current.setHighContrast(false)
      })
      
      expect(result.current.highContrast).toBe(false)
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('high-contrast')
    })
  })

  describe('Custom Colors', () => {
    it('should update custom colors', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.updateCustomColor('accent', '#FF6B6B')
      })
      
      expect(result.current.customColors).toEqual({ accent: '#FF6B6B' })
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--custom-accent', '#FF6B6B')
    })

    it('should handle multiple custom colors', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.updateCustomColor('accent', '#FF6B6B')
        result.current.updateCustomColor('warning', '#FFE066')
      })
      
      expect(result.current.customColors).toEqual({ 
        accent: '#FF6B6B',
        warning: '#FFE066'
      })
    })
  })

  describe('Reset to Defaults', () => {
    it('should reset all settings to default values', () => {
      const { result } = renderHook(() => useThemeStore())
      
      // Change all settings
      act(() => {
        result.current.setMode('dark')
        result.current.setPrimaryColor('red')
        result.current.setFontSize('large')
        result.current.setReducedMotion(true)
        result.current.setHighContrast(true)
        result.current.updateCustomColor('test', '#123456')
      })
      
      // Reset to defaults
      act(() => {
        result.current.resetToDefaults()
      })
      
      expect(result.current.mode).toBe('system')
      expect(result.current.primaryColor).toBe('blue')
      expect(result.current.fontSize).toBe('medium')
      expect(result.current.reducedMotion).toBe(false)
      expect(result.current.highContrast).toBe(false)
      expect(result.current.customColors).toEqual({})
    })
  })

  describe('Persistence', () => {
    it('should persist theme settings to localStorage', () => {
      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.setMode('dark')
        result.current.setPrimaryColor('green')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'theme-store',
        expect.stringContaining('"mode":"dark"')
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'theme-store',
        expect.stringContaining('"primaryColor":"green"')
      )
    })

    it('should restore settings from localStorage', () => {
      const savedState = {
        mode: 'dark',
        primaryColor: 'purple',
        fontSize: 'large',
        reducedMotion: true,
        highContrast: true,
        customColors: { test: '#123456' }
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState))
      
      const { result } = renderHook(() => useThemeStore())
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.primaryColor).toBe('purple')
      expect(result.current.fontSize).toBe('large')
      expect(result.current.reducedMotion).toBe(true)
      expect(result.current.highContrast).toBe(true)
      expect(result.current.customColors).toEqual({ test: '#123456' })
    })
  })

  describe('Theme Initialization', () => {
    it('should initialize theme with system preferences', () => {
      // Mock system preferences
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion') || query.includes('prefers-contrast'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      initializeTheme()

      const state = useThemeStore.getState()
      expect(state.reducedMotion).toBe(true)
      expect(state.highContrast).toBe(true)
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle server-side rendering', () => {
      // Mock window as undefined (SSR environment)
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useThemeStore())
      
      act(() => {
        result.current.applyTheme()
      })
      
      // Should not throw error
      expect(result.current.mode).toBe('system')

      // Restore window
      global.window = originalWindow
    })
  })
})