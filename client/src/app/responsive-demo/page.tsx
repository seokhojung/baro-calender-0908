"use client";

import React, { useState } from 'react';
import { CalendarProvider } from '@/components/providers/calendar-provider';
import ResponsiveCalendar from '@/components/calendar/ResponsiveCalendar';
import ResponsiveMonthView from '@/components/calendar/ResponsiveMonthView';
import KeyboardNavigationProvider from '@/components/calendar/KeyboardNavigationProvider';
import { PerformanceMonitor, useMobilePerformance } from '@/lib/utils/mobile-performance';
import { Button } from '@/components/ui/button';
import { TouchOptimizedButton, ResponsiveLayout } from '@/components/ui/responsive-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, 
  Monitor, 
  Accessibility, 
  Keyboard, 
  Hand as Touch, 
  Zap,
  Info
} from 'lucide-react';

const ResponsiveDemoPage: React.FC = () => {
  const [demoMode, setDemoMode] = useState<'calendar' | 'month' | 'components'>('calendar');
  const [enableA11y, setEnableA11y] = useState(true);
  const [enableTouch, setEnableTouch] = useState(true);
  const [showPerformanceData, setShowPerformanceData] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);

  const { 
    deviceCapabilities, 
    performanceMetrics,
    getOptimizedConfig
  } = useMobilePerformance();

  const optimizedConfig = getOptimizedConfig();

  const handleEventEdit = (event: any) => {
    console.log('Edit event:', event);
  };

  const handleEventDelete = (event: any) => {
    console.log('Delete event:', event);
  };

  const handleEventCreate = (date?: Date) => {
    console.log('Create event for:', date);
  };

  const handleEventSelect = (event: any) => {
    console.log('Select event:', event);
  };

  const handleSettings = () => {
    console.log('Open settings');
  };

  const handlePerformanceData = (data: any) => {
    setPerformanceData(data);
  };

  const renderDeviceInfo = () => {
    if (!deviceCapabilities) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Device Type</p>
              <Badge variant={deviceCapabilities.isLowEndDevice ? "destructive" : "default"}>
                {deviceCapabilities.isLowEndDevice ? 'Low-end' : 'High-end'}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Screen Size</p>
              <Badge variant="outline">{deviceCapabilities.screenSize}</Badge>
            </div>
            <div>
              <p className="font-medium">Touch Support</p>
              <Badge variant={deviceCapabilities.touchSupport ? "default" : "outline"}>
                {deviceCapabilities.touchSupport ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Hardware Accel</p>
              <Badge variant={deviceCapabilities.hasHardwareAcceleration ? "default" : "destructive"}>
                {deviceCapabilities.hasHardwareAcceleration ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
          
          {showPerformanceData && performanceData && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p>Render Time</p>
                  <p className="font-mono">{performanceMetrics.renderTime.toFixed(2)}ms</p>
                </div>
                <div>
                  <p>Memory Usage</p>
                  <p className="font-mono">{performanceMetrics.memoryUsage.toFixed(2)}MB</p>
                </div>
                <div>
                  <p>Connection</p>
                  <p className="font-mono">{deviceCapabilities.connectionType}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderControls = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Demo Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={demoMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemoMode('calendar')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Full Calendar
            </Button>
            <Button
              variant={demoMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemoMode('month')}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Month View
            </Button>
            <Button
              variant={demoMode === 'components' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemoMode('components')}
            >
              <Touch className="h-4 w-4 mr-2" />
              Components
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="accessibility"
                checked={enableA11y}
                onCheckedChange={setEnableA11y}
              />
              <label htmlFor="accessibility" className="text-sm font-medium">
                <Accessibility className="h-4 w-4 inline mr-1" />
                Accessibility
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="touch-optimization"
                checked={enableTouch}
                onCheckedChange={setEnableTouch}
              />
              <label htmlFor="touch-optimization" className="text-sm font-medium">
                <Touch className="h-4 w-4 inline mr-1" />
                Touch Optimization
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="performance-data"
                checked={showPerformanceData}
                onCheckedChange={setShowPerformanceData}
              />
              <label htmlFor="performance-data" className="text-sm font-medium">
                <Zap className="h-4 w-4 inline mr-1" />
                Performance Data
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderKeyboardShortcuts = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Navigation</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">←→↑↓</kbd> Navigate dates</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Home</kbd> First day of period</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">End</kbd> Last day of period</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">PgUp/PgDn</kbd> Previous/Next period</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Actions</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+1-4</kbd> Change view mode</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+N</kbd> New event</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+T</kbd> Go to today</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">E</kbd> Edit selected event</li>
              <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Del</kbd> Delete event</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderComponentsDemo = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Touch-Optimized Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Regular Buttons</h4>
              <div className="flex gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Touch-Optimized Buttons</h4>
              <div className="flex gap-2">
                <TouchOptimizedButton size="sm" touchTarget="normal">
                  Normal Touch
                </TouchOptimizedButton>
                <TouchOptimizedButton size="md" touchTarget="large">
                  Large Touch
                </TouchOptimizedButton>
                <TouchOptimizedButton size="lg" touchTarget="large">
                  Extra Large
                </TouchOptimizedButton>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Button Variants</h4>
              <div className="flex flex-wrap gap-2">
                <TouchOptimizedButton variant="default">Default</TouchOptimizedButton>
                <TouchOptimizedButton variant="ghost">Ghost</TouchOptimizedButton>
                <TouchOptimizedButton variant="outline">Outline</TouchOptimizedButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsive Layout Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium">Auto-adapting Grid</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h5 className="font-medium mb-2">Mobile First</h5>
                <p className="text-sm text-muted-foreground">
                  This layout stacks on mobile and expands on larger screens.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h5 className="font-medium mb-2">Touch Friendly</h5>
                <p className="text-sm text-muted-foreground">
                  All interactive elements have minimum touch target sizes.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h5 className="font-medium mb-2">Accessible</h5>
                <p className="text-sm text-muted-foreground">
                  Full keyboard navigation and screen reader support.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDemo = () => {
    switch (demoMode) {
      case 'calendar':
        return (
          <ResponsiveCalendar
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            onEventCreate={handleEventCreate}
            onEventSelect={handleEventSelect}
            onSettings={handleSettings}
          />
        );
      case 'month':
        return (
          <div className="border rounded-lg overflow-hidden">
            <ResponsiveMonthView
              onEventEdit={handleEventEdit}
              onEventDelete={handleEventDelete}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
              compactMode={optimizedConfig.compactLayout}
            />
          </div>
        );
      case 'components':
        return renderComponentsDemo();
      default:
        return null;
    }
  };

  return (
    <ResponsiveLayout className="min-h-screen p-4" touchOptimized={enableTouch}>
      {/* Performance Monitor */}
      <PerformanceMonitor
        enabled={showPerformanceData}
        onPerformanceData={handlePerformanceData}
      />

      <div className="max-w-7xl mx-auto space-y-4">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold mb-2">
            Responsive Calendar Demo
          </h1>
          <p className="text-muted-foreground">
            Interactive demo showcasing mobile responsiveness and accessibility features
          </p>
        </div>

        {renderDeviceInfo()}
        {renderControls()}
        {enableA11y && renderKeyboardShortcuts()}

        <CalendarProvider>
          <KeyboardNavigationProvider
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            onEventCreate={handleEventCreate}
            onEventSelect={handleEventSelect}
            enableShortcuts={enableA11y}
          >
            <div className="border rounded-lg overflow-hidden bg-background">
              {renderDemo()}
            </div>
          </KeyboardNavigationProvider>
        </CalendarProvider>

        {/* Accessibility Information */}
        {enableA11y && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Screen Reader Support</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• ARIA labels for all calendar elements</li>
                    <li>• Live region announcements</li>
                    <li>• Semantic HTML structure</li>
                    <li>• Screen reader navigation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Keyboard Navigation</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Full keyboard accessibility</li>
                    <li>• Focus management</li>
                    <li>• Keyboard shortcuts</li>
                    <li>• Tab navigation support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Visual Accessibility</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• High contrast support</li>
                    <li>• Focus indicators</li>
                    <li>• Reduced motion respect</li>
                    <li>• Color blind friendly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default ResponsiveDemoPage;