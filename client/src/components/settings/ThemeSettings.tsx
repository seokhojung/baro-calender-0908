"use client"

import React, { useState } from 'react'
import { 
  Palette, Sun, Moon, Monitor, Check, Type, 
  Accessibility, Eye, EyeOff, Settings, RotateCcw 
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { PROJECT_COLOR_LIST, type ProjectColor } from '@/lib/design-tokens/colors'
import { Typography } from '@/components/ui/Typography'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const ThemeSettings = () => {
  const { 
    mode, 
    primaryColor, 
    fontSize, 
    reducedMotion, 
    highContrast,
    setMode, 
    setPrimaryColor, 
    setFontSize, 
    setReducedMotion, 
    setHighContrast,
    resetToDefaults
  } = useThemeStore()

  const [previewMode, setPreviewMode] = useState<'live' | 'preview'>('live')

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            테마 설정
          </CardTitle>
          <CardDescription>
            원하는 테마를 선택하여 개인화된 환경을 만들어보세요.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">모양</TabsTrigger>
              <TabsTrigger value="typography">타이포그래피</TabsTrigger>
              <TabsTrigger value="accessibility">접근성</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6 mt-6">
              {/* 다크모드 설정 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="h6">모드 설정</Typography>
                  <Badge variant="outline" className="text-xs">
                    현재: {mode === 'light' ? '라이트' : mode === 'dark' ? '다크' : '시스템'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: '라이트', icon: Sun },
                    { value: 'dark', label: '다크', icon: Moon },
                    { value: 'system', label: '시스템', icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={mode === value ? 'default' : 'outline'}
                      onClick={() => setMode(value as any)}
                      className="flex items-center justify-center gap-2 h-12"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {mode === value && <Check className="w-4 h-4 ml-1" />}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* 주 색상 선택 */}
              <div className="space-y-3">
                <Typography variant="h6">주 색상</Typography>
                <Typography variant="body2" color="muted">
                  프로젝트 구분과 강조 색상으로 사용됩니다.
                </Typography>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PROJECT_COLOR_LIST.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setPrimaryColor(color.name)}
                      className={`
                        relative w-12 h-12 rounded-full border-2 transition-all hover:scale-105
                        ${primaryColor === color.name 
                          ? 'border-ring scale-110 shadow-lg' 
                          : 'border-border hover:border-ring/50'
                        }
                      `}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`${color.label} 색상 선택`}
                      title={color.label}
                    >
                      {primaryColor === color.name && (
                        <Check className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: PROJECT_COLOR_LIST.find(c => c.name === primaryColor)?.hex }}
                  />
                  현재 선택: {PROJECT_COLOR_LIST.find(c => c.name === primaryColor)?.label}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 mt-6">
              {/* 폰트 크기 설정 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  <Typography variant="h6">폰트 크기</Typography>
                </div>
                
                <div className="space-y-3">
                  <Select value={fontSize} onValueChange={(value: any) => setFontSize(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">작게 (14px)</SelectItem>
                      <SelectItem value="medium">보통 (16px)</SelectItem>
                      <SelectItem value="large">크게 (18px)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* 폰트 크기 미리보기 */}
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <Typography variant="h6">미리보기</Typography>
                    <Typography variant="body1">
                      이것은 선택한 폰트 크기로 표시되는 예시 텍스트입니다.
                    </Typography>
                    <Typography variant="body2" color="muted">
                      보조 텍스트도 함께 조정됩니다.
                    </Typography>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* 폰트 패밀리 정보 */}
              <div className="space-y-3">
                <Typography variant="h6">폰트 패밀리</Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Typography variant="body2" weight="medium">Sans-serif (본문)</Typography>
                    <Typography variant="caption" color="muted">
                      Inter, 시스템 기본 폰트
                    </Typography>
                    <div className="mt-2 font-sans text-lg">
                      가나다라마바사 ABCD 1234
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Typography variant="body2" weight="medium">Monospace (코드)</Typography>
                    <Typography variant="caption" color="muted">
                      JetBrains Mono, 고정폭 폰트
                    </Typography>
                    <div className="mt-2 font-mono text-lg">
                      console.log("Hello")
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Accessibility className="w-5 h-5" />
                <Typography variant="h6">접근성</Typography>
              </div>
              
              <div className="space-y-6">
                {/* 애니메이션 줄이기 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <Typography variant="body2" weight="medium">
                      애니메이션 줄이기
                    </Typography>
                    <Typography variant="caption" color="muted">
                      모션 민감성이 있는 경우 애니메이션을 비활성화합니다.
                      시스템 설정을 자동으로 감지합니다.
                    </Typography>
                  </div>
                  <Switch
                    checked={reducedMotion}
                    onCheckedChange={setReducedMotion}
                    aria-label="애니메이션 줄이기"
                  />
                </div>
                
                <Separator />
                
                {/* 고대비 모드 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <Typography variant="body2" weight="medium">
                      고대비 모드
                    </Typography>
                    <Typography variant="caption" color="muted">
                      더 높은 색상 대비로 가독성을 향상시킵니다.
                      WCAG AA 기준을 충족합니다.
                    </Typography>
                  </div>
                  <Switch
                    checked={highContrast}
                    onCheckedChange={setHighContrast}
                    aria-label="고대비 모드"
                  />
                </div>
                
                <Separator />
                
                {/* 접근성 정보 */}
                <div className="space-y-3">
                  <Typography variant="body2" weight="medium">접근성 준수 현황</Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>WCAG AA 색상 대비</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>키보드 네비게이션</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>스크린 리더 지원</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>터치 친화적 크기</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            기본값 복원
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline">
              미리보기
            </Button>
            <Button>
              적용
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 테마 미리보기 카드 */}
      <ThemePreviewCard />
    </div>
  )
}

// 테마 미리보기 카드 컴포넌트
const ThemePreviewCard = () => {
  const { primaryColor } = useThemeStore()
  const selectedColorInfo = PROJECT_COLOR_LIST.find(c => c.name === primaryColor)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          테마 미리보기
        </CardTitle>
        <CardDescription>
          현재 선택한 테마 설정이 적용된 모습을 확인하세요.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 p-6 border-2 border-dashed rounded-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: selectedColorInfo?.hex }}
            />
            <Typography variant="h4" color="primary">
              바로캘린더
            </Typography>
          </div>
          
          <Typography variant="body1">
            선택한 테마로 표시되는 예시입니다. 
            메인 색상과 다크/라이트 모드가 모든 요소에 일관되게 적용됩니다.
          </Typography>
          
          <Typography variant="body2" color="muted">
            이 텍스트는 보조 색상으로 표시되며, 접근성 기준을 충족합니다.
          </Typography>
          
          <div className="flex gap-3 pt-2">
            <Button size="sm" className="shadow-sm">
              기본 버튼
            </Button>
            <Button variant="secondary" size="sm">
              보조 버튼
            </Button>
            <Button variant="outline" size="sm">
              아웃라인 버튼
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Card className="p-3">
              <Typography variant="caption" color="muted">카드 1</Typography>
              <Typography variant="body2">프로젝트 A</Typography>
            </Card>
            <Card className="p-3">
              <Typography variant="caption" color="muted">카드 2</Typography>
              <Typography variant="body2">프로젝트 B</Typography>
            </Card>
            <Card className="p-3">
              <Typography variant="caption" color="muted">카드 3</Typography>
              <Typography variant="body2">프로젝트 C</Typography>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}