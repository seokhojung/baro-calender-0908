"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "날짜와 시간을 선택하세요",
  disabled = false,
  minDate,
  maxDate,
  className
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = React.useState(
    value ? format(value, "HH:mm") : "09:00"
  )

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setTimeValue(format(value, "HH:mm"))
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      onChange?.(undefined)
      return
    }

    const [hours, minutes] = timeValue.split(':').map(Number)
    const newDateTime = new Date(date)
    newDateTime.setHours(hours, minutes, 0, 0)
    
    setSelectedDate(newDateTime)
    onChange?.(newDateTime)
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number)
      if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        const newDateTime = new Date(selectedDate)
        newDateTime.setHours(hours, minutes, 0, 0)
        setSelectedDate(newDateTime)
        onChange?.(newDateTime)
      }
    }
  }

  const handleApply = () => {
    if (selectedDate) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      const finalDateTime = new Date(selectedDate)
      finalDateTime.setHours(hours, minutes, 0, 0)
      onChange?.(finalDateTime)
    }
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "yyyy년 MM월 dd일 HH:mm")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
              initialFocus
            />
            <div className="flex flex-col gap-2 px-3 py-4 border-l">
              <Label htmlFor="time-picker" className="text-sm font-medium">
                시간
              </Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="time-picker"
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  onClick={handleApply}
                  className="w-full"
                  size="sm"
                >
                  적용
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                  size="sm"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}