"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3, Users, Settings, Plus } from "lucide-react"

interface DashboardProps {
  className?: string
}

export function Dashboard({ className }: DashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-project-blue-600 dark:text-project-blue-400">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome to your calendar dashboard
          </p>
        </div>
        <Button className="bg-project-blue-500 hover:bg-project-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-token-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-project-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-project-blue-600 dark:text-project-blue-400">24</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-token-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <BarChart3 className="h-4 w-4 text-project-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-project-green-600 dark:text-project-green-400">8</div>
            <p className="text-xs text-muted-foreground">
              2 meetings, 6 personal
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-token-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-project-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-project-purple-600 dark:text-project-purple-400">12</div>
            <p className="text-xs text-muted-foreground">
              Active this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-token-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-project-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-project-orange-600 dark:text-project-orange-400">5</div>
            <p className="text-xs text-muted-foreground">
              Calendars connected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-project-teal-600 dark:text-project-teal-400">Recent Events</CardTitle>
            <CardDescription>Your latest calendar activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Team Meeting", time: "Today, 2:00 PM", type: "meeting" },
                { title: "Project Review", time: "Tomorrow, 10:00 AM", type: "work" },
                { title: "Coffee with Sarah", time: "Friday, 3:00 PM", type: "personal" },
                { title: "Doctor Appointment", time: "Next Monday, 9:00 AM", type: "health" },
              ].map((event, index) => (
                <div key={index} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-accent">
                  <div className={`w-3 h-3 rounded-full ${
                    event.type === 'meeting' ? 'bg-project-blue-500' :
                    event.type === 'work' ? 'bg-project-green-500' :
                    event.type === 'personal' ? 'bg-project-purple-500' :
                    'bg-project-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-project-pink-600 dark:text-project-pink-400">Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2 text-project-blue-500" />
                <span className="text-sm">Schedule</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2 text-project-green-500" />
                <span className="text-sm">Invite</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <BarChart3 className="h-6 w-6 mb-2 text-project-purple-500" />
                <span className="text-sm">Analytics</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Settings className="h-6 w-6 mb-2 text-project-orange-500" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}