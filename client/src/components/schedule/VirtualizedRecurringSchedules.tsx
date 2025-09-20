// VirtualizedRecurringSchedules Component for Story 1.8
// High-performance virtualized rendering of recurring schedule instances

'use client'

import React, { useMemo, useState, useCallback, memo } from 'react'
import { List } from 'react-window'
import { format, parseISO, compareAsc } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, Clock, Edit2, MoreHorizontal, Trash2 } from 'lucide-react'

import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader } from '../ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { ScrollArea } from '../ui/scroll-area'

import {
  RecurringSchedule,
  EnhancedScheduleInstance,
  VirtualizedRecurringSchedulesProps,
  EditScope
} from '../../types/recurrence'
import { RecurrenceEngine } from '../../lib/recurrence/rruleEngine'

// Day group for organizing schedule instances by date
interface DayScheduleGroup {
  date: string
  schedules: EnhancedScheduleInstance[]
  displayDate: string
}

// Item data for virtualized list
interface ListItemData {
  groups: DayScheduleGroup[]
  onInstanceEdit: (instance: EnhancedScheduleInstance) => void
  onInstanceDelete: (instanceId: string, scope: EditScope) => void
}

// Individual schedule instance card component
const ScheduleInstanceCard: React.FC<{
  instance: EnhancedScheduleInstance
  onEdit: () => void
  onDelete: (scope: EditScope) => void
}> = ({ instance, onEdit, onDelete }) => {
  const startTime = format(parseISO(instance.startDateTime), 'HH:mm')
  const endTime = format(parseISO(instance.endDateTime), 'HH:mm')
  const duration = parseISO(instance.endDateTime).getTime() - parseISO(instance.startDateTime).getTime()
  const durationText = `${Math.round(duration / (1000 * 60))}분`

  return (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: instance.project?.color || '#3b82f6' }}
            />
            <h4 className="font-medium text-sm truncate">{instance.title}</h4>
            {instance.isRecurring && (
              <Badge variant="secondary" className="text-xs">
                반복
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit} className="text-xs">
                <Edit2 className="h-3 w-3 mr-2" />
                편집
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete('this')} 
                className="text-xs text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                이 일정만 삭제
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete('following')} 
                className="text-xs text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                이후 모든 일정 삭제
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete('all')} 
                className="text-xs text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                전체 반복 일정 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{startTime} - {endTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{durationText}</span>
          </div>
        </div>
        
        {instance.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {instance.description}
          </p>
        )}
        
        {instance.location && (
          <p className="text-xs text-blue-600 mt-1">
            📍 {instance.location}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Day group component
const DayScheduleGroupComponent: React.FC<{
  group: DayScheduleGroup
  onInstanceEdit: (instance: EnhancedScheduleInstance) => void
  onInstanceDelete: (instanceId: string, scope: EditScope) => void
}> = ({ group, onInstanceEdit, onInstanceDelete }) => {
  return (
    <div className="mb-6">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{group.displayDate}</h3>
          <Badge variant="outline" className="text-xs">
            {group.schedules.length}개 일정
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        {group.schedules.map(instance => (
          <ScheduleInstanceCard
            key={instance.id}
            instance={instance}
            onEdit={() => onInstanceEdit(instance)}
            onDelete={(scope) => onInstanceDelete(instance.id, scope)}
          />
        ))}
      </div>
    </div>
  )
}

// Virtualized list item component
const ListItem: React.FC<{
  index: number
  style: React.CSSProperties
  data: ListItemData
}> = React.memo(({ index, style, data }) => {
  const group = data.groups[index]
  
  if (!group) return null

  return (
    <div style={style}>
      <div className="px-4 py-2">
        <DayScheduleGroupComponent
          group={group}
          onInstanceEdit={data.onInstanceEdit}
          onInstanceDelete={data.onInstanceDelete}
        />
      </div>
    </div>
  )
}, areEqual)

ListItem.displayName = 'ListItem'

// Main VirtualizedRecurringSchedules component
const VirtualizedRecurringSchedules: React.FC<VirtualizedRecurringSchedulesProps> = ({
  recurringSchedules,
  dateRange,
  onInstanceEdit,
  onInstanceDelete,
  itemHeight = 200,
  overscanCount = 5
}) => {
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate all schedule instances for the date range
  const scheduleInstances = useMemo(() => {
    setIsGenerating(true)
    
    try {
      const instances = new Map<string, EnhancedScheduleInstance>()
      
      recurringSchedules.forEach(recurringSchedule => {
        try {
          const generated = RecurrenceEngine.generateInstances(
            recurringSchedule,
            dateRange
          )
          
          generated.forEach(instance => {
            instances.set(instance.id, instance)
          })
        } catch (error) {
          console.error(`Failed to generate instances for schedule ${recurringSchedule.id}:`, error)
        }
      })
      
      const result = Array.from(instances.values()).sort((a, b) => 
        compareAsc(parseISO(a.startDateTime), parseISO(b.startDateTime))
      )
      
      return result
    } catch (error) {
      console.error('Failed to generate schedule instances:', error)
      return []
    } finally {
      setIsGenerating(false)
    }
  }, [recurringSchedules, dateRange])

  // Group instances by date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, EnhancedScheduleInstance[]>()
    
    scheduleInstances.forEach(instance => {
      const date = format(parseISO(instance.startDateTime), 'yyyy-MM-dd')
      if (!groups.has(date)) {
        groups.set(date, [])
      }
      groups.get(date)!.push(instance)
    })
    
    // Convert to sorted array of DayScheduleGroup
    return Array.from(groups.entries())
      .map(([date, schedules]) => ({
        date,
        schedules: schedules.sort((a, b) => 
          compareAsc(parseISO(a.startDateTime), parseISO(b.startDateTime))
        ),
        displayDate: format(parseISO(date), 'M월 d일 (E)', { locale: ko })
      }))
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)))
  }, [scheduleInstances])

  // List item data for virtualization
  const listItemData: ListItemData = useMemo(() => ({
    groups: groupedByDate,
    onInstanceEdit,
    onInstanceDelete
  }), [groupedByDate, onInstanceEdit, onInstanceDelete])

  // Calculate total height for each item (dynamic sizing)
  const getItemSize = useCallback((index: number) => {
    const group = groupedByDate[index]
    if (!group) return itemHeight
    
    // Base height for date header + padding
    const baseHeight = 60
    // Each schedule card height + margin
    const cardHeight = 120
    
    return baseHeight + (group.schedules.length * cardHeight)
  }, [groupedByDate, itemHeight])

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">반복 일정을 생성하는 중...</p>
        </div>
      </div>
    )
  }

  if (groupedByDate.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">반복 일정이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            선택한 기간에 표시할 반복 일정이 없습니다.
          </p>
        </div>
      </div>
    )
  }

  // For small lists, render without virtualization
  if (groupedByDate.length <= 10) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {groupedByDate.map(group => (
            <DayScheduleGroupComponent
              key={group.date}
              group={group}
              onInstanceEdit={onInstanceEdit}
              onInstanceDelete={onInstanceDelete}
            />
          ))}
        </div>
      </ScrollArea>
    )
  }

  // Render virtualized list for large datasets
  return (
    <TooltipProvider>
      <div className="h-full">
        <div className="mb-4 px-4 py-2 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{scheduleInstances.length}개</span>의 반복 일정 인스턴스
            </div>
            <div className="text-xs text-muted-foreground">
              {format(dateRange.start, 'M/d')} - {format(dateRange.end, 'M/d')}
            </div>
          </div>
        </div>
        
        <div style={{height: 600}}>
          {/* @ts-ignore */}
          <List
            height={600} // Fixed height for virtualization
            itemCount={groupedByDate.length}
            itemSize={getItemSize}
            itemData={listItemData}
            overscanCount={overscanCount}
          >
            {ListItem as any}
          </List>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default VirtualizedRecurringSchedules