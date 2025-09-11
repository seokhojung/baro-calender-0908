"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Shield, 
  Smartphone, 
  Key, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Download,
  Loader2 
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { toast } from "sonner"

import { useAuthStore } from '@/stores/authStore'
import { SecurityAuditLogger } from '@/lib/security/auditLogger'
import { secureFetch } from '@/lib/auth/securityMiddleware'

type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete'

interface TwoFactorSetupData {
  qrCode: string
  secret: string
  backupCodes: string[]
}

const verificationSchema = z.object({
  verificationCode: z.string().min(6, '6자리 코드를 입력해주세요').max(6, '6자리 코드를 입력해주세요')
})

export const TwoFactorSetup: React.FC = () => {
  const { user } = useAuthStore()
  const [step, setStep] = useState<SetupStep>('intro')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null)
  
  const form = useForm<{ verificationCode: string }>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationCode: ''
    }
  })
  
  const handleSetupStart = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await secureFetch('/api/auth/2fa/setup', {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '2FA 설정을 시작할 수 없습니다')
      }
      
      const data = await response.json()
      setSetupData(data)
      setStep('scan')
      
      // Log 2FA setup started
      SecurityAuditLogger.logSecurityEvent({
        type: '2fa_setup',
        userId: user.id,
        userEmail: user.email,
        severity: 'low',
        details: {
          action: 'setup_started',
          step: 'qr_code_generated'
        }
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleVerification = async (data: { verificationCode: string }) => {
    if (!user || !setupData) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await secureFetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        body: JSON.stringify({ 
          code: data.verificationCode 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '인증 코드가 올바르지 않습니다')
      }
      
      const result = await response.json()
      
      setSetupData({
        ...setupData,
        backupCodes: result.backupCodes
      })
      
      setStep('backup')
      
      // Log successful 2FA verification
      SecurityAuditLogger.log2FASetup(user.id, true)
      
      toast.success('2단계 인증이 성공적으로 설정되었습니다')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '인증에 실패했습니다'
      setError(errorMessage)
      form.setError('verificationCode', { 
        message: errorMessage 
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleBackupCodesCopy = () => {
    if (!setupData?.backupCodes) return
    
    const text = setupData.backupCodes.join('\n')
    navigator.clipboard.writeText(text)
    toast.success('백업 코드가 복사되었습니다')
    
    if (user) {
      SecurityAuditLogger.logSecurityEvent({
        type: '2fa_setup',
        userId: user.id,
        severity: 'low',
        details: {
          action: 'backup_codes_copied'
        }
      })
    }
  }
  
  const handleBackupCodesDownload = () => {
    if (!setupData?.backupCodes) return
    
    const text = setupData.backupCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'baro-calendar-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('백업 코드가 다운로드되었습니다')
    
    if (user) {
      SecurityAuditLogger.logSecurityEvent({
        type: '2fa_setup',
        userId: user.id,
        severity: 'low',
        details: {
          action: 'backup_codes_downloaded'
        }
      })
    }
  }
  
  const handleSetupComplete = () => {
    setStep('complete')
    
    if (user) {
      SecurityAuditLogger.logSecurityEvent({
        type: '2fa_setup',
        userId: user.id,
        severity: 'low',
        details: {
          action: 'setup_completed',
          enabled: true
        }
      })
    }
  }
  
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="space-y-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">계정 보안 강화</h3>
              <p className="text-sm text-muted-foreground">
                2단계 인증으로 계정을 더욱 안전하게 보호하세요
              </p>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">인증 앱 설치</h4>
                  <p className="text-xs text-muted-foreground">
                    Google Authenticator, Authy, 1Password 등의 TOTP 앱이 필요합니다
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">백업 코드 제공</h4>
                  <p className="text-xs text-muted-foreground">
                    휴대폰을 분실한 경우를 대비한 복구 코드를 제공합니다
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg text-left">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-800">설정 전 확인사항</p>
                  <p className="text-xs text-yellow-700">
                    인증 앱이 설치되어 있고, 백업 코드를 안전한 곳에 저장할 준비가 되었는지 확인하세요.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSetupStart} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  설정 준비 중...
                </>
              ) : (
                '설정 시작하기'
              )}
            </Button>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )
      
      case 'scan':
        if (!setupData) return null
        
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">QR 코드 스캔</h3>
              <p className="text-sm text-muted-foreground mb-4">
                인증 앱으로 아래 QR 코드를 스캔하세요
              </p>
              
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                <QRCodeSVG 
                  value={setupData.qrCode} 
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
            
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground w-full hover:text-foreground transition-colors">
                <Key className="w-4 h-4" />
                수동으로 키 입력하기
                <ChevronRight className="w-4 h-4 ml-auto" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                  {setupData.secret}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret)
                    toast.success('보안 키가 복사되었습니다')
                  }}
                  className="mt-2"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  복사
                </Button>
              </CollapsibleContent>
            </Collapsible>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('intro')}
                className="flex-1"
              >
                이전
              </Button>
              <Button 
                onClick={() => setStep('verify')} 
                className="flex-1"
              >
                다음 단계
              </Button>
            </div>
          </div>
        )
      
      case 'verify':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleVerification)} className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">인증 코드 확인</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  앱에서 생성된 6자리 코드를 입력하세요
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="verificationCode"
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
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setStep('scan')}
                  className="flex-1"
                >
                  이전
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      인증 중...
                    </>
                  ) : (
                    '인증 확인'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )
      
      case 'backup':
        if (!setupData?.backupCodes) return null
        
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">백업 코드 저장</h3>
              <p className="text-sm text-muted-foreground mb-4">
                이 코드들을 안전한 곳에 보관하세요. 휴대폰을 분실했을 때 사용할 수 있습니다.
              </p>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>중요</AlertTitle>
              <AlertDescription>
                각 백업 코드는 한 번만 사용할 수 있습니다. 안전한 곳에 보관하세요.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBackupCodesCopy}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                복사
              </Button>
              
              <Button
                variant="outline"
                onClick={handleBackupCodesDownload}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
            
            <Button onClick={handleSetupComplete} className="w-full">
              설정 완료
            </Button>
          </div>
        )
      
      case 'complete':
        return (
          <div className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800 mb-2">설정 완료!</h3>
              <p className="text-sm text-green-700">
                2단계 인증이 성공적으로 활성화되었습니다
              </p>
            </div>
            
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p>• 다음 로그인부터 인증 코드가 요구됩니다</p>
              <p>• 백업 코드는 안전한 곳에 보관해주세요</p>
              <p>• 언제든지 설정에서 비활성화할 수 있습니다</p>
            </div>
            
            <Button onClick={() => window.location.reload()} className="w-full">
              완료
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          2단계 인증 설정
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  )
}

export default TwoFactorSetup