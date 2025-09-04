"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import { 
  Calendar, 
  Home, 
  BarChart3, 
  Users, 
  Settings, 
  Bell,
  ChevronRight,
  Plus
} from "lucide-react"

interface SidebarProps {
  className?: string
}

const navigationItems = [
  { href: "/", icon: Home, label: "Home", active: true },
  { href: "/calendar", icon: Calendar, label: "Calendar", active: false },
  { href: "/analytics", icon: BarChart3, label: "Analytics", active: false },
  { href: "/contacts", icon: Users, label: "Contacts", active: false },
  { href: "/notifications", icon: Bell, label: "Notifications", active: false },
  { href: "/settings", icon: Settings, label: "Settings", active: false },
]

const calendars = [
  { name: "Personal", color: "bg-project-blue-500", count: 12 },
  { name: "Work", color: "bg-project-green-500", count: 8 },
  { name: "Family", color: "bg-project-purple-500", count: 5 },
  { name: "Health", color: "bg-project-red-500", count: 3 },
]

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={`w-64 h-screen bg-card border-r flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-project-blue-600 dark:text-project-blue-400">
            Baro Calendar
          </h2>
          <SimpleThemeToggle />
        </div>
        <Button className="w-full bg-project-blue-500 hover:bg-project-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Navigation
          </h3>
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent ${
                  item.active 
                    ? 'bg-project-blue-50 dark:bg-project-blue-900/20 text-project-blue-700 dark:text-project-blue-300' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.active && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            )
          })}
        </div>

        {/* My Calendars */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              My Calendars
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {calendars.map((calendar) => (
              <div
                key={calendar.name}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer"
              >
                <div className={`w-3 h-3 rounded-full ${calendar.color}`} />
                <span className="text-sm flex-1">{calendar.name}</span>
                <span className="text-xs text-muted-foreground">{calendar.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-project-teal-600 dark:text-project-teal-400">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Events</span>
              <span className="text-sm font-medium">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Meetings</span>
              <span className="text-sm font-medium">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Free Hours</span>
              <span className="text-sm font-medium">24</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Upcoming
          </h3>
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-accent">
              <div className="w-2 h-2 rounded-full bg-project-blue-500 mt-2" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Team Meeting</p>
                <p className="text-xs text-muted-foreground">2:00 PM</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-accent">
              <div className="w-2 h-2 rounded-full bg-project-green-500 mt-2" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Project Review</p>
                <p className="text-xs text-muted-foreground">Tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}