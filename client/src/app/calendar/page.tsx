import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Metadata } from 'next'

// Dynamic import to ensure client-side only rendering for DnD
const CalendarContainer = dynamic(
  () => import('@/components/calendar/CalendarContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
)

export const metadata: Metadata = {
  title: '캘린더 - 바로캘린더',
  description: '프로젝트 기반 스케줄 관리 시스템',
}

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">캘린더를 불러오는 중...</p>
              </div>
            </div>
          }
        >
          <CalendarContainer />
        </Suspense>
      </main>
    </div>
  )
}