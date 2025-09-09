// RRULE Engine with Korean Natural Language Support for Story 1.8
// RFC 5545 compatible recurring schedule system

import { RRule, RRuleSet, Weekday } from 'rrule'
import { format, parseISO, addHours, addMinutes, set, getHours, getMinutes, getSeconds } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  RecurrenceRule,
  RecurringSchedule,
  EnhancedScheduleInstance,
  WeekDay,
  RecurrenceNaturalLanguage,
  WEEKDAY_KOREAN_MAP,
  FREQUENCY_KOREAN_MAP
} from '../../types/recurrence'

export class RecurrenceEngine {
  /**
   * RRULE 파싱 - RecurrenceRule을 RRule 객체로 변환
   */
  static parseRRule(rule: RecurrenceRule, dtstart?: Date): RRule {
    const options: any = {
      freq: this.mapFrequency(rule.frequency),
      interval: rule.interval,
    }
    
    // Set dtstart if provided
    if (dtstart) {
      options.dtstart = dtstart
    }
    if (rule.count) options.count = rule.count
    if (rule.until) options.until = new Date(rule.until)
    
    // 주간 반복 설정
    if (rule.byWeekDay && rule.byWeekDay.length > 0) {
      options.byweekday = rule.byWeekDay.map(day => this.mapWeekDay(day))
    }
    
    // 월간 반복 설정
    if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      options.bymonthday = rule.byMonthDay
    }
    
    if (rule.bySetPos && rule.bySetPos.length > 0) {
      options.bysetpos = rule.bySetPos
    }
    
    // 연간 반복 설정
    if (rule.byMonth && rule.byMonth.length > 0) {
      options.bymonth = rule.byMonth
    }
    
    if (rule.byYearDay && rule.byYearDay.length > 0) {
      options.byyearday = rule.byYearDay
    }
    
    // 주 시작일 설정
    if (rule.weekStartsOn !== undefined) {
      options.wkst = rule.weekStartsOn === 0 ? RRule.SU : RRule.MO
    }
    
    return new RRule(options)
  }
  
  /**
   * 반복 일정 인스턴스 생성
   */
  static generateInstances(
    recurringSchedule: RecurringSchedule,
    dateRange: { start: Date; end: Date }
  ): EnhancedScheduleInstance[] {
    try {
      const dtstart = new Date(recurringSchedule.startDateTime)
      const rrule = this.parseRRule(recurringSchedule.recurrenceRule, dtstart)
      const rruleSet = new RRuleSet()
      
      // 기본 반복 규칙 추가
      rruleSet.rrule(rrule)
      
      // 예외 날짜 제외
      recurringSchedule.exceptions.forEach(exception => {
        if (exception.type === 'cancelled') {
          // Exception date needs to match the time of the original occurrence
          const exceptionDate = new Date(exception.date + 'T' + dtstart.toISOString().split('T')[1])
          rruleSet.exdate(exceptionDate)
        }
      })
      
      // 날짜 범위 내 인스턴스 생성
      const occurrences = rruleSet.between(dateRange.start, dateRange.end, true)
      
      return occurrences.map(date => {
        const instanceDate = format(date, 'yyyy-MM-dd')
        
        // 수정된 인스턴스가 있는지 확인
        const modifiedInstance = recurringSchedule.modifiedInstances.find(
          instance => instance.originalDate === instanceDate
        )
        
        if (modifiedInstance) {
          return {
            ...recurringSchedule,
            ...modifiedInstance.modifiedSchedule,
            id: `${recurringSchedule.id}_${instanceDate}`,
            parentId: recurringSchedule.id,
            startDateTime: modifiedInstance.modifiedSchedule.startDateTime || 
              this.calculateDateTime(date, recurringSchedule.startDateTime),
            endDateTime: modifiedInstance.modifiedSchedule.endDateTime || 
              this.calculateDateTime(date, recurringSchedule.endDateTime),
            isRecurring: true as const,
            originalDate: instanceDate
          } as EnhancedScheduleInstance
        }
        
        // 기본 인스턴스
        return {
          ...recurringSchedule,
          id: `${recurringSchedule.id}_${instanceDate}`,
          parentId: recurringSchedule.id,
          startDateTime: this.calculateDateTime(date, recurringSchedule.startDateTime),
          endDateTime: this.calculateDateTime(date, recurringSchedule.endDateTime),
          isRecurring: true as const,
          originalDate: instanceDate
        } as EnhancedScheduleInstance
      })
    } catch (error) {
      console.error('Failed to generate recurrence instances:', error)
      return []
    }
  }
  
  /**
   * 특정 날짜에 대한 일정 시간 계산
   */
  private static calculateDateTime(occurrenceDate: Date, originalDateTime: string): string {
    try {
      const originalDate = parseISO(originalDateTime)
      const newDateTime = set(occurrenceDate, {
        hours: getHours(originalDate),
        minutes: getMinutes(originalDate),
        seconds: getSeconds(originalDate)
      })
      return newDateTime.toISOString()
    } catch (error) {
      console.error('Failed to calculate date time:', error)
      return originalDateTime
    }
  }
  
  /**
   * 빈도를 RRule 상수로 매핑
   */
  private static mapFrequency(frequency: RecurrenceRule['frequency']): number {
    const mapping = {
      'daily': RRule.DAILY,
      'weekly': RRule.WEEKLY,
      'monthly': RRule.MONTHLY,
      'yearly': RRule.YEARLY,
      'DAILY': RRule.DAILY,
      'WEEKLY': RRule.WEEKLY,
      'MONTHLY': RRule.MONTHLY,
      'YEARLY': RRule.YEARLY
    } as any
    const mapped = mapping[frequency]
    if (!mapped) {
      throw new Error(`Invalid frequency: ${frequency}`)
    }
    return mapped
  }
  
  /**
   * 요일을 RRule Weekday로 매핑
   */
  private static mapWeekDay(day: WeekDay): Weekday {
    const mapping = {
      'SU': RRule.SU,
      'MO': RRule.MO,
      'TU': RRule.TU,
      'WE': RRule.WE,
      'TH': RRule.TH,
      'FR': RRule.FR,
      'SA': RRule.SA
    }
    return mapping[day]
  }
  
  /**
   * RRULE을 자연어로 변환 (한국어/영어 지원)
   */
  static toNaturalLanguage(
    rule: RecurrenceRule, 
    locale: string = 'ko'
  ): RecurrenceNaturalLanguage {
    const rrule = this.parseRRule(rule)
    
    if (locale === 'ko') {
      const korean = this.toKoreanText(rrule, rule)
      const components = this.extractKoreanComponents(rule)
      return {
        korean,
        english: rrule.toText(),
        components
      }
    }
    
    return {
      korean: this.toKoreanText(rrule, rule),
      english: rrule.toText(),
      components: this.extractKoreanComponents(rule)
    }
  }
  
  /**
   * 한국어 자연어 변환
   */
  private static toKoreanText(rrule: RRule, rule: RecurrenceRule): string {
    const { frequency, interval, byWeekDay, until, count, byMonthDay, bySetPos } = rule
    
    let result = ''
    
    // 기본 빈도
    switch (frequency) {
      case 'daily':
        result = interval === 1 ? '매일' : `${interval}일마다`
        break
      case 'weekly':
        if (byWeekDay && byWeekDay.length > 0) {
          const days = byWeekDay.map(day => WEEKDAY_KOREAN_MAP[day]).join(', ')
          result = interval === 1 ? `매주 ${days}요일` : `${interval}주마다 ${days}요일`
        } else {
          result = interval === 1 ? '매주' : `${interval}주마다`
        }
        break
      case 'monthly':
        if (bySetPos && bySetPos.length > 0) {
          const positions = bySetPos.map(pos => {
            if (pos === -1) return '마지막'
            if (pos === 1) return '첫째'
            if (pos === 2) return '둘째'
            if (pos === 3) return '셋째'
            if (pos === 4) return '넷째'
            return `${pos}번째`
          }).join(', ')
          
          if (byWeekDay && byWeekDay.length > 0) {
            const days = byWeekDay.map(day => WEEKDAY_KOREAN_MAP[day]).join(', ')
            result = interval === 1 
              ? `매월 ${positions} ${days}요일` 
              : `${interval}개월마다 ${positions} ${days}요일`
          } else {
            result = interval === 1 ? `매월 ${positions}` : `${interval}개월마다 ${positions}`
          }
        } else if (byMonthDay && byMonthDay.length > 0) {
          const days = byMonthDay.join(', ')
          result = interval === 1 ? `매월 ${days}일` : `${interval}개월마다 ${days}일`
        } else {
          result = interval === 1 ? '매월' : `${interval}개월마다`
        }
        break
      case 'yearly':
        result = interval === 1 ? '매년' : `${interval}년마다`
        break
    }
    
    // 종료 조건
    if (count) {
      result += ` (총 ${count}회)`
    } else if (until) {
      const endDate = parseISO(until)
      result += ` (${format(endDate, 'yyyy년 M월 d일', { locale: ko })}까지)`
    }
    
    return result
  }
  
  /**
   * 한국어 구성요소 추출
   */
  private static extractKoreanComponents(rule: RecurrenceRule) {
    const { frequency, interval, byWeekDay, until, count } = rule
    
    let frequencyText = FREQUENCY_KOREAN_MAP[frequency]
    let intervalText = ''
    let weekdaysText = ''
    let endingText = ''
    
    if (interval > 1) {
      switch (frequency) {
        case 'daily':
          intervalText = `${interval}일마다`
          break
        case 'weekly':
          intervalText = `${interval}주마다`
          break
        case 'monthly':
          intervalText = `${interval}개월마다`
          break
        case 'yearly':
          intervalText = `${interval}년마다`
          break
      }
    }
    
    if (byWeekDay && byWeekDay.length > 0) {
      weekdaysText = byWeekDay.map(day => WEEKDAY_KOREAN_MAP[day]).join(', ') + '요일'
    }
    
    if (count) {
      endingText = `총 ${count}회`
    } else if (until) {
      const endDate = parseISO(until)
      endingText = `${format(endDate, 'yyyy년 M월 d일', { locale: ko })}까지`
    }
    
    return {
      frequency: frequencyText,
      interval: intervalText,
      weekdays: weekdaysText,
      ending: endingText
    }
  }
  
  /**
   * 자연어에서 RRULE로 역변환 (기본적인 패턴만 지원)
   */
  static parseNaturalLanguage(text: string): RecurrenceRule | null {
    try {
      const normalizedText = text.trim().toLowerCase()
      
      // 매일 패턴
      if (normalizedText.includes('매일')) {
        return { frequency: 'daily', interval: 1 }
      }
      
      // 매주 패턴
      if (normalizedText.includes('매주')) {
        const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 }
        
        // 특정 요일 추출
        const weekdays: WeekDay[] = []
        Object.entries(WEEKDAY_KOREAN_MAP).forEach(([key, value]) => {
          if (normalizedText.includes(value)) {
            weekdays.push(key as WeekDay)
          }
        })
        
        if (weekdays.length > 0) {
          rule.byWeekDay = weekdays
        }
        
        return rule
      }
      
      // 매월 패턴
      if (normalizedText.includes('매월')) {
        return { frequency: 'monthly', interval: 1 }
      }
      
      // 매년 패턴
      if (normalizedText.includes('매년')) {
        return { frequency: 'yearly', interval: 1 }
      }
      
      // 주중 패턴
      if (normalizedText.includes('주중')) {
        return {
          frequency: 'weekly',
          interval: 1,
          byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR']
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to parse natural language:', error)
      return null
    }
  }
  
  /**
   * 반복 규칙 유효성 검사
   */
  static validateRule(rule: RecurrenceRule): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 간격 검사
    if (rule.interval < 1 || rule.interval > 999) {
      errors.push('간격은 1-999 사이여야 합니다.')
    }
    
    // 주간 반복 검사
    if (rule.frequency === 'weekly' && rule.byWeekDay) {
      if (rule.byWeekDay.length === 0) {
        errors.push('주간 반복에서는 최소 하나의 요일을 선택해야 합니다.')
      }
      
      const validWeekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
      const invalidWeekdays = rule.byWeekDay.filter(day => !validWeekdays.includes(day))
      if (invalidWeekdays.length > 0) {
        errors.push(`잘못된 요일: ${invalidWeekdays.join(', ')}`)
      }
    }
    
    // 월간 반복 검사
    if (rule.frequency === 'monthly') {
      if (rule.byMonthDay) {
        const invalidDays = rule.byMonthDay.filter(day => day < 1 || day > 31)
        if (invalidDays.length > 0) {
          errors.push(`잘못된 날짜: ${invalidDays.join(', ')} (1-31 사이여야 함)`)
        }
      }
      
      if (rule.bySetPos) {
        const invalidPositions = rule.bySetPos.filter(pos => 
          (pos < -5 || pos > 5) || pos === 0
        )
        if (invalidPositions.length > 0) {
          errors.push('위치는 -5부터 5까지 가능하며 0은 불가합니다.')
        }
      }
    }
    
    // 종료 조건 검사
    if (rule.count && rule.until) {
      errors.push('횟수와 종료 날짜는 동시에 설정할 수 없습니다.')
    }
    
    if (rule.count && (rule.count < 1 || rule.count > 999)) {
      errors.push('반복 횟수는 1-999 사이여야 합니다.')
    }
    
    if (rule.until) {
      try {
        const untilDate = parseISO(rule.until)
        const now = new Date()
        if (untilDate <= now) {
          errors.push('종료 날짜는 현재 시간보다 이후여야 합니다.')
        }
      } catch (error) {
        errors.push('잘못된 종료 날짜 형식입니다.')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * 다음 발생 날짜 계산
   */
  static getNextOccurrence(rule: RecurrenceRule, startDate: Date, after?: Date): Date | null {
    try {
      const rrule = this.parseRRule(rule)
      const searchAfter = after || new Date()
      const nextOccurrence = rrule.after(searchAfter)
      return nextOccurrence
    } catch (error) {
      console.error('Failed to get next occurrence:', error)
      return null
    }
  }
  
  /**
   * 총 반복 횟수 계산 (예상)
   */
  static getOccurrenceCount(
    rule: RecurrenceRule, 
    startDate: Date, 
    endDate?: Date
  ): number {
    try {
      const rrule = this.parseRRule(rule)
      
      if (rule.count) {
        return rule.count
      }
      
      if (rule.until) {
        const untilDate = parseISO(rule.until)
        const occurrences = rrule.between(startDate, untilDate, true)
        return occurrences.length
      }
      
      if (endDate) {
        const occurrences = rrule.between(startDate, endDate, true)
        return occurrences.length
      }
      
      // 무한 반복
      return Infinity
    } catch (error) {
      console.error('Failed to get occurrence count:', error)
      return 0
    }
  }
  
  /**
   * RRULE 문자열로 변환
   */
  static toRRuleString(rule: RecurrenceRule): string {
    try {
      const rrule = this.parseRRule(rule)
      return rrule.toString()
    } catch (error) {
      console.error('Failed to convert to RRULE string:', error)
      return ''
    }
  }
  
  /**
   * RRULE 문자열에서 파싱
   */
  static fromRRuleString(rruleString: string): RecurrenceRule | null {
    try {
      const rrule = RRule.fromString(rruleString)
      const options = rrule.origOptions
      
      const rule: RecurrenceRule = {
        frequency: this.mapRRuleFrequency(options.freq),
        interval: options.interval || 1
      }
      
      if (options.count) rule.count = options.count
      if (options.until) rule.until = options.until.toISOString()
      
      if (options.byweekday) {
        rule.byWeekDay = options.byweekday.map((wd: any) => {
          const weekdayMap: Record<number, WeekDay> = {
            0: 'MO', 1: 'TU', 2: 'WE', 3: 'TH', 4: 'FR', 5: 'SA', 6: 'SU'
          }
          return weekdayMap[wd.weekday]
        }).filter(Boolean)
      }
      
      if (options.bymonthday) rule.byMonthDay = options.bymonthday
      if (options.bysetpos) rule.bySetPos = options.bysetpos
      if (options.bymonth) rule.byMonth = options.bymonth
      if (options.byyearday) rule.byYearDay = options.byyearday
      
      return rule
    } catch (error) {
      console.error('Failed to parse RRULE string:', error)
      return null
    }
  }
  
  /**
   * RRule 빈도를 우리 타입으로 매핑
   */
  private static mapRRuleFrequency(freq: number): RecurrenceRule['frequency'] {
    switch (freq) {
      case RRule.DAILY: return 'daily'
      case RRule.WEEKLY: return 'weekly'
      case RRule.MONTHLY: return 'monthly'
      case RRule.YEARLY: return 'yearly'
      default: return 'weekly'
    }
  }
}

export default RecurrenceEngine