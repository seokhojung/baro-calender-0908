"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addHours, parseISO } from 'date-fns'
import { debounce } from 'lodash'
import { ChevronRight, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { DateTimePicker } from '@/components/ui/date-time-picker'

import { 
  CreateScheduleInput, 
  ScheduleCreateFormProps,
  ConflictCheckResult,
  PROJECT_COLORS,
  Project
} from '@/types/schedule'
import { useScheduleStore } from '@/stores/scheduleStore'

// Form validation schema
const createScheduleSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하여야 합니다'),
  description: z.string().optional(),
  startDateTime: z.string().min(1, '시작 시간을 선택해주세요'),
  endDateTime: z.string().min(1, '종료 시간을 선택해주세요'),
  isAllDay: z.boolean(),
  timezone: z.string().optional(),
  projectId: z.string().min(1, '프로젝트를 선택해주세요'),
  location: z.string().optional(),
  url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['organizer', 'required', 'optional']),
    status: z.enum(['pending', 'accepted', 'declined', 'tentative']).optional(),
    responseAt: z.string().optional()
  })),
  recurrenceRule: z.any().optional(),
  isPrivate: z.boolean()
}).refine(
  (data) => {
    const start = new Date(data.startDateTime)
    const end = new Date(data.endDateTime)
    return start < end
  },
  {
    message: "종료 시간은 시작 시간보다 늦어야 합니다",
    path: ["endDateTime"]
  }
)

type FormData = z.infer<typeof createScheduleSchema>

// Mock projects data - this would come from a store or API
const mockProjects: Project[] = [
  { id: '1', name: '웹 개발 프로젝트', color: 'blue' },
  { id: '2', name: '마케팅 캠페인', color: 'green' },
  { id: '3', name: '디자인 시스템', color: 'purple' },
  { id: '4', name: '제품 출시', color: 'red' },
]

export const ScheduleCreateForm: React.FC<ScheduleCreateFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { checkConflicts } = useScheduleStore()
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult>()
  const [showConflictDetails, setShowConflictDetails] = useState(false)
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startDateTime: initialData?.startDateTime || new Date().toISOString(),
      endDateTime: initialData?.endDateTime || addHours(new Date(), 1).toISOString(),
      isAllDay: initialData?.isAllDay || false,
      timezone: initialData?.timezone || 'Asia/Seoul',
      projectId: initialData?.projectId || '',
      location: initialData?.location || '',
      url: initialData?.url || '',
      attendees: initialData?.attendees || [],
      recurrenceRule: initialData?.recurrenceRule || undefined,
      isPrivate: initialData?.isPrivate || false,
    }
  })

  // Real-time conflict checking
  const debouncedConflictCheck = useCallback(
    debounce(async (formData: Partial<FormData>) => {
      if (formData.startDateTime && formData.endDateTime && formData.attendees) {
        setIsCheckingConflicts(true)
        try {
          // Convert FormData attendees to CreateScheduleInput format
          const attendeesForConflictCheck = formData.attendees.map(({ email, name, role, status, responseAt }) => ({
            email,
            name,
            role,
            ...(status && { status }),
            ...(responseAt && { responseAt })
          }))

          const result = await checkConflicts({
            startDateTime: formData.startDateTime,
            endDateTime: formData.endDateTime,
            attendees: attendeesForConflictCheck
          } as any)
          setConflictResult(result)
        } catch (error) {
          console.error('Conflict check failed:', error)
        } finally {
          setIsCheckingConflicts(false)
        }
      }
    }, 500),
    [checkConflicts]
  )

  useEffect(() => {
    const subscription = form.watch((formData) => {
      debouncedConflictCheck(formData as Partial<FormData>)
    })
    return () => subscription.unsubscribe()
  }, [form, debouncedConflictCheck])

  const handleFormSubmit = (data: FormData) => {
    // Convert FormData to CreateScheduleInput by removing userId from attendees
    const createScheduleInput: CreateScheduleInput = {
      ...data,
      attendees: data.attendees.map(({ email, name, role, status, responseAt }) => ({
        email,
        name,
        role,
        ...(status && { status }),
        ...(responseAt && { responseAt })
      })) as CreateScheduleInput['attendees']
    }
    onSubmit(createScheduleInput)
  }

  const formatTimeRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${endDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">기본 정보</h3>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제목 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="일정 제목을 입력하세요"
                    className="text-base" // Prevent mobile zoom
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로젝트 *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="프로젝트를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: PROJECT_COLORS[project.color]?.primary || '#6b7280'
                            }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Time Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">시간 설정</h3>
          
          {/* All Day Toggle */}
          <FormField
            control={form.control}
            name="isAllDay"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>하루 종일</FormLabel>
                  <FormDescription>
                    특정 시간이 정해지지 않은 일정
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {!form.watch('isAllDay') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시작 시간 *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value ? parseISO(field.value) : new Date()}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        placeholder="시작 시간을 선택하세요"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>종료 시간 *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value ? parseISO(field.value) : addHours(new Date(), 1)}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        placeholder="종료 시간을 선택하세요"
                        minDate={form.watch('startDateTime') ? parseISO(form.watch('startDateTime')) : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Conflict Warning */}
        {conflictResult?.hasConflicts && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>일정 충돌</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {conflictResult.conflicts.length}개의 다른 일정과 시간이 겹칩니다.
              </span>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto ml-2 text-destructive hover:text-destructive/90"
                type="button"
                onClick={() => setShowConflictDetails(!showConflictDetails)}
              >
                {showConflictDetails ? '숨기기' : '자세히 보기'}
              </Button>
            </AlertDescription>
            
            {showConflictDetails && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm">충돌된 일정:</h4>
                {conflictResult.conflicts.map(conflict => (
                  <div key={conflict.scheduleId} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <div>
                      <p className="font-medium text-sm">{conflict.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeRange(conflict.startDateTime, conflict.endDateTime)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {conflictResult.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mt-4">추천 시간:</h4>
                    <div className="space-y-1">
                      {conflictResult.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          type="button"
                          className="w-full justify-start"
                          onClick={() => {
                            form.setValue('startDateTime', suggestion.startDateTime)
                            form.setValue('endDateTime', suggestion.endDateTime)
                          }}
                        >
                          {suggestion.reason}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Alert>
        )}

        {/* Additional Information */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
            <ChevronRight className="w-4 h-4 transition-transform data-[state=open]:rotate-90" />
            추가 정보
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="일정에 대한 자세한 설명을 입력하세요"
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장소</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="예: 회의실 A, 온라인"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://"
                      type="url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>비공개 일정</FormLabel>
                    <FormDescription>
                      다른 팀원들에게 제목과 세부사항을 숨깁니다
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isCheckingConflicts || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? '생성 중...' : '일정 생성'}
          </Button>
        </div>
      </form>
    </Form>
  )
}