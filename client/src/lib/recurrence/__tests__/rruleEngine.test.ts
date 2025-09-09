// RRULE Engine Tests for Story 1.8
// Comprehensive unit tests for RecurrenceEngine

import { RecurrenceEngine } from '../rruleEngine'
import { RecurrenceRule, RecurringSchedule, EnhancedScheduleInstance } from '../../../types/recurrence'
import { addDays, addWeeks, addMonths, format } from 'date-fns'

describe('RecurrenceEngine', () => {
  const mockSchedule: RecurringSchedule = {
    id: 'test-schedule',
    title: 'Test Schedule',
    description: 'Test recurring schedule',
    startDateTime: '2024-01-01T10:00:00.000Z',
    endDateTime: '2024-01-01T11:00:00.000Z',
    duration: 60,
    isAllDay: false,
    timezone: 'UTC',
    projectId: 'test-project',
    project: {
      id: 'test-project',
      name: 'Test Project',
      color: '#3b82f6'
    },
    recurrenceRule: {
      frequency: 'weekly',
      interval: 1
    },
    attendees: [],
    status: 'confirmed',
    isPrivate: false,
    attachments: [],
    exceptions: [],
    modifiedInstances: [],
    createdBy: 'test-user',
    updatedBy: 'test-user',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 1
  }

  describe('parseRRule', () => {
    test('should parse daily recurrence rule', () => {
      const rule: RecurrenceRule = {
        frequency: 'daily',
        interval: 1
      }

      const rrule = RecurrenceEngine.parseRRule(rule)
      expect(rrule).toBeDefined()
      expect(rrule.origOptions.freq).toBe(3) // RRule.DAILY
      expect(rrule.origOptions.interval).toBe(1)
    })

    test('should parse weekly recurrence rule with specific days', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 2,
        byWeekDay: ['MO', 'WE', 'FR']
      }

      const rrule = RecurrenceEngine.parseRRule(rule)
      expect(rrule).toBeDefined()
      expect(rrule.origOptions.freq).toBe(2) // RRule.WEEKLY
      expect(rrule.origOptions.interval).toBe(2)
      expect(rrule.origOptions.byweekday).toHaveLength(3)
    })

    test('should parse monthly recurrence rule with month days', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        interval: 1,
        byMonthDay: [15, 30]
      }

      const rrule = RecurrenceEngine.parseRRule(rule)
      expect(rrule).toBeDefined()
      expect(rrule.origOptions.freq).toBe(1) // RRule.MONTHLY
      expect(rrule.origOptions.bymonthday).toEqual([15, 30])
    })

    test('should parse yearly recurrence rule', () => {
      const rule: RecurrenceRule = {
        frequency: 'yearly',
        interval: 1,
        byMonth: [6, 12]
      }

      const rrule = RecurrenceEngine.parseRRule(rule)
      expect(rrule).toBeDefined()
      expect(rrule.origOptions.freq).toBe(0) // RRule.YEARLY
      expect(rrule.origOptions.bymonth).toEqual([6, 12])
    })

    test('should parse recurrence rule with count and until', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        count: 10
      }

      const rrule = RecurrenceEngine.parseRRule(rule)
      expect(rrule.origOptions.count).toBe(10)

      const ruleWithUntil: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        until: '2024-12-31T23:59:59.000Z'
      }

      const rruleWithUntil = RecurrenceEngine.parseRRule(ruleWithUntil)
      expect(rruleWithUntil.origOptions.until).toBeInstanceOf(Date)
    })
  })

  describe('generateInstances', () => {
    test('should generate daily instances', () => {
      const schedule: RecurringSchedule = {
        ...mockSchedule,
        recurrenceRule: {
          frequency: 'daily',
          interval: 1,
          count: 5
        }
      }

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-10')
      }

      const instances = RecurrenceEngine.generateInstances(schedule, dateRange)
      
      expect(instances).toHaveLength(5)
      expect(instances[0].id).toBe('test-schedule_2024-01-01')
      expect(instances[0].parentId).toBe('test-schedule')
      expect(instances[0].isRecurring).toBe(true)
      expect(instances[0].originalDate).toBe('2024-01-01')
    })

    test('should generate weekly instances with specific days', () => {
      const schedule: RecurringSchedule = {
        ...mockSchedule,
        startDateTime: '2024-01-01T10:00:00.000Z', // Monday
        recurrenceRule: {
          frequency: 'weekly',
          interval: 1,
          byWeekDay: ['MO', 'WE', 'FR']
        }
      }

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-15')
      }

      const instances = RecurrenceEngine.generateInstances(schedule, dateRange)
      
      // Should have 6 instances (3 per week for 2 weeks)
      expect(instances.length).toBeGreaterThan(3)
      
      // Check that instances are on correct days
      instances.forEach(instance => {
        const date = new Date(instance.startDateTime)
        const dayOfWeek = date.getDay()
        expect([1, 3, 5]).toContain(dayOfWeek) // Monday, Wednesday, Friday
      })
    })

    test('should handle exceptions correctly', () => {
      const schedule: RecurringSchedule = {
        ...mockSchedule,
        recurrenceRule: {
          frequency: 'daily',
          interval: 1
        },
        exceptions: [
          {
            date: '2024-01-03',
            type: 'cancelled'
          }
        ]
      }

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-05')
      }

      const instances = RecurrenceEngine.generateInstances(schedule, dateRange)
      
      // Should not include January 3rd
      const instance3rd = instances.find(i => i.originalDate === '2024-01-03')
      expect(instance3rd).toBeUndefined()
    })

    test('should handle modified instances correctly', () => {
      const schedule: RecurringSchedule = {
        ...mockSchedule,
        recurrenceRule: {
          frequency: 'daily',
          interval: 1
        },
        modifiedInstances: [
          {
            originalDate: '2024-01-02',
            modifiedSchedule: {
              title: 'Modified Title',
              startDateTime: '2024-01-02T14:00:00.000Z'
            },
            modifiedAt: '2024-01-01T12:00:00.000Z'
          }
        ]
      }

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-05')
      }

      const instances = RecurrenceEngine.generateInstances(schedule, dateRange)
      
      const modifiedInstance = instances.find(i => i.originalDate === '2024-01-02')
      expect(modifiedInstance).toBeDefined()
      expect(modifiedInstance!.title).toBe('Modified Title')
      expect(modifiedInstance!.startDateTime).toBe('2024-01-02T14:00:00.000Z')
    })

    test('should return empty array on error', () => {
      const invalidSchedule: RecurringSchedule = {
        ...mockSchedule,
        startDateTime: 'invalid-date',
        recurrenceRule: {
          frequency: 'daily',
          interval: 0 // Invalid interval
        }
      }

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-05')
      }

      const instances = RecurrenceEngine.generateInstances(invalidSchedule, dateRange)
      expect(instances).toEqual([])
    })
  })

  describe('toNaturalLanguage', () => {
    test('should convert daily rule to Korean', () => {
      const rule: RecurrenceRule = {
        frequency: 'daily',
        interval: 1
      }

      const result = RecurrenceEngine.toNaturalLanguage(rule, 'ko')
      expect(result.korean).toBe('매일')
      expect(result.components.frequency).toBe('매일')
    })

    test('should convert daily with interval to Korean', () => {
      const rule: RecurrenceRule = {
        frequency: 'daily',
        interval: 3
      }

      const result = RecurrenceEngine.toNaturalLanguage(rule, 'ko')
      expect(result.korean).toBe('3일마다')
    })

    test('should convert weekly with days to Korean', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        byWeekDay: ['MO', 'WE', 'FR']
      }

      const result = RecurrenceEngine.toNaturalLanguage(rule, 'ko')
      expect(result.korean).toBe('매주 월, 수, 금요일')
      expect(result.components.weekdays).toBe('월, 수, 금요일')
    })

    test('should convert monthly to Korean', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        interval: 2
      }

      const result = RecurrenceEngine.toNaturalLanguage(rule, 'ko')
      expect(result.korean).toBe('2개월마다')
    })

    test('should include ending conditions', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        count: 10
      }

      const result = RecurrenceEngine.toNaturalLanguage(rule, 'ko')
      expect(result.korean).toBe('매주 (총 10회)')
    })

    test('should include until date', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        until: '2024-12-31T00:00:00.000Z'
      }

      const result = RecurrenceEngine.toNaturalLanguage(rule, 'ko')
      expect(result.korean).toContain('2024년')
      expect(result.korean).toContain('12월')
      expect(result.korean).toContain('까지')
    })
  })

  describe('parseNaturalLanguage', () => {
    test('should parse "매일"', () => {
      const result = RecurrenceEngine.parseNaturalLanguage('매일')
      expect(result).toEqual({
        frequency: 'daily',
        interval: 1
      })
    })

    test('should parse "매주"', () => {
      const result = RecurrenceEngine.parseNaturalLanguage('매주')
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1
      })
    })

    test('should parse "매주 월요일"', () => {
      const result = RecurrenceEngine.parseNaturalLanguage('매주 월요일')
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        byWeekDay: ['MO']
      })
    })

    test('should parse "주중"', () => {
      const result = RecurrenceEngine.parseNaturalLanguage('주중')
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR']
      })
    })

    test('should return null for unrecognized text', () => {
      const result = RecurrenceEngine.parseNaturalLanguage('invalid pattern')
      expect(result).toBeNull()
    })
  })

  describe('validateRule', () => {
    test('should validate valid rule', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        byWeekDay: ['MO', 'WE', 'FR']
      }

      const result = RecurrenceEngine.validateRule(rule)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject invalid interval', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 0
      }

      const result = RecurrenceEngine.validateRule(rule)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('간격은 1-999 사이여야 합니다.')
    })

    test('should reject weekly with no days', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        byWeekDay: []
      }

      const result = RecurrenceEngine.validateRule(rule)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('주간 반복에서는 최소 하나의 요일을 선택해야 합니다.')
    })

    test('should reject invalid month days', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        interval: 1,
        byMonthDay: [0, 32, 50]
      }

      const result = RecurrenceEngine.validateRule(rule)
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('잘못된 날짜')
    })

    test('should reject both count and until', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        count: 10,
        until: '2024-12-31T00:00:00.000Z'
      }

      const result = RecurrenceEngine.validateRule(rule)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('횟수와 종료 날짜는 동시에 설정할 수 없습니다.')
    })
  })

  describe('getNextOccurrence', () => {
    test('should get next occurrence', () => {
      const rule: RecurrenceRule = {
        frequency: 'daily',
        interval: 1
      }

      const startDate = new Date('2024-01-01T10:00:00.000Z')
      const after = new Date('2024-01-05T10:00:00.000Z')

      const next = RecurrenceEngine.getNextOccurrence(rule, startDate, after)
      expect(next).toBeInstanceOf(Date)
      expect(next!.getTime()).toBeGreaterThan(after.getTime())
    })

    test('should return null for invalid rule', () => {
      const rule: RecurrenceRule = {
        frequency: 'daily',
        interval: 0 // Invalid
      }

      const startDate = new Date('2024-01-01T10:00:00.000Z')
      const next = RecurrenceEngine.getNextOccurrence(rule, startDate)
      expect(next).toBeNull()
    })
  })

  describe('getOccurrenceCount', () => {
    test('should return count from rule', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        count: 15
      }

      const startDate = new Date('2024-01-01T10:00:00.000Z')
      const count = RecurrenceEngine.getOccurrenceCount(rule, startDate)
      expect(count).toBe(15)
    })

    test('should calculate count with until date', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        until: '2024-02-01T10:00:00.000Z'
      }

      const startDate = new Date('2024-01-01T10:00:00.000Z')
      const count = RecurrenceEngine.getOccurrenceCount(rule, startDate)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(10) // Should be around 4-5 weeks
    })

    test('should return Infinity for unlimited rule', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1
      }

      const startDate = new Date('2024-01-01T10:00:00.000Z')
      const count = RecurrenceEngine.getOccurrenceCount(rule, startDate)
      expect(count).toBe(Infinity)
    })
  })

  describe('toRRuleString and fromRRuleString', () => {
    test('should convert to and from RRULE string', () => {
      const rule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 2,
        byWeekDay: ['MO', 'WE'],
        count: 10
      }

      const rruleString = RecurrenceEngine.toRRuleString(rule)
      expect(rruleString).toContain('FREQ=WEEKLY')
      expect(rruleString).toContain('INTERVAL=2')
      expect(rruleString).toContain('COUNT=10')

      const parsedRule = RecurrenceEngine.fromRRuleString(rruleString)
      expect(parsedRule).toBeDefined()
      expect(parsedRule!.frequency).toBe('weekly')
      expect(parsedRule!.interval).toBe(2)
      expect(parsedRule!.count).toBe(10)
    })

    test('should handle invalid RRULE string', () => {
      const result = RecurrenceEngine.fromRRuleString('invalid rrule string')
      expect(result).toBeNull()
    })
  })

  describe('error handling', () => {
    test('should handle invalid date formats gracefully', () => {
      const schedule: RecurringSchedule = {
        ...mockSchedule,
        startDateTime: 'invalid-date-format'
      }

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-05')
      }

      const instances = RecurrenceEngine.generateInstances(schedule, dateRange)
      expect(instances).toEqual([])
    })

    test('should handle malformed recurrence rules', () => {
      const rule = {
        frequency: 'INVALID_FREQUENCY' as any,
        interval: 1
      }

      expect(() => RecurrenceEngine.parseRRule(rule)).not.toThrow()
    })
  })
})