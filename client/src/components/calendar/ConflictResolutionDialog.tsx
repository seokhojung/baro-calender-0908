"use client"

import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Clock, Users, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { 
  ConflictResolutionProps, 
  ConflictResolution,
  PROJECT_COLORS 
} from '@/types/schedule'

export const ConflictResolutionDialog: React.FC<ConflictResolutionProps & {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}> = ({
  conflicts,
  onResolve,
  isOpen,
  onOpenChange
}) => {
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution>()

  const handleResolve = () => {
    if (selectedResolution) {
      onResolve(selectedResolution)
      onOpenChange(false)
      setSelectedResolution(undefined)
    }
  }

  const formatTimeRange = (start: string, end: string) => {
    const startDate = parseISO(start)
    const endDate = parseISO(end)
    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return '알 수 없음'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            일정 충돌 감지
          </DialogTitle>
          <DialogDescription>
            다른 일정과 시간이 겹칩니다. 해결 방법을 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflict Summary */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{conflicts.conflicts.length}개의 일정</strong>과 충돌이 발생했습니다.
              {conflicts.suggestions.length > 0 && (
                <span> {conflicts.suggestions.length}개의 대안 시간을 제안합니다.</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Conflicting Schedules */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              충돌된 일정
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conflicts.conflicts.map((conflict) => (
                <div 
                  key={conflict.scheduleId} 
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conflict.title}</p>
                      <Badge variant={getSeverityColor(conflict.severity)}>
                        {getSeverityLabel(conflict.severity)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTimeRange(conflict.startDateTime, conflict.endDateTime)}
                      </div>
                      
                      {conflict.conflictingAttendees.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {conflict.conflictingAttendees.length}명 중복
                        </div>
                      )}
                    </div>

                    {conflict.conflictingAttendees.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">중복 참가자:</p>
                        <div className="flex flex-wrap gap-1">
                          {conflict.conflictingAttendees.map((email, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h4 className="font-medium">해결 방법</h4>
            
            <div className="space-y-2">
              {/* Force Option */}
              <Button
                variant={selectedResolution === 'force' ? 'default' : 'outline'}
                className="w-full justify-start h-auto p-4"
                onClick={() => setSelectedResolution('force')}
              >
                <div className="text-left">
                  <div className="font-medium">그대로 진행</div>
                  <div className="text-sm text-muted-foreground">
                    충돌을 무시하고 일정을 생성합니다.
                  </div>
                </div>
              </Button>

              {/* Suggested Times */}
              {conflicts.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">추천 시간대:</p>
                  {conflicts.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedResolution && 
                        typeof selectedResolution === 'object' && 
                        selectedResolution.timeSlot === suggestion 
                          ? 'default' 
                          : 'outline'
                      }
                      className="w-full justify-start h-auto p-4"
                      onClick={() => setSelectedResolution({ 
                        type: 'reschedule', 
                        timeSlot: suggestion 
                      })}
                    >
                      <div className="text-left">
                        <div className="font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTimeRange(suggestion.startDateTime, suggestion.endDateTime)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.reason}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Cancel Option */}
              <Button
                variant={selectedResolution === 'cancel' ? 'destructive' : 'outline'}
                className="w-full justify-start h-auto p-4"
                onClick={() => setSelectedResolution('cancel')}
              >
                <div className="text-left">
                  <div className="font-medium">일정 생성 취소</div>
                  <div className="text-sm text-muted-foreground">
                    일정 생성을 중단하고 폼으로 돌아갑니다.
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSelectedResolution(undefined)
            }}
          >
            닫기
          </Button>
          <Button
            disabled={!selectedResolution}
            onClick={handleResolve}
            className="min-w-20"
          >
            {selectedResolution === 'cancel' ? '취소' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Simplified version for drag and drop conflicts
export const DragConflictDialog: React.FC<{
  isOpen: boolean
  conflicts: any
  onResolve: (resolution: ConflictResolution) => void
  onOpenChange: (open: boolean) => void
}> = ({
  isOpen,
  conflicts,
  onResolve,
  onOpenChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            일정 이동 충돌
          </DialogTitle>
          <DialogDescription>
            이동하려는 시간에 다른 일정이 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {conflicts.conflicts.length}개의 일정과 충돌합니다.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onResolve('force')
                onOpenChange(false)
              }}
            >
              그대로 이동
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onResolve('cancel')
                onOpenChange(false)
              }}
            >
              이동 취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}