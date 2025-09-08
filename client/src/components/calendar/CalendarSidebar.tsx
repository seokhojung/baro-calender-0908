"use client";

import React from 'react';
import { format, isToday } from 'date-fns';
import { Clock, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useProjectStore } from '@/stores/projectStore';
import { Event } from '@/types/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
  className?: string;
  onEventSelect?: (event: Event) => void;
  onDateSelect?: (date: Date) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  className,
  onEventSelect,
  onDateSelect
}) => {
  const { store, selectors, isReady } = useCalendar();
  const projectStore = useProjectStore();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      store.setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const handleEventClick = (event: Event) => {
    store.setSelectedEventId(event.id);
    onEventSelect?.(event);
  };

  const getProjectColor = (event: Event) => {
    const project = projectStore.projects.find(p => p.id === event.category);
    return project?.color || event.color || '#3b82f6';
  };

  const selectedDateEvents = store.selectedDate 
    ? selectors.getEventsForDate(store.selectedDate)
    : [];

  const todayEvents = selectors.getEventsForDate(new Date());

  const upcomingEvents = store.events
    .filter(event => new Date(event.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const formatEventTime = (event: Event) => {
    if (event.allDay) return 'All day';
    const start = format(new Date(event.startDate), 'HH:mm');
    const end = format(new Date(event.endDate), 'HH:mm');
    return `${start} - ${end}`;
  };

  const EventList: React.FC<{ events: Event[]; title: string }> = ({ events, title }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm",
                store.selectedEventId === event.id && "ring-2 ring-blue-500"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: getProjectColor(event) }}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <h5 className="font-medium text-sm truncate">{event.title}</h5>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatEventTime(event)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{event.attendees.length} attendees</span>
                    </div>
                  )}
                  
                  {event.category && (
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isReady) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mini Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Quick Navigate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={store.selectedDate || undefined}
            onSelect={handleDateSelect}
            month={store.currentDate}
            className="rounded-md border-0"
            classNames={{
              day_today: "bg-blue-500 text-white",
              day_selected: "bg-blue-100 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {store.selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {isToday(store.selectedDate) 
                ? "Today&apos;s Events" 
                : format(store.selectedDate, 'MMM d, yyyy')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <EventList events={selectedDateEvents} title="" />
          </CardContent>
        </Card>
      )}

      {/* Today's Events (if no date selected) */}
      {!store.selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Events</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <EventList events={todayEvents} title="" />
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={cn(
                    "p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors",
                    store.selectedEventId === event.id && "ring-2 ring-blue-500"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getProjectColor(event) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          {event.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.startDate), 'MMM d')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatEventTime(event)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {projectStore.projects
              .filter(project => project.isActive)
              .map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </div>
              ))
            }
            {projectStore.projects.filter(p => p.isActive).length === 0 && (
              <p className="text-sm text-muted-foreground">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSidebar;