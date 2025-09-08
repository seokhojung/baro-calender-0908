"use client";

import React, { useState, useEffect } from 'react';
import { TouchOptimizedButton, ResponsiveLayout } from '@/components/ui/responsive-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Monitor, 
  Accessibility, 
  Keyboard, 
  Zap,
  Info
} from 'lucide-react';

const ResponsiveTestPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    screenWidth: 0,
    screenHeight: 0,
    touchSupport: false,
    userAgent: '',
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setDeviceInfo({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        touchSupport: 'ontouchstart' in window,
        userAgent: navigator.userAgent,
      });
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ResponsiveLayout className="min-h-screen p-4" touchOptimized={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Stage 6: Responsive & Accessibility Implementation
          </h1>
          <p className="text-muted-foreground">
            Testing mobile responsiveness and accessibility features
          </p>
        </div>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Screen Size</p>
                <p className="text-muted-foreground">
                  {deviceInfo.screenWidth} × {deviceInfo.screenHeight}
                </p>
              </div>
              <div>
                <p className="font-medium">Device Type</p>
                <Badge variant={isMobile ? "default" : "outline"}>
                  {isMobile ? 'Mobile' : 'Desktop'}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Touch Support</p>
                <Badge variant={deviceInfo.touchSupport ? "default" : "outline"}>
                  {deviceInfo.touchSupport ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Breakpoint</p>
                <Badge variant="outline">
                  {deviceInfo.screenWidth < 375 ? 'xs' :
                   deviceInfo.screenWidth < 640 ? 'sm' :
                   deviceInfo.screenWidth < 768 ? 'md' :
                   deviceInfo.screenWidth < 1024 ? 'lg' :
                   deviceInfo.screenWidth < 1280 ? 'xl' : '2xl'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Touch-Optimized Buttons Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Touch-Optimized Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* Button Comparison */}
              <div>
                <h4 className="font-medium mb-3">Button Size Comparison</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Regular Buttons</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">Small</Button>
                      <Button>Default</Button>
                      <Button size="lg">Large</Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Touch-Optimized</p>
                    <div className="flex flex-wrap gap-2">
                      <TouchOptimizedButton size="sm" touchTarget="normal">
                        Touch SM
                      </TouchOptimizedButton>
                      <TouchOptimizedButton size="md" touchTarget="large">
                        Touch MD
                      </TouchOptimizedButton>
                      <TouchOptimizedButton size="lg" touchTarget="large">
                        Touch LG
                      </TouchOptimizedButton>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsive Grid */}
              <div>
                <h4 className="font-medium mb-3">Responsive Grid</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Feature {item}</h5>
                      <p className="text-sm text-muted-foreground">
                        This grid adapts from 1 column on mobile to 3 columns on desktop.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Keyboard Navigation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Accessibility Features Implemented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <h4 className="font-medium mb-3">Touch & Mobile</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Minimum 44px touch targets</li>
                  <li>• Swipe navigation support</li>
                  <li>• Touch-optimized interactions</li>
                  <li>• Responsive breakpoints</li>
                  <li>• Mobile-first design</li>
                  <li>• Safe area handling</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">Accessibility</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full keyboard navigation</li>
                  <li>• ARIA labels everywhere</li>
                  <li>• Screen reader support</li>
                  <li>• Focus management</li>
                  <li>• Live region announcements</li>
                  <li>• High contrast support</li>
                </ul>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Implementation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Stage 6 Implementation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">
                    Mobile Responsiveness
                  </h5>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✅ Touch gestures, responsive layouts, mobile-optimized components
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Accessibility
                  </h5>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ✅ WCAG compliance, keyboard navigation, screen reader support
                  </p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Performance
                  </h5>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    ✅ Mobile optimizations, device detection, memory management
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Files Created/Modified:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <code>useTouchGestures.ts</code> - Touch gesture handling</p>
                  <p>• <code>useAccessibility.ts</code> - Accessibility utilities</p>
                  <p>• <code>ResponsiveCalendar.tsx</code> - Mobile-responsive calendar</p>
                  <p>• <code>ResponsiveMonthView.tsx</code> - Touch-optimized month view</p>
                  <p>• <code>responsive-layout.tsx</code> - Layout components</p>
                  <p>• <code>mobile-performance.ts</code> - Performance optimizations</p>
                  <p>• <code>KeyboardNavigationProvider.tsx</code> - Keyboard navigation</p>
                  <p>• <code>tailwind.config.js</code> - Enhanced with accessibility utilities</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </ResponsiveLayout>
  );
};

export default ResponsiveTestPage;