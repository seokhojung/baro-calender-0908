// RecurrenceForm Component for Story 1.8
// Intuitive recurrence pattern setting UI with natural language preview

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { addMonths, format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Repeat, Settings, ChevronRight } from 'lucide-react'

import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Input } from '../ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

import {
  RecurrenceRule,
  WeekDay,
  RecurrenceFormProps,
  RECURRENCE_PRESETS,
  WEEKDAY_KOREAN_MAP,
  DEFAULT_RECURRENCE_RULE
} from '../../types/recurrence'
import { RecurrenceEngine } from '../../lib/recurrence/rruleEngine'
import { DatePicker } from '../ui/date-picker'

const RecurrenceForm: React.FC<RecurrenceFormProps> = ({
  value = DEFAULT_RECURRENCE_RULE,
  onChange,
  disabled = false,
  showPresets = true,
  showAdvanced = true
}) => {
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>(value.frequency)
  const [interval, setInterval] = useState(value.interval)
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>(() => {
    if (value.count) return 'count'
    if (value.until) return 'until'
    return 'never'
  })
  const [count, setCount] = useState(value.count || 10)
  const [until, setUntil] = useState<Date>(() => {
    if (value.until) {
      try {
        return parseISO(value.until)
      } catch {
        return addMonths(new Date(), 6)
      }
    }
    return addMonths(new Date(), 6)
  })
  const [weekDays, setWeekDays] = useState<any[]>(value.byWeekDay || ['MO'])
  const [monthlyType, setMonthlyType] = useState<'date' | 'position'>(() => {
    return value.bySetPos && value.bySetPos.length > 0 ? 'position' : 'date'
  })
  const [monthDay, setMonthDay] = useState(value.byMonthDay?.[0] || 1)
  const [setPosition, setSetPosition] = useState(value.bySetPos?.[0] || 1)
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(value.weekStartsOn || 1)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Build current rule from form state
  const currentRule = useMemo((): RecurrenceRule => {
    const rule: RecurrenceRule = {
      frequency,
      interval,
      weekStartsOn
    }

    // End conditions
    if (endType === 'count') {
      rule.count = count
    } else if (endType === 'until') {
      rule.until = until.toISOString()
    }

    // Frequency-specific settings
    switch (frequency) {
      case 'weekly':
        if (weekDays.length > 0) {
          rule.byWeekDay = weekDays
        }
        break
      case 'monthly':
        if (monthlyType === 'date') {
          rule.byMonthDay = [monthDay]
        } else {
          rule.bySetPos = [setPosition]
          if (weekDays.length > 0) {
            rule.byWeekDay = weekDays.slice(0, 1) // Only use first selected day for position
          }
        }
        break
    }

    return rule
  }, [frequency, interval, endType, count, until, weekDays, monthlyType, monthDay, setPosition, weekStartsOn])

  // Natural language preview
  const naturalLanguage = useMemo(() => {
    try {
      const nlResult = RecurrenceEngine.toNaturalLanguage(currentRule, 'ko')
      return nlResult.korean
    } catch (error) {
      console.error('Failed to generate natural language:', error)
      return '반복 설정'
    }
  }, [currentRule])

  // Update parent when rule changes
  useEffect(() => {
    if (!disabled) {
      onChange(currentRule)
    }
  }, [currentRule, onChange, disabled])

  // Preset selection handler
  const handlePresetSelect = (rule: RecurrenceRule) => {
    if (disabled) return
    
    setFrequency(rule.frequency)
    setInterval(rule.interval)
    
    if (rule.byWeekDay) {
      setWeekDays(rule.byWeekDay)
    } else {
      setWeekDays(['MO'])
    }
    
    if (rule.count) {
      setEndType('count')
      setCount(rule.count)
    } else if (rule.until) {
      setEndType('until')
      setUntil(parseISO(rule.until))
    } else {
      setEndType('never')
    }
  }

  // Week day toggle handler
  const handleWeekDayToggle = (day: WeekDay) => {
    if (disabled) return
    
    const newWeekDays = weekDays.includes(day)
      ? weekDays.filter(d => d !== day)
      : [...weekDays, day]
    
    // Ensure at least one day is selected for weekly
    if (frequency === 'weekly' && newWeekDays.length === 0) {
      return
    }
    
    setWeekDays(newWeekDays.length > 0 ? newWeekDays : [day])
  }

  return (
    <div className="space-y-6">
      {/* Natural Language Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">반복 패턴</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">{naturalLanguage}</p>
      </div>

      {/* Quick Presets */}
      {showPresets && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">빠른 설정</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {RECURRENCE_PRESETS.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-auto p-3 text-left flex-col items-start"
                onClick={() => handlePresetSelect(preset.rule)}
                disabled={disabled}
              >
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Frequency Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">반복 주기</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: 'daily', label: '매일' },
            { value: 'weekly', label: '매주' },
            { value: 'monthly', label: '매월' },
            { value: 'yearly', label: '매년' }
          ].map(option => (
            <Button
              key={option.value}
              type="button"
              variant={frequency === option.value ? 'default' : 'outline'}
              onClick={() => !disabled && setFrequency(option.value as RecurrenceRule['frequency'])}
              className="h-12"
              disabled={disabled}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Interval Setting */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <Label>간격</Label>
          <Select 
            value={interval.toString()} 
            onValueChange={(v) => !disabled && setInterval(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground pb-2">
          {frequency === 'daily' && (interval === 1 ? '매일' : `${interval}일마다`)}
          {frequency === 'weekly' && (interval === 1 ? '매주' : `${interval}주마다`)}
          {frequency === 'monthly' && (interval === 1 ? '매월' : `${interval}개월마다`)}
          {frequency === 'yearly' && (interval === 1 ? '매년' : `${interval}년마다`)}
        </div>
      </div>

      {/* Weekly - Day Selection */}
      {frequency === 'weekly' && (
        <div className="space-y-3">
          <Label>반복할 요일</Label>
          <div className="grid grid-cols-7 gap-1">
            {[
              { value: 'SU', label: '일' },
              { value: 'MO', label: '월' },
              { value: 'TU', label: '화' },
              { value: 'WE', label: '수' },
              { value: 'TH', label: '목' },
              { value: 'FR', label: '금' },
              { value: 'SA', label: '토' }
            ].map(day => (
              <Button
                key={day.value}
                type="button"
                variant={weekDays.includes(day.value as WeekDay) ? 'default' : 'outline'}
                size="sm"
                className="h-10"
                onClick={() => handleWeekDayToggle(day.value as WeekDay)}
                disabled={disabled}
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly - Date/Position Selection */}
      {frequency === 'monthly' && (
        <div className="space-y-4">
          <Label>월간 반복 방식</Label>
          <RadioGroup 
            value={monthlyType} 
            onValueChange={(value) => !disabled && setMonthlyType(value as 'date' | 'position')}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="date" id="monthly-date" />
              <Label htmlFor="monthly-date">매월 같은 날짜</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="position" id="monthly-position" />
              <Label htmlFor="monthly-position">매월 같은 위치</Label>
            </div>
          </RadioGroup>

          {monthlyType === 'date' && (
            <div className="flex items-center gap-2">
              <Label>매월</Label>
              <Select 
                value={monthDay.toString()}
                onValueChange={(v) => !disabled && setMonthDay(Number(v))}
                disabled={disabled}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>일</Label>
            </div>
          )}

          {monthlyType === 'position' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>매월</Label>
                <Select 
                  value={setPosition.toString()}
                  onValueChange={(v) => !disabled && setSetPosition(Number(v))}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">첫째</SelectItem>
                    <SelectItem value="2">둘째</SelectItem>
                    <SelectItem value="3">셋째</SelectItem>
                    <SelectItem value="4">넷째</SelectItem>
                    <SelectItem value="-1">마지막</SelectItem>
                  </SelectContent>
                </Select>
                <Label>주</Label>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {[
                  { value: 'SU', label: '일' },
                  { value: 'MO', label: '월' },
                  { value: 'TU', label: '화' },
                  { value: 'WE', label: '수' },
                  { value: 'TH', label: '목' },
                  { value: 'FR', label: '금' },
                  { value: 'SA', label: '토' }
                ].map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={weekDays.includes(day.value as WeekDay) ? 'default' : 'outline'}
                    size="sm"
                    className="h-10"
                    onClick={() => {
                      if (!disabled) {
                        setWeekDays([day.value as WeekDay]) // Only one day for position
                      }
                    }}
                    disabled={disabled}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* End Conditions */}
      <div className="space-y-3">
        <Label className="text-base font-medium">종료 조건</Label>
        <RadioGroup 
          value={endType} 
          onValueChange={(value) => !disabled && setEndType(value as any)}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never" id="end-never" />
            <Label htmlFor="end-never">끝나지 않음</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="count" id="end-count" />
            <Label htmlFor="end-count">횟수 제한</Label>
            {endType === 'count' && (
              <Input
                type="number"
                min={1}
                max={999}
                value={count}
                onChange={(e) => !disabled && setCount(Number(e.target.value))}
                className="w-20 ml-2"
                disabled={disabled}
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="until" id="end-until" />
            <Label htmlFor="end-until">종료 날짜</Label>
            {endType === 'until' && (
              <div className="ml-2">
                <DatePicker
                  date={until}
                  onSelect={(date) => !disabled && date && setUntil(date)}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </RadioGroup>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none" disabled={disabled}>
            <Settings className="w-4 h-4" />
            고급 옵션
            <ChevronRight className="w-4 h-4 transition-transform data-[state=open]:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div>
              <Label>주 시작일</Label>
              <Select 
                value={weekStartsOn.toString()}
                onValueChange={(v) => !disabled && setWeekStartsOn(Number(v) as 0 | 1)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">일요일</SelectItem>
                  <SelectItem value="1">월요일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

export default RecurrenceForm