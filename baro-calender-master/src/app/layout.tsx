import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CalendarProvider } from "@/contexts/CalendarContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baro Calendar",
  description: "프로젝트 일정 관리 캘린더",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <CalendarProvider>
          {children}
        </CalendarProvider>
      </body>
    </html>
  );
}
