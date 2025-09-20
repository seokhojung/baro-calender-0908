/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { 
  Typography, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4, 
  Heading5, 
  Heading6,
  Body1, 
  Body2, 
  Caption, 
  Overline,
  TypographyShowcase
} from '@/components/ui/Typography'

describe('Typography Component', () => {
  describe('Basic Rendering', () => {
    it('should render with correct variant styles', () => {
      render(<Typography variant="h1">Test Heading</Typography>)
      
      const heading = screen.getByText('Test Heading')
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
      expect(heading).toHaveClass('text-4xl', 'font-bold', 'leading-tight', 'tracking-tight')
    })

    it('should render all variant styles correctly', () => {
      const variants = [
        { variant: 'h1', expectedTag: 'H1', expectedClasses: ['text-4xl', 'font-bold'] },
        { variant: 'h2', expectedTag: 'H2', expectedClasses: ['text-3xl', 'font-semibold'] },
        { variant: 'h3', expectedTag: 'H3', expectedClasses: ['text-2xl', 'font-semibold'] },
        { variant: 'h4', expectedTag: 'H4', expectedClasses: ['text-xl', 'font-medium'] },
        { variant: 'h5', expectedTag: 'H5', expectedClasses: ['text-lg', 'font-medium'] },
        { variant: 'h6', expectedTag: 'H6', expectedClasses: ['text-base', 'font-medium'] },
        { variant: 'body1', expectedTag: 'P', expectedClasses: ['text-base', 'leading-relaxed'] },
        { variant: 'body2', expectedTag: 'P', expectedClasses: ['text-sm', 'leading-relaxed'] },
        { variant: 'caption', expectedTag: 'P', expectedClasses: ['text-xs', 'text-muted-foreground'] },
        { variant: 'overline', expectedTag: 'SPAN', expectedClasses: ['text-xs', 'uppercase'] }
      ] as const

      variants.forEach(({ variant, expectedTag, expectedClasses }) => {
        render(<Typography variant={variant}>{variant} text</Typography>)
        
        const element = screen.getByText(`${variant} text`)
        expect(element.tagName).toBe(expectedTag)
        expectedClasses.forEach(className => {
          expect(element).toHaveClass(className)
        })
      })
    })
  })

  describe('Color Variants', () => {
    it('should apply correct color classes', () => {
      const colors = [
        { color: 'default', expectedClass: 'text-foreground' },
        { color: 'muted', expectedClass: 'text-muted-foreground' },
        { color: 'primary', expectedClass: 'text-primary' },
        { color: 'secondary', expectedClass: 'text-secondary-foreground' },
        { color: 'destructive', expectedClass: 'text-destructive' }
      ] as const

      colors.forEach(({ color, expectedClass }) => {
        render(<Typography variant="body1" color={color}>{color} text</Typography>)
        
        const element = screen.getByText(`${color} text`)
        expect(element).toHaveClass(expectedClass)
      })
    })
  })

  describe('Weight Variants', () => {
    it('should apply correct weight classes', () => {
      const weights = [
        { weight: 'normal', expectedClass: 'font-normal' },
        { weight: 'medium', expectedClass: 'font-medium' },
        { weight: 'semibold', expectedClass: 'font-semibold' },
        { weight: 'bold', expectedClass: 'font-bold' }
      ] as const

      weights.forEach(({ weight, expectedClass }) => {
        render(<Typography variant="body1" weight={weight}>{weight} text</Typography>)
        
        const element = screen.getByText(`${weight} text`)
        expect(element).toHaveClass(expectedClass)
      })
    })
  })

  describe('Alignment Variants', () => {
    it('should apply correct alignment classes', () => {
      const alignments = [
        { align: 'left', expectedClass: 'text-left' },
        { align: 'center', expectedClass: 'text-center' },
        { align: 'right', expectedClass: 'text-right' },
        { align: 'justify', expectedClass: 'text-justify' }
      ] as const

      alignments.forEach(({ align, expectedClass }) => {
        render(<Typography variant="body1" align={align}>{align} text</Typography>)
        
        const element = screen.getByText(`${align} text`)
        expect(element).toHaveClass(expectedClass)
      })
    })
  })

  describe('Custom Element', () => {
    it('should render as custom element when "as" prop is provided', () => {
      render(<Typography variant="h1" as="div">Custom Element</Typography>)
      
      const element = screen.getByText('Custom Element')
      expect(element.tagName).toBe('DIV')
      expect(element).toHaveClass('text-4xl', 'font-bold')
    })

    it('should handle various HTML elements', () => {
      const elements = ['div', 'span', 'section', 'article'] as const

      elements.forEach(tagName => {
        render(
          <Typography variant="body1" as={tagName}>
            {tagName} element
          </Typography>
        )
        
        const element = screen.getByText(`${tagName} element`)
        expect(element.tagName).toBe(tagName.toUpperCase())
      })
    })
  })

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(
        <Typography variant="body1" className="custom-class">
          Custom Class Text
        </Typography>
      )
      
      const element = screen.getByText('Custom Class Text')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('text-base') // Original classes should remain
    })

    it('should merge custom classes with existing ones', () => {
      render(
        <Typography 
          variant="h1" 
          color="primary" 
          weight="bold" 
          className="mb-4 custom"
        >
          Combined Classes
        </Typography>
      )
      
      const element = screen.getByText('Combined Classes')
      expect(element).toHaveClass('text-4xl') // variant
      expect(element).toHaveClass('text-primary') // color
      expect(element).toHaveClass('font-bold') // weight
      expect(element).toHaveClass('mb-4') // custom
      expect(element).toHaveClass('custom') // custom
    })
  })

  describe('Predefined Components', () => {
    it('should render Heading components correctly', () => {
      const headings = [
        { Component: Heading1, expectedTag: 'H1' },
        { Component: Heading2, expectedTag: 'H2' },
        { Component: Heading3, expectedTag: 'H3' },
        { Component: Heading4, expectedTag: 'H4' },
        { Component: Heading5, expectedTag: 'H5' },
        { Component: Heading6, expectedTag: 'H6' }
      ]

      headings.forEach(({ Component, expectedTag }) => {
        render(<Component>Heading Text</Component>)
        
        const element = screen.getByText('Heading Text')
        expect(element.tagName).toBe(expectedTag)
      })
    })

    it('should render Body components correctly', () => {
      render(<Body1>Body1 Text</Body1>)
      render(<Body2>Body2 Text</Body2>)
      
      const body1 = screen.getByText('Body1 Text')
      const body2 = screen.getByText('Body2 Text')
      
      expect(body1.tagName).toBe('P')
      expect(body2.tagName).toBe('P')
      expect(body1).toHaveClass('text-base')
      expect(body2).toHaveClass('text-sm')
    })

    it('should render Caption and Overline correctly', () => {
      render(<Caption>Caption Text</Caption>)
      render(<Overline>Overline Text</Overline>)
      
      const caption = screen.getByText('Caption Text')
      const overline = screen.getByText('Overline Text')
      
      expect(caption.tagName).toBe('P')
      expect(overline.tagName).toBe('SPAN')
      expect(caption).toHaveClass('text-xs', 'text-muted-foreground')
      expect(overline).toHaveClass('text-xs', 'uppercase')
    })

    it('should pass props to predefined components', () => {
      render(<Heading1 color="primary" weight="bold">Styled Heading</Heading1>)
      
      const element = screen.getByText('Styled Heading')
      expect(element).toHaveClass('text-primary', 'font-bold')
    })
  })

  describe('Typography Showcase', () => {
    it('should render showcase without errors', () => {
      render(<TypographyShowcase />)
      
      // Check for key elements
      expect(screen.getByText('바로캘린더')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 기반 일정 관리 시스템')).toBeInTheDocument()
      expect(screen.getByText('일반 굵기 텍스트')).toBeInTheDocument()
      expect(screen.getByText('기본 색상 텍스트')).toBeInTheDocument()
    })

    it('should showcase all typography variants', () => {
      render(<TypographyShowcase />)
      
      const expectedTexts = [
        '바로캘린더', // h1
        '프로젝트 기반 일정 관리 시스템', // h2
        '섹션 제목 예시', // h3
        '하위 섹션 제목', // h4
        '소제목', // h5
        '작은 제목', // h6
      ]

      expectedTexts.forEach(text => {
        expect(screen.getByText(text)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should maintain semantic HTML structure', () => {
      render(
        <div>
          <Typography variant="h1">Main Title</Typography>
          <Typography variant="h2">Subtitle</Typography>
          <Typography variant="body1">Paragraph text</Typography>
        </div>
      )
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })
      
      expect(h1).toHaveTextContent('Main Title')
      expect(h2).toHaveTextContent('Subtitle')
    })

    it('should support screen readers with proper text content', () => {
      render(
        <Typography variant="caption" color="muted">
          This is important information for screen readers
        </Typography>
      )
      
      const element = screen.getByText('This is important information for screen readers')
      expect(element).toBeInTheDocument()
      expect(element).toHaveAttribute('class')
    })
  })

  describe('Default Props', () => {
    it('should use default color when not specified', () => {
      render(<Typography variant="body1">Default Color</Typography>)
      
      const element = screen.getByText('Default Color')
      expect(element).toHaveClass('text-foreground')
    })

    it('should use default align when not specified', () => {
      render(<Typography variant="body1">Default Align</Typography>)
      
      const element = screen.getByText('Default Align')
      expect(element).toHaveClass('text-left')
    })

    it('should not apply weight class when not specified', () => {
      render(<Typography variant="body1">No Weight</Typography>)
      
      const element = screen.getByText('No Weight')
      expect(element).not.toHaveClass('font-normal')
      expect(element).not.toHaveClass('font-medium')
      expect(element).not.toHaveClass('font-semibold')
      expect(element).not.toHaveClass('font-bold')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Typography variant="body1" children="" />)
      
      const element = screen.getByText('', { exact: false })
      expect(element).toBeInTheDocument()
    })

    it('should handle complex children', () => {
      render(
        <Typography variant="h1">
          <span>Complex </span>
          <strong>children</strong>
          <em> content</em>
        </Typography>
      )
      
      const element = screen.getByText(/Complex.*children.*content/)
      expect(element).toBeInTheDocument()
      expect(element.querySelector('span')).toBeInTheDocument()
      expect(element.querySelector('strong')).toBeInTheDocument()
      expect(element.querySelector('em')).toBeInTheDocument()
    })
  })
})