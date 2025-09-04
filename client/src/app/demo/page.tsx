"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SimpleThemeToggle, ThemeToggle } from "@/components/ui/theme-toggle";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";

export default function DemoPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="text-center space-y-4 flex-1">
          <h1 className="text-4xl font-bold text-project-blue-600 dark:text-project-blue-400">Design System Demo</h1>
          <p className="text-lg text-project-blue-500 dark:text-project-blue-300">ShadCN UI + 8-Color Palette + Typography + Dark/Light Themes</p>
        </div>
        <div className="flex gap-2">
          <SimpleThemeToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Theme System Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-project-purple-600 dark:text-project-purple-400">Dark/Light Theme System</CardTitle>
          <CardDescription>Automatic theme switching with persistence and system detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background border text-center">
              <h3 className="font-semibold text-foreground">Background Colors</h3>
              <p className="text-sm text-muted-foreground mt-2">Adapts to theme</p>
            </div>
            <div className="p-4 rounded-lg bg-card border text-center">
              <h3 className="font-semibold text-card-foreground">Card Colors</h3>
              <p className="text-sm text-muted-foreground mt-2">Semantic colors</p>
            </div>
            <div className="p-4 rounded-lg bg-accent border text-center">
              <h3 className="font-semibold text-accent-foreground">Accent Colors</h3>
              <p className="text-sm text-muted-foreground mt-2">Theme-aware</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-project-purple-600 dark:text-project-purple-400">8-Color Project Palette</CardTitle>
          <CardDescription>Complete color scales with 50-900 variations, theme-optimized</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Blue', class: 'project-blue', hex: '#3B82F6' },
              { name: 'Green', class: 'project-green', hex: '#10B981' },
              { name: 'Purple', class: 'project-purple', hex: '#8B5CF6' },
              { name: 'Red', class: 'project-red', hex: '#EF4444' },
              { name: 'Orange', class: 'project-orange', hex: '#F97316' },
              { name: 'Yellow', class: 'project-yellow', hex: '#EAB308' },
              { name: 'Teal', class: 'project-teal', hex: '#14B8A6' },
              { name: 'Pink', class: 'project-pink', hex: '#EC4899' },
            ].map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`w-full h-16 rounded-lg bg-${color.class}-500 shadow-token-md`}></div>
                <div className="text-center">
                  <p className="font-medium text-sm">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography Scale Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-project-green-600">Typography Scale (9 Levels)</CardTitle>
          <CardDescription>From xs (12px) to 5xl (48px) with design tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-project-teal-600">Extra Small - 12px (text-xs)</p>
          <p className="text-sm text-project-teal-600">Small - 14px (text-sm)</p>
          <p className="text-base text-project-teal-600">Base - 16px (text-base)</p>
          <p className="text-lg text-project-teal-600">Large - 18px (text-lg)</p>
          <p className="text-xl text-project-teal-600">Extra Large - 20px (text-xl)</p>
          <p className="text-2xl text-project-teal-600">2X Large - 24px (text-2xl)</p>
          <p className="text-3xl text-project-teal-600">3X Large - 30px (text-3xl)</p>
          <p className="text-4xl text-project-teal-600">4X Large - 36px (text-4xl)</p>
          <p className="text-5xl text-project-teal-600">5X Large - 48px (text-5xl)</p>
        </CardContent>
      </Card>

      {/* Spacing System Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-project-orange-600">Spacing System (4px Base)</CardTitle>
          <CardDescription>Consistent spacing with 4px increments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-project-orange-300 rounded"></div>
              <span className="text-sm">4px (space-1)</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-4 bg-project-orange-400 rounded"></div>
              <span className="text-sm">8px (space-2)</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-4 bg-project-orange-500 rounded"></div>
              <span className="text-sm">12px (space-3)</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-4 bg-project-orange-600 rounded"></div>
              <span className="text-sm">16px (space-4)</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Components</CardTitle>
            <CardDescription>Button, Input, and Select components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button>Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Input placeholder="Type something..." />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-project-green-600 dark:text-project-green-400">Calendar & Date Picker</CardTitle>
            <CardDescription>Full calendar component and popover date picker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Date Picker (Popover)</h4>
              <DatePicker 
                date={date}
                onDateChange={setDate}
                placeholder="Select a date"
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Full Calendar</h4>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-fit"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tabs Component</CardTitle>
            <CardDescription>Tab navigation example</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <p>This is the content of Tab 1</p>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <p>This is the content of Tab 2</p>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <p>This is the content of Tab 3</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dialog Component</CardTitle>
            <CardDescription>Modal dialog example</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demo Dialog</DialogTitle>
                  <DialogDescription>
                    This is a demo dialog using ShadCN UI Dialog component.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Dialog content goes here...</p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}