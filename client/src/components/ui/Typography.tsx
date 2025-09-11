import React from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline'
  children: React.ReactNode
  className?: string
  as?: React.ElementType
  color?: 'default' | 'muted' | 'primary' | 'secondary' | 'destructive'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right' | 'justify'
}

const typographyVariants = {
  h1: 'text-4xl font-bold leading-tight tracking-tight',
  h2: 'text-3xl font-semibold leading-tight tracking-tight',
  h3: 'text-2xl font-semibold leading-snug',
  h4: 'text-xl font-medium leading-snug',
  h5: 'text-lg font-medium leading-normal',
  h6: 'text-base font-medium leading-normal',
  body1: 'text-base leading-relaxed',
  body2: 'text-sm leading-relaxed',
  caption: 'text-xs leading-normal text-muted-foreground',
  overline: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',
} as const

const colorVariants = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  destructive: 'text-destructive',
} as const

const weightVariants = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const

const alignVariants = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
} as const

const getDefaultElement = (variant: TypographyProps['variant']): React.ElementType => {
  switch (variant) {
    case 'h1': return 'h1'
    case 'h2': return 'h2'
    case 'h3': return 'h3'
    case 'h4': return 'h4'
    case 'h5': return 'h5'
    case 'h6': return 'h6'
    case 'overline': return 'span'
    default: return 'p'
  }
}

export const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  className,
  as,
  color = 'default',
  weight,
  align = 'left',
}) => {
  const Component = as || getDefaultElement(variant)
  
  return (
    <Component 
      className={cn(
        typographyVariants[variant],
        colorVariants[color],
        weight && weightVariants[weight],
        alignVariants[align],
        className
      )}
    >
      {children}
    </Component>
  )
}

// 사전 정의된 타이포그래피 컴포넌트들
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
)

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
)

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
)

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
)

export const Heading5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h5" {...props} />
)

export const Heading6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h6" {...props} />
)

export const Body1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
)

export const Body2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body2" {...props} />
)

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
)

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" {...props} />
)

// 사용 예시 컴포넌트 (개발/테스트용)
export const TypographyShowcase = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-4">
      <Typography variant="h1" color="primary">
        바로캘린더
      </Typography>
      <Typography variant="h2">
        프로젝트 기반 일정 관리 시스템
      </Typography>
      <Typography variant="h3">
        섹션 제목 예시
      </Typography>
      <Typography variant="h4">
        하위 섹션 제목
      </Typography>
      <Typography variant="h5">
        소제목
      </Typography>
      <Typography variant="h6">
        작은 제목
      </Typography>
    </div>

    <div className="space-y-2">
      <Typography variant="body1">
        본문 텍스트입니다. 이것은 일반적인 본문에 사용되는 기본 스타일입니다.
        가독성을 위해 적절한 행간과 글자 크기가 적용되어 있습니다.
      </Typography>
      <Typography variant="body2" color="muted">
        보조 본문 텍스트입니다. 메인 본문보다 작은 크기로 부가 정보를 표시할 때 사용합니다.
      </Typography>
      <Typography variant="caption">
        캡션 텍스트 - 이미지나 표의 설명에 사용
      </Typography>
      <Typography variant="overline">
        오버라인 텍스트 - 섹션 구분이나 카테고리 표시
      </Typography>
    </div>

    <div className="space-y-2">
      <Typography variant="body1" weight="normal">
        일반 굵기 텍스트
      </Typography>
      <Typography variant="body1" weight="medium">
        중간 굵기 텍스트
      </Typography>
      <Typography variant="body1" weight="semibold">
        세미볼드 텍스트
      </Typography>
      <Typography variant="body1" weight="bold">
        굵은 텍스트
      </Typography>
    </div>

    <div className="space-y-2">
      <Typography variant="body1" align="left">
        왼쪽 정렬 텍스트
      </Typography>
      <Typography variant="body1" align="center">
        가운데 정렬 텍스트
      </Typography>
      <Typography variant="body1" align="right">
        오른쪽 정렬 텍스트
      </Typography>
      <Typography variant="body1" align="justify">
        양쪽 정렬 텍스트 - 이 텍스트는 양쪽 끝에 맞춰 정렬되어 깔끔한 레이아웃을 제공합니다.
      </Typography>
    </div>

    <div className="space-y-2">
      <Typography variant="body1" color="default">
        기본 색상 텍스트
      </Typography>
      <Typography variant="body1" color="muted">
        흐린 색상 텍스트
      </Typography>
      <Typography variant="body1" color="primary">
        주요 색상 텍스트
      </Typography>
      <Typography variant="body1" color="secondary">
        보조 색상 텍스트
      </Typography>
      <Typography variant="body1" color="destructive">
        경고 색상 텍스트
      </Typography>
    </div>
  </div>
)