// Recurring Schedule Conflict Detection Engine for Story 1.8
// Advanced conflict detection and resolution for recurring schedules

import { 
  parseISO, 
  addHours, 
  addMinutes, 
  isWithinInterval, 
  differenceInMinutes,
  format
} from 'date-fns'
import {
  RecurringSchedule,
  EnhancedScheduleInstance,
  RecurringConflictResult,
  ConflictInstance,
  RecurringSuggestion
} from '../../types/recurrence'
import { Schedule } from '../../types/schedule'
import { RecurrenceEngine } from './rruleEngine'

export class RecurringConflictDetector {
  /**
   * 반복 일정 간 충돌 감지
   */
  static detectRecurringConflicts(
    newRecurringSchedule: RecurringSchedule,
    existingSchedules: (Schedule | RecurringSchedule)[],
    dateRange: { start: Date; end: Date }
  ): RecurringConflictResult {
    const conflicts: ConflictInstance[] = []
    
    try {
      // 새 반복 일정의 인스턴스 생성
      const newInstances = RecurrenceEngine.generateInstances(
        newRecurringSchedule, 
        dateRange
      )
      
      // 기존 일정들과 비교
      for (const existingSchedule of existingSchedules) {
        if ('recurrenceRule' in existingSchedule) {
          // 기존 반복 일정과의 충돌
          const existingInstances = RecurrenceEngine.generateInstances(
            existingSchedule,
            dateRange
          )
          
          const instanceConflicts = this.findInstanceConflicts(
            newInstances,
            existingInstances
          )
          
          conflicts.push(...instanceConflicts)
        } else {
          // 단일 일정과의 충돌
          const singleConflicts = this.findSingleScheduleConflicts(
            newInstances,
            [existingSchedule]
          )
          
          conflicts.push(...singleConflicts)
        }
      }
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        suggestions: this.generateRecurringSuggestions(
          newRecurringSchedule,
          conflicts,
          dateRange
        )
      }
    } catch (error) {
      console.error('Failed to detect recurring conflicts:', error)
      return {
        hasConflicts: false,
        conflicts: [],
        suggestions: []
      }
    }
  }
  
  /**
   * 반복 일정 인스턴스 간 충돌 찾기
   */
  private static findInstanceConflicts(
    newInstances: EnhancedScheduleInstance[],
    existingInstances: EnhancedScheduleInstance[]
  ): ConflictInstance[] {
    const conflicts: ConflictInstance[] = []
    
    for (const newInstance of newInstances) {
      for (const existingInstance of existingInstances) {
        const conflict = this.checkInstanceOverlap(newInstance, existingInstance)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }
    
    return conflicts
  }
  
  /**
   * 단일 일정과의 충돌 찾기
   */
  private static findSingleScheduleConflicts(
    newInstances: EnhancedScheduleInstance[],
    existingSchedules: Schedule[]
  ): ConflictInstance[] {
    const conflicts: ConflictInstance[] = []
    
    for (const newInstance of newInstances) {
      for (const existingSchedule of existingSchedules) {
        const conflict = this.checkScheduleOverlap(newInstance, existingSchedule)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }
    
    return conflicts
  }
  
  /**
   * 두 인스턴스 간 겹침 검사
   */
  private static checkInstanceOverlap(
    instance1: EnhancedScheduleInstance,
    instance2: EnhancedScheduleInstance
  ): ConflictInstance | null {
    try {
      const start1 = parseISO(instance1.startDateTime)
      const end1 = parseISO(instance1.endDateTime)
      const start2 = parseISO(instance2.startDateTime)
      const end2 = parseISO(instance2.endDateTime)
      
      // 겹침 검사
      const hasOverlap = (
        isWithinInterval(start1, { start: start2, end: end2 }) ||
        isWithinInterval(end1, { start: start2, end: end2 }) ||
        isWithinInterval(start2, { start: start1, end: end1 }) ||
        isWithinInterval(end2, { start: start1, end: end1 }) ||
        (start1.getTime() === start2.getTime()) ||
        (end1.getTime() === end2.getTime())
      )
      
      if (!hasOverlap) return null
      
      // 겹치는 시간 계산
      const overlapStart = start1 > start2 ? start1 : start2
      const overlapEnd = end1 < end2 ? end1 : end2
      const overlapDuration = differenceInMinutes(overlapEnd, overlapStart)
      
      // 심각도 계산
      const totalDuration1 = differenceInMinutes(end1, start1)
      const totalDuration2 = differenceInMinutes(end2, start2)
      const averageDuration = (totalDuration1 + totalDuration2) / 2
      const overlapRatio = overlapDuration / averageDuration
      
      let severity: 'high' | 'medium' | 'low' = 'low'
      if (overlapRatio > 0.8) severity = 'high'
      else if (overlapRatio > 0.5) severity = 'medium'
      
      return {
        date: instance1.originalDate,
        conflictingScheduleId: instance2.id,
        conflictingScheduleTitle: instance2.title,
        originalScheduleId: instance1.id,
        severity,
        overlapDuration
      }
    } catch (error) {
      console.error('Failed to check instance overlap:', error)
      return null
    }
  }
  
  /**
   * 인스턴스와 단일 일정 간 겹침 검사
   */
  private static checkScheduleOverlap(
    instance: EnhancedScheduleInstance,
    schedule: Schedule
  ): ConflictInstance | null {
    try {
      const instanceStart = parseISO(instance.startDateTime)
      const instanceEnd = parseISO(instance.endDateTime)
      const scheduleStart = parseISO(schedule.startDateTime)
      const scheduleEnd = parseISO(schedule.endDateTime)
      
      // 겹침 검사
      const hasOverlap = (
        isWithinInterval(instanceStart, { start: scheduleStart, end: scheduleEnd }) ||
        isWithinInterval(instanceEnd, { start: scheduleStart, end: scheduleEnd }) ||
        isWithinInterval(scheduleStart, { start: instanceStart, end: instanceEnd }) ||
        isWithinInterval(scheduleEnd, { start: instanceStart, end: instanceEnd }) ||
        (instanceStart.getTime() === scheduleStart.getTime()) ||
        (instanceEnd.getTime() === scheduleEnd.getTime())
      )
      
      if (!hasOverlap) return null
      
      // 겹치는 시간 계산
      const overlapStart = instanceStart > scheduleStart ? instanceStart : scheduleStart
      const overlapEnd = instanceEnd < scheduleEnd ? instanceEnd : scheduleEnd
      const overlapDuration = differenceInMinutes(overlapEnd, overlapStart)
      
      // 심각도 계산
      const instanceDuration = differenceInMinutes(instanceEnd, instanceStart)
      const scheduleDuration = differenceInMinutes(scheduleEnd, scheduleStart)
      const averageDuration = (instanceDuration + scheduleDuration) / 2
      const overlapRatio = overlapDuration / averageDuration
      
      let severity: 'high' | 'medium' | 'low' = 'low'
      if (overlapRatio > 0.8) severity = 'high'
      else if (overlapRatio > 0.5) severity = 'medium'
      
      return {
        date: instance.originalDate,
        conflictingScheduleId: schedule.id,
        conflictingScheduleTitle: schedule.title,
        originalScheduleId: instance.id,
        severity,
        overlapDuration
      }
    } catch (error) {
      console.error('Failed to check schedule overlap:', error)
      return null
    }
  }
  
  /**
   * 반복 일정 충돌 해결 제안 생성
   */
  private static generateRecurringSuggestions(
    schedule: RecurringSchedule,
    conflicts: ConflictInstance[],
    dateRange: { start: Date; end: Date }
  ): RecurringSuggestion[] {
    const suggestions: RecurringSuggestion[] = []
    
    if (conflicts.length === 0) return suggestions
    
    try {
      // 1. 시간대 변경 제안
      const timeShiftSuggestions = this.generateTimeShiftSuggestions(
        schedule, 
        conflicts,
        dateRange
      )
      suggestions.push(...timeShiftSuggestions)
      
      // 2. 빈도 조정 제안
      const frequencyChangeSuggestions = this.generateFrequencyChangeSuggestions(
        schedule,
        conflicts
      )
      suggestions.push(...frequencyChangeSuggestions)
      
      // 3. 예외 날짜 추가 제안
      const exceptionSuggestions = this.generateExceptionSuggestions(
        schedule,
        conflicts
      )
      suggestions.push(...exceptionSuggestions)
      
      // 충돌 감소율로 정렬
      return suggestions
        .sort((a, b) => b.conflictReduction - a.conflictReduction)
        .slice(0, 5) // 최대 5개 제안
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      return []
    }
  }
  
  /**
   * 시간대 변경 제안
   */
  private static generateTimeShiftSuggestions(
    schedule: RecurringSchedule,
    conflicts: ConflictInstance[],
    dateRange: { start: Date; end: Date }
  ): RecurringSuggestion[] {
    const suggestions: RecurringSuggestion[] = []
    
    const timeShifts = [
      { hours: -2, label: '2시간 앞으로' },
      { hours: -1, label: '1시간 앞으로' },
      { minutes: -30, label: '30분 앞으로' },
      { minutes: 30, label: '30분 뒤로' },
      { hours: 1, label: '1시간 뒤로' },
      { hours: 2, label: '2시간 뒤로' }
    ]
    
    for (const timeShift of timeShifts) {
      const originalStart = parseISO(schedule.startDateTime)
      const originalEnd = parseISO(schedule.endDateTime)
      
      let adjustedStart = originalStart
      let adjustedEnd = originalEnd
      
      if (timeShift.hours) {
        adjustedStart = addHours(originalStart, timeShift.hours)
        adjustedEnd = addHours(originalEnd, timeShift.hours)
      } else if (timeShift.minutes) {
        adjustedStart = addMinutes(originalStart, timeShift.minutes)
        adjustedEnd = addMinutes(originalEnd, timeShift.minutes)
      }
      
      const adjustedSchedule: RecurringSchedule = {
        ...schedule,
        startDateTime: adjustedStart.toISOString(),
        endDateTime: adjustedEnd.toISOString()
      }
      
      // 새 시간대로 충돌 재검사 (간단화된 버전)
      const estimatedReduction = Math.floor(conflicts.length * 0.3) // 대략적 추정
      
      if (estimatedReduction > 0) {
        suggestions.push({
          type: 'time_shift',
          description: timeShift.label,
          modifiedRule: adjustedSchedule,
          conflictReduction: estimatedReduction
        })
      }
    }
    
    return suggestions
  }
  
  /**
   * 빈도 조정 제안
   */
  private static generateFrequencyChangeSuggestions(
    schedule: RecurringSchedule,
    conflicts: ConflictInstance[]
  ): RecurringSuggestion[] {
    const suggestions: RecurringSuggestion[] = []
    const { frequency, interval } = schedule.recurrenceRule
    
    // 매일 → 주중으로 변경
    if (frequency === 'daily') {
      const adjustedSchedule: RecurringSchedule = {
        ...schedule,
        recurrenceRule: {
          ...schedule.recurrenceRule,
          frequency: 'weekly',
          byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR']
        }
      }
      
      suggestions.push({
        type: 'frequency_change',
        description: '주중으로 변경 (주말 제외)',
        modifiedRule: adjustedSchedule,
        conflictReduction: Math.floor(conflicts.length * 0.3)
      })
    }
    
    // 간격 증가 제안
    if (interval === 1) {
      const adjustedSchedule: RecurringSchedule = {
        ...schedule,
        recurrenceRule: {
          ...schedule.recurrenceRule,
          interval: 2
        }
      }
      
      const frequencyLabel = {
        'daily': '격일',
        'weekly': '격주',
        'monthly': '격월',
        'yearly': '격년'
      }[frequency]
      
      suggestions.push({
        type: 'frequency_change',
        description: `${frequencyLabel}로 변경`,
        modifiedRule: adjustedSchedule,
        conflictReduction: Math.floor(conflicts.length * 0.5)
      })
    }
    
    return suggestions
  }
  
  /**
   * 예외 날짜 추가 제안
   */
  private static generateExceptionSuggestions(
    schedule: RecurringSchedule,
    conflicts: ConflictInstance[]
  ): RecurringSuggestion[] {
    const suggestions: RecurringSuggestion[] = []
    
    // 고충돌 날짜들을 예외로 추가 제안
    const highConflictDates = conflicts
      .filter(conflict => conflict.severity === 'high')
      .map(conflict => conflict.date)
      .slice(0, 3) // 최대 3개
    
    if (highConflictDates.length > 0) {
      const adjustedSchedule: RecurringSchedule = {
        ...schedule,
        exceptions: [
          ...schedule.exceptions,
          ...highConflictDates.map(date => ({
            date,
            type: 'cancelled' as const
          }))
        ]
      }
      
      suggestions.push({
        type: 'exception_add',
        description: `충돌 날짜 ${highConflictDates.length}개 제외`,
        modifiedRule: adjustedSchedule,
        conflictReduction: highConflictDates.length
      })
    }
    
    return suggestions
  }
  
  /**
   * 특정 날짜 범위의 충돌 통계
   */
  static getConflictStatistics(
    conflicts: ConflictInstance[]
  ): {
    total: number
    byDate: Map<string, number>
    bySeverity: Record<'high' | 'medium' | 'low', number>
    totalOverlapMinutes: number
  } {
    const byDate = new Map<string, number>()
    const bySeverity = { high: 0, medium: 0, low: 0 }
    let totalOverlapMinutes = 0
    
    conflicts.forEach(conflict => {
      // 날짜별 카운트
      byDate.set(conflict.date, (byDate.get(conflict.date) || 0) + 1)
      
      // 심각도별 카운트
      bySeverity[conflict.severity]++
      
      // 총 겹침 시간
      totalOverlapMinutes += conflict.overlapDuration
    })
    
    return {
      total: conflicts.length,
      byDate,
      bySeverity,
      totalOverlapMinutes
    }
  }
  
  /**
   * 충돌 가능성 예측 (머신러닝 대신 휴리스틱 사용)
   */
  static predictConflictProbability(
    schedule: RecurringSchedule,
    historicalData: {
      totalSchedules: number
      peakHours: number[]
      busyDaysOfWeek: number[]
    }
  ): number {
    let probability = 0
    
    // 기본 확률 (전체 일정 수에 비례)
    const baseProb = Math.min(historicalData.totalSchedules / 100, 0.5)
    probability += baseProb
    
    // 시간대 충돌 위험도
    const scheduleHour = new Date(schedule.startDateTime).getHours()
    if (historicalData.peakHours.includes(scheduleHour)) {
      probability += 0.3
    }
    
    // 요일 충돌 위험도
    if (schedule.recurrenceRule.byWeekDay) {
      const weekdayRisk = schedule.recurrenceRule.byWeekDay
        .map(day => {
          const dayNumber = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(day)
          return historicalData.busyDaysOfWeek.includes(dayNumber) ? 0.2 : 0
        })
        .reduce((sum, risk) => sum + risk, 0)
      
      probability += weekdayRisk
    }
    
    // 빈도에 따른 위험도
    const frequencyRisk = {
      'daily': 0.4,
      'weekly': 0.2,
      'monthly': 0.1,
      'yearly': 0.05
    }[schedule.recurrenceRule.frequency]
    
    probability += frequencyRisk
    
    return Math.min(probability, 1) // 최대 1.0
  }
}

export default RecurringConflictDetector