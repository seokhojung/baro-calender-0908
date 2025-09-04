"use client";

import { Dashboard } from "@/components/layout/dashboard";
import { Sidebar } from "@/components/layout/sidebar";
import { CalendarBlock } from "@/components/layout/calendar-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LayoutDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-project-purple-600 dark:text-project-purple-400">
            Layout Blocks Demo
          </h1>
          <p className="text-lg text-project-purple-500 dark:text-project-purple-300">
            Dashboard, Sidebar, and Calendar layout components
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard Block</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar Block</TabsTrigger>
            <TabsTrigger value="calendar">Calendar Block</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-project-blue-600 dark:text-project-blue-400">
                  Dashboard Layout Block
                </CardTitle>
                <CardDescription>
                  Complete dashboard with stats cards, recent activity, and quick actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sidebar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-project-green-600 dark:text-project-green-400">
                  Sidebar Layout Block
                </CardTitle>
                <CardDescription>
                  Navigation sidebar with calendar list, quick stats, and upcoming events
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <Sidebar className="h-[600px]" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-project-teal-600 dark:text-project-teal-400">
                  Calendar Layout Block
                </CardTitle>
                <CardDescription>
                  Full calendar view with today&apos;s events and overview stats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarBlock />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Full Layout Example */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-project-orange-600 dark:text-project-orange-400">
              Complete Layout Example
            </CardTitle>
            <CardDescription>
              Combined layout showing sidebar + dashboard integration
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-hidden">
              <div className="flex h-[400px]">
                <Sidebar className="flex-shrink-0" />
                <div className="flex-1 p-4 overflow-auto">
                  <Dashboard />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}