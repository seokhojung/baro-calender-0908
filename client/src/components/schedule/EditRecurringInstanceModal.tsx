// EditRecurringInstanceModal Component for Story 1.8
// Modal for editing recurring schedule instances with scope selection

'use client'

import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'

import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { DateTimePicker } from '../ui/date-time-picker'

import {
  EnhancedScheduleInstance,
  EditRecurringInstanceModalProps,
  RecurringEditOperation,
  EditScope
} from '../../types/recurrence'
import { Schedule } from '../../types/schedule'
import { RecurrenceEngine } from '../../lib/recurrence/rruleEngine'

interface ScheduleFormData {
  title: string
  description: string
  startDateTime: string
  endDateTime: string
  location: string
  isAllDay: boolean
}

const EditRecurringInstanceModal: React.FC<EditRecurringInstanceModalProps> = ({ 
  instance, 
  onSave, 
  onClose 
}) => {
  const [editScope, setEditScope] = useState<EditScope>('this')
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: instance.title,
    description: instance.description || '',
    startDateTime: instance.startDateTime,
    endDateTime: instance.endDateTime,
    location: instance.location || '',
    isAllDay: instance.isAllDay
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Track changes
  useEffect(() => {
    const hasFormChanges = (
      formData.title !== instance.title ||
      formData.description !== (instance.description || '') ||
      formData.startDateTime !== instance.startDateTime ||
      formData.endDateTime !== instance.endDateTime ||
      formData.location !== (instance.location || '') ||
      formData.isAllDay !== instance.isAllDay
    )
    setHasChanges(hasFormChanges)
  }, [formData, instance])

  // Validate form
  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.title.trim()) {
      errors.push('제목을 입력해주세요.')
    }
    
    const startDate = new Date(formData.startDateTime)
    const endDate = new Date(formData.endDateTime)
    
    if (isNaN(startDate.getTime())) {
      errors.push('올바른 시작 시간을 선택해주세요.')
    }
    
    if (isNaN(endDate.getTime())) {
      errors.push('올바른 종료 시간을 선택해주세요.')
    }
    
    if (startDate >= endDate) {
      errors.push('종료 시간은 시작 시간보다 늦어야 합니다.')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Handle form field changes
  const handleFieldChange = (field: keyof ScheduleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle date/time changes
  const handleDateTimeChange = (field: 'startDateTime' | 'endDateTime', date: Date) => {
    const isoString = date.toISOString()
    setFormData(prev => {
      const newData = { ...prev, [field]: isoString }
      
      // Auto-adjust end time when start time changes
      if (field === 'startDateTime' && prev.startDateTime !== isoString) {
        const oldStart = new Date(prev.startDateTime)
        const oldEnd = new Date(prev.endDateTime)
        const duration = oldEnd.getTime() - oldStart.getTime()
        
        const newEnd = new Date(date.getTime() + duration)
        newData.endDateTime = newEnd.toISOString()
      }
      
      return newData
    })
  }

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Prepare modifications (only changed fields)
      const modifications: Partial<Schedule> = {}
      
      if (formData.title !== instance.title) {
        modifications.title = formData.title
      }
      
      if (formData.description !== (instance.description || '')) {
        modifications.description = formData.description
      }
      
      if (formData.startDateTime !== instance.startDateTime) {
        modifications.startDateTime = formData.startDateTime
      }
      
      if (formData.endDateTime !== instance.endDateTime) {
        modifications.endDateTime = formData.endDateTime
      }
      
      if (formData.location !== (instance.location || '')) {
        modifications.location = formData.location
      }
      
      if (formData.isAllDay !== instance.isAllDay) {
        modifications.isAllDay = formData.isAllDay
      }

      // Create operation based on scope
      let operation: RecurringEditOperation
      
      switch (editScope) {
        case 'this':
          operation = {
            type: 'single_instance',
            instanceId: instance.id,
            parentId: instance.parentId,
            originalDate: instance.originalDate,
            modifications
          }
          break
          
        case 'following':
          operation = {
            type: 'following_instances',
            parentId: instance.parentId,
            fromDate: instance.originalDate,
            modifications
          }
          break
          
        case 'all':
          operation = {
            type: 'all_instances',
            parentId: instance.parentId,
            modifications
          }
          break
      }

      await onSave(operation)
      onClose()
    } catch (error) {
      console.error('Failed to save recurring schedule instance:', error)
      setValidationErrors(['저장 중 오류가 발생했습니다. 다시 시도해주세요.'])
    } finally {
      setIsLoading(false)
    }
  }

  // Get natural language description of recurrence pattern
  const recurrenceDescription = React.useMemo(() => {
    // This would come from the parent recurring schedule
    // For now, we'll show a placeholder
    return '매주 반복' // TODO: Get from parent schedule's recurrence rule
  }, [])

  // Get scope impact description
  const getScopeImpactDescription = (scope: EditScope): string => {
    const instanceDate = format(parseISO(instance.startDateTime), 'yyyy년 M월 d일 (E)', { locale: ko })
    
    switch (scope) {
      case 'this':
        return `${instanceDate} 일정만 변경됩니다.`
      case 'following':
        return `${instanceDate}부터 이후의 모든 반복 일정이 변경됩니다.`
      case 'all':
        return `과거와 미래의 모든 반복 일정이 변경됩니다.`
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>반복 일정 편집</DialogTitle>
          <DialogDescription>
            이 일정은 반복 일정의 일부입니다 ({recurrenceDescription}). 
            어느 범위까지 변경사항을 적용하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Edit Scope Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">편집 범위</Label>
          <RadioGroup value={editScope} onValueChange={(value) => setEditScope(value as EditScope)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="this" id="edit-this" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="edit-this" className="font-medium cursor-pointer">
                    이 일정만 편집
                  </Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getScopeImpactDescription('this')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="following" id="edit-following" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="edit-following" className="font-medium cursor-pointer">
                    이 날짜 이후 모든 일정 편집
                  </Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getScopeImpactDescription('following')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="all" id="edit-all" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="edit-all" className="font-medium cursor-pointer">
                    전체 반복 일정 편집
                  </Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getScopeImpactDescription('all')}
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Schedule Edit Form */}
        <div className="space-y-4">
          <Label className="text-base font-medium">일정 정보</Label>
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="일정 제목을 입력하세요"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="일정 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작 시간 *</Label>
              <DateTimePicker
                date={new Date(formData.startDateTime)}
                onSelect={(date) => date && handleDateTimeChange('startDateTime', date)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>종료 시간 *</Label>
              <DateTimePicker
                date={new Date(formData.endDateTime)}
                onSelect={(date) => date && handleDateTimeChange('endDateTime', date)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">장소</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="장소를 입력하세요"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.isAllDay}
              onChange={(e) => handleFieldChange('isAllDay', e.target.checked)}
            />
            <Label htmlFor="allDay">종일 일정</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isLoading}
            className="relative"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <span className={isLoading ? 'invisible' : ''}>
              저장
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditRecurringInstanceModal