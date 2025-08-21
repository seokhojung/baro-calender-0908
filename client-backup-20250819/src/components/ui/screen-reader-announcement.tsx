"use client";

import React, { useEffect, useState } from 'react';

interface ScreenReaderAnnouncementProps {
  message: string | null;
  onAnnouncementComplete?: () => void;
}

export default function ScreenReaderAnnouncement({ 
  message, 
  onAnnouncementComplete 
}: ScreenReaderAnnouncementProps) {
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // 3초 후 알림 제거
      const timer = setTimeout(() => {
        setAnnouncement(null);
        onAnnouncementComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, onAnnouncementComplete]);

  if (!announcement) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
      aria-label="캘린더 상태 변경 알림"
    >
      {announcement}
    </div>
  );
}
