"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Calendar, Github, Loader2, AlertCircle, Shield } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials } from '@/stores/authStore'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  rememberMe: z.boolean().default(false)
})

const twoFactorSchema = z.object({
  code: z.string().min(6, '6자리 코드를 입력해주세요').max(6, '6자리 코드를 입력해주세요')
})

export const LoginForm: React.FC = () => {
  const { 
    login, 
    loginWithProvider, 
    verifyTwoFactor, 
    isLoading, 
    error, 
    requiresTwoFactor, 
    twoFactorToken 
  } = useAuthStore()
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'social'>('email')
  const [showPassword, setShowPassword] = useState(false)
  
  const emailForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })
  
  const twoFactorForm = useForm<{ code: string }>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: ''
    }
  })
  
  const handleEmailLogin = async (data: LoginCredentials) => {
    await login(data)
  }
  
  const handleTwoFactorVerify = async (data: { code: string }) => {
    if (!twoFactorToken) return
    await verifyTwoFactor(twoFactorToken, data.code)
  }
  
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    await loginWithProvider(provider)
  }
  
  // 2FA 필요한 경우 표시할 컴포넌트
  if (requiresTwoFactor) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <CardTitle>2단계 인증</CardTitle>
          <CardDescription>
            인증 앱에 표시된 6자리 코드를 입력해주세요
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...twoFactorForm}>
            <form onSubmit={twoFactorForm.handleSubmit(handleTwoFactorVerify)} className="space-y-4">
              <FormField
                control={twoFactorForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, index) => (
                              <InputOTPSlot key={index} index={index} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    인증 중...
                  </>
                ) : (
                  '인증 확인'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  // Reset 2FA state and go back to login
                  useAuthStore.setState({
                    requiresTwoFactor: false,
                    twoFactorToken: null,
                    error: null
                  })
                }}
              >
                다시 로그인하기
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }
  
  // 기본 로그인 폼
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Calendar className="w-12 h-12 text-primary" />
        </div>
        <CardTitle>바로캘린더에 로그인</CardTitle>
        <CardDescription>
          계정에 로그인하여 일정을 관리하세요
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 로그인 방식 선택 탭 */}
        <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'social')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">이메일</TabsTrigger>
            <TabsTrigger value="social">소셜 로그인</TabsTrigger>
          </TabsList>
          
          {/* 이메일 로그인 탭 */}
          <TabsContent value="email" className="space-y-4">
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          autoComplete="email"
                          className="text-base" // 모바일 줌 방지
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="비밀번호를 입력하세요"
                            autoComplete="current-password"
                            className="text-base pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={emailForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          로그인 상태 유지
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Button variant="link" size="sm" asChild>
                    <Link href="/forgot-password">비밀번호 찾기</Link>
                  </Button>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      로그인 중...
                    </>
                  ) : (
                    '로그인'
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* 소셜 로그인 탭 */}
          <TabsContent value="social" className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub으로 로그인
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        {/* 회원가입 링크 */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">계정이 없으신가요? </span>
          <Button variant="link" size="sm" asChild className="p-0">
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default LoginForm