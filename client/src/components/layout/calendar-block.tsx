"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Clock,
  MapPin,
  Users
} from "lucide-react"

interface CalendarBlockProps {
  className?: string
}

const events = [
  {
    id: 1,
    title: "Team Standup",
    time: "9:00 AM",
    duration: "30 min",
    location: "Conference Room A",
    attendees: 5,
    color: "bg-project-blue-500",
    category: "meeting"
  },
  {
    id: 2,
    title: "Design Review",
    time: "2:00 PM", 
    duration: "1 hour",
    location: "Online",
    attendees: 8,
    color: "bg-project-purple-500",
    category: "review"
  },
  {
    id: 3,
    title: "Coffee with Sarah",
    time: "4:00 PM",
    duration: "45 min",
    location: "Local Café",
    attendees: 2,
    color: "bg-project-green-500",
    category: "personal"
  }
]

export function CalendarBlock({ className }: CalendarBlockProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [selectedMonth, setSelectedMonth] = React.useState(new Date())

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedMonth(newDate)
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Calendar Widget */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-project-blue-600 dark:text-project-blue-400 flex items-center">
              <CalendarDays className="h-5 w-5 mr-2" />
              Calendar View
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {formatMonthYear(selectedMonth)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-project-purple-600 dark:text-project-purple-400">
            Today&apos;s Events
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {date?.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            }) || 'No date selected'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full ${event.color} mt-2`} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate">{event.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.time} ({event.duration})
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {event.attendees} attendees
                    </div>
                  </div>
                </div>
              </div>
              
              {event.id !== events[events.length - 1]?.id && (
                <div className="border-b border-border/50" />
              )}
            </div>
          ))}
          
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              View All Events
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mini Calendar Stats */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-project-teal-600 dark:text-project-teal-400">
            Calendar Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-project-blue-50 dark:bg-project-blue-900/20">
              <div className="text-2xl font-bold text-project-blue-600 dark:text-project-blue-400">24</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-project-green-50 dark:bg-project-green-900/20">
              <div className="text-2xl font-bold text-project-green-600 dark:text-project-green-400">8</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-project-purple-50 dark:bg-project-purple-900/20">
              <div className="text-2xl font-bold text-project-purple-600 dark:text-project-purple-400">3</div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-project-orange-50 dark:bg-project-orange-900/20">
              <div className="text-2xl font-bold text-project-orange-600 dark:text-project-orange-400">12</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}