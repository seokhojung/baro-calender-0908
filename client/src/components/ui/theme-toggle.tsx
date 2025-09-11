"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useThemeStore } from "@/stores/themeStore"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      case 'system':
        return <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getIcon()}
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setMode("light")}>
          <Sun className="mr-2 h-4 w-4" />
          라이트
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          다크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          시스템
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SimpleThemeToggle() {
  const { mode, setMode } = useThemeStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const toggleTheme = () => {
    if (mode === 'light') {
      setMode('dark')
    } else if (mode === 'dark') {
      setMode('system')
    } else {
      setMode('light')
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="transition-all duration-300"
    >
      {mode === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-project-yellow-500" />
      ) : mode === 'light' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-project-blue-600" />
      ) : (
        <Monitor className="h-[1.2rem] w-[1.2rem] text-project-purple-600" />
      )}
      <span className="sr-only">테마 변경</span>
    </Button>
  )
}