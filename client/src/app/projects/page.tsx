'use client';

import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ProjectManagement } from '@/components/project';
import { ProjectRealtimeProvider } from '@/components/providers/ProjectRealtimeProvider';

export default function ProjectsPage() {
  return (
    <ProjectRealtimeProvider enabled={true} showNotifications={true}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">프로젝트 관리</h1>
            <p className="text-muted-foreground">
              프로젝트를 생성하고 관리하여 일정을 체계적으로 구성하세요.
            </p>
          </div>
          
          <ProjectManagement />
        </div>
        
        <Toaster />
      </div>
    </ProjectRealtimeProvider>
  );
}