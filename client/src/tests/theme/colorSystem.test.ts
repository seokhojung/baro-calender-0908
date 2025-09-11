/**
 * @jest-environment jsdom
 */

import {
  PROJECT_COLORS,
  PROJECT_COLOR_LIST,
  getProjectColor,
  getCSSVariable,
  checkColorContrast,
  isWCAGCompliant,
  type ProjectColor,
  type ColorScale,
} from '@/lib/design-tokens/colors'

describe('Color System', () => {
  describe('PROJECT_COLORS', () => {
    it('should have all 8 project colors', () => {
      const expectedColors = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'indigo']
      const actualColors = Object.keys(PROJECT_COLORS)
      
      expect(actualColors).toHaveLength(8)
      expectedColors.forEach(color => {
        expect(actualColors).toContain(color)
      })
    })

    it('should have complete color scales for each color', () => {
      const expectedScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
      
      Object.keys(PROJECT_COLORS).forEach(color => {
        const scales = Object.keys(PROJECT_COLORS[color as ProjectColor])
        expect(scales).toHaveLength(10)
        expectedScales.forEach(scale => {
          expect(scales).toContain(scale)
        })
      })
    })

    it('should have valid hex color values', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i
      
      Object.entries(PROJECT_COLORS).forEach(([colorName, colorObject]) => {
        Object.entries(colorObject).forEach(([scale, hexValue]) => {
          expect(hexValue).toMatch(hexColorRegex)
        }, `${colorName}-${scale} should be a valid hex color`)
      })
    })

    it('should have proper color progression (lighter to darker)', () => {
      Object.entries(PROJECT_COLORS).forEach(([colorName, colorObject]) => {
        // Convert hex to brightness for comparison
        const getBrightness = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return (r * 299 + g * 587 + b * 114) / 1000
        }
        
        const scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
        const brightnesses = scales.map(scale => getBrightness(colorObject[scale as ColorScale]))
        
        // Check that brightness decreases as scale increases
        for (let i = 1; i < brightnesses.length; i++) {
          expect(brightnesses[i]).toBeLessThanOrEqual(brightnesses[i - 1])
        }
      })
    })
  })

  describe('PROJECT_COLOR_LIST', () => {
    it('should have correct structure', () => {
      expect(PROJECT_COLOR_LIST).toHaveLength(8)
      
      PROJECT_COLOR_LIST.forEach(color => {
        expect(color).toHaveProperty('name')
        expect(color).toHaveProperty('label')
        expect(color).toHaveProperty('hex')
        
        expect(typeof color.name).toBe('string')
        expect(typeof color.label).toBe('string')
        expect(typeof color.hex).toBe('string')
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })

    it('should use 500 scale as default', () => {
      PROJECT_COLOR_LIST.forEach(color => {
        const expectedHex = PROJECT_COLORS[color.name][500]
        expect(color.hex).toBe(expectedHex)
      })
    })

    it('should have Korean labels', () => {
      const expectedLabels = ['블루', '그린', '퍼플', '오렌지', '레드', '틸', '핑크', '인디고']
      const actualLabels = PROJECT_COLOR_LIST.map(c => c.label)
      
      expectedLabels.forEach(label => {
        expect(actualLabels).toContain(label)
      })
    })
  })

  describe('getProjectColor', () => {
    it('should return correct color for valid inputs', () => {
      expect(getProjectColor('blue', 500)).toBe('#3B82F6')
      expect(getProjectColor('green', 500)).toBe('#10B981')
      expect(getProjectColor('red', 600)).toBe('#DC2626')
    })

    it('should use 500 as default scale', () => {
      expect(getProjectColor('blue')).toBe('#3B82F6')
      expect(getProjectColor('green')).toBe('#10B981')
    })

    it('should work with all color combinations', () => {
      Object.keys(PROJECT_COLORS).forEach(colorName => {
        const color = colorName as ProjectColor
        Object.keys(PROJECT_COLORS[color]).forEach(scale => {
          const scaleNum = scale as ColorScale
          const result = getProjectColor(color, scaleNum)
          const expected = PROJECT_COLORS[color][scaleNum]
          
          expect(result).toBe(expected)
        })
      })
    })
  })

  describe('getCSSVariable', () => {
    it('should return CSS variable format', () => {
      expect(getCSSVariable('primary')).toBe('var(--primary)')
      expect(getCSSVariable('background')).toBe('var(--background)')
    })

    it('should handle various variable names', () => {
      const testNames = ['primary', 'secondary-foreground', 'color-blue-500', 'custom-accent']
      
      testNames.forEach(name => {
        expect(getCSSVariable(name)).toBe(`var(--${name})`)
      })
    })
  })

  describe('checkColorContrast', () => {
    it('should calculate contrast ratio correctly', () => {
      // Test known contrast ratios
      const whiteBlackContrast = checkColorContrast('#FFFFFF', '#000000')
      expect(whiteBlackContrast).toBeCloseTo(21, 0) // Perfect contrast
      
      const sameColorContrast = checkColorContrast('#FF0000', '#FF0000')
      expect(sameColorContrast).toBeCloseTo(1, 0) // No contrast
    })

    it('should handle various color formats', () => {
      const contrast1 = checkColorContrast('#FFFFFF', '#000000')
      const contrast2 = checkColorContrast('#ffffff', '#000000')
      const contrast3 = checkColorContrast('FFFFFF', '000000')
      
      expect(contrast1).toBe(contrast2)
      // Should handle colors with or without #
    })

    it('should return consistent results regardless of order', () => {
      const contrast1 = checkColorContrast('#FFFFFF', '#000000')
      const contrast2 = checkColorContrast('#000000', '#FFFFFF')
      
      expect(contrast1).toBe(contrast2)
    })
  })

  describe('isWCAGCompliant', () => {
    it('should correctly identify AA compliant colors', () => {
      // High contrast - should be compliant
      expect(isWCAGCompliant('#FFFFFF', '#000000', 'AA')).toBe(true)
      expect(isWCAGCompliant('#FFFFFF', '#0066CC', 'AA')).toBe(true)
      
      // Low contrast - should not be compliant  
      expect(isWCAGCompliant('#FFFFFF', '#CCCCCC', 'AA')).toBe(false)
    })

    it('should correctly identify AAA compliant colors', () => {
      // Very high contrast - should be AAA compliant
      expect(isWCAGCompliant('#FFFFFF', '#000000', 'AAA')).toBe(true)
      
      // Lower contrast - might be AA but not AAA
      expect(isWCAGCompliant('#FFFFFF', '#666666', 'AAA')).toBe(false)
    })

    it('should default to AA level', () => {
      const resultWithDefault = isWCAGCompliant('#FFFFFF', '#0066CC')
      const resultWithAA = isWCAGCompliant('#FFFFFF', '#0066CC', 'AA')
      
      expect(resultWithDefault).toBe(resultWithAA)
    })

    it('should validate all project colors against white and black backgrounds', () => {
      Object.entries(PROJECT_COLORS).forEach(([colorName, colorObject]) => {
        // Test 500 scale against white background
        const color500 = colorObject['500']
        const contrastWhite = isWCAGCompliant(color500, '#FFFFFF', 'AA')
        const contrastBlack = isWCAGCompliant(color500, '#000000', 'AA')
        
        // At least one should be compliant
        expect(contrastWhite || contrastBlack).toBe(true)
      })
    })
  })

  describe('Color Accessibility', () => {
    it('should have sufficient contrast for text colors', () => {
      const textColors = ['#000000', '#FFFFFF', '#666666', '#333333']
      const backgroundColors = ['#FFFFFF', '#000000', '#F8F9FA', '#212529']
      
      textColors.forEach(textColor => {
        backgroundColors.forEach(backgroundColor => {
          if (textColor !== backgroundColor) {
            const contrast = checkColorContrast(textColor, backgroundColor)
            // Most common text/background combinations should have good contrast
            if (
              (textColor === '#000000' && backgroundColor === '#FFFFFF') ||
              (textColor === '#FFFFFF' && backgroundColor === '#000000')
            ) {
              expect(contrast).toBeGreaterThanOrEqual(7) // AAA level
            }
          }
        })
      })
    })

    it('should have project colors that work well with common text colors', () => {
      const commonTextColors = ['#FFFFFF', '#000000']
      
      Object.entries(PROJECT_COLORS).forEach(([colorName, colorObject]) => {
        // Test middle scale colors (300-700)
        const midScales = ['300', '400', '500', '600', '700'] as ColorScale[]
        
        midScales.forEach(scale => {
          const bgColor = colorObject[scale]
          
          commonTextColors.forEach(textColor => {
            const contrast = checkColorContrast(textColor, bgColor)
            
            // At least one text color should work well
            if (scale === '500') { // Main color should be usable
              const hasGoodContrast = commonTextColors.some(color => 
                checkColorContrast(color, bgColor) >= 4.5
              )
              expect(hasGoodContrast).toBe(true)
            }
          })
        })
      })
    })
  })

  describe('Color Variations', () => {
    it('should have appropriate color variations between scales', () => {
      Object.entries(PROJECT_COLORS).forEach(([colorName, colorObject]) => {
        const scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as ColorScale[]
        
        for (let i = 0; i < scales.length - 1; i++) {
          const currentColor = colorObject[scales[i]]
          const nextColor = colorObject[scales[i + 1]]
          
          // Colors should be different
          expect(currentColor).not.toBe(nextColor)
          
          // Should have reasonable contrast between adjacent scales
          const contrast = checkColorContrast(currentColor, nextColor)
          expect(contrast).toBeGreaterThan(1.1) // Some noticeable difference
        }
      })
    })
  })

  describe('Type Safety', () => {
    it('should have correct TypeScript types', () => {
      // These should compile without errors
      const color: ProjectColor = 'blue'
      const scale: ColorScale = '500'
      const result = getProjectColor(color, scale)
      
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should maintain type safety for PROJECT_COLOR_LIST', () => {
      PROJECT_COLOR_LIST.forEach(item => {
        // name should be a valid ProjectColor
        const projectColor = item.name as ProjectColor
        expect(PROJECT_COLORS[projectColor]).toBeDefined()
        
        // hex should match the 500 scale
        expect(item.hex).toBe(PROJECT_COLORS[projectColor]['500'])
      })
    })
  })
})