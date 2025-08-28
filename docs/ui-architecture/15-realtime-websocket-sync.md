# 🔄 **8c. Realtime WebSocket Synchronization**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 실시간 WebSocket 동기화

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **실시간 데이터 동기화 및 WebSocket 구현** 아키텍처를 정의합니다. WebSocket을 통한 실시간 이벤트 업데이트, 자동 재연결, 메시지 큐잉을 통해 안정적인 실시간 협업 기능을 제공합니다.

---

## 🔌 **WebSocket 연결 관리**

### **WebSocket Manager 클래스**
```typescript
// src/lib/realtime/websocket.ts
interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  id: string
}

interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnected = false
  
  constructor(private config: WebSocketConfig) {}
  
  connect() {
    try {
      this.ws = new WebSocket(this.config.url)
      
      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.config.onConnect?.()
        
        // 큐에 있는 메시지들 전송
        this.flushMessageQueue()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.config.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      this.ws.onclose = () => {
        this.isConnected = false
        this.config.onDisconnect?.()
        this.scheduleReconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.config.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.scheduleReconnect()
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
  
  send(message: Omit<WebSocketMessage, 'timestamp' | 'id'>) {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    }
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      // 연결이 끊어진 경우 큐에 저장
      this.messageQueue.push(fullMessage)
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    const interval = this.config.reconnectInterval || 1000
    const delay = interval * Math.pow(2, this.reconnectAttempts)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }
  
  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }
  
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}
```

---

## 🔄 **실시간 이벤트 동기화**

### **RealtimeEventSync 클래스**
```typescript
// src/lib/realtime/eventSync.ts
export class RealtimeEventSync {
  private wsManager: WebSocketManager
  
  constructor() {
    this.wsManager = new WebSocketManager({
      url: process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:4000',
      onMessage: this.handleMessage.bind(this),
      onConnect: this.handleConnect.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
    })
  }
  
  connect() {
    this.wsManager.connect()
  }
  
  disconnect() {
    this.wsManager.disconnect()
  }
  
  subscribeToProject(projectId: string) {
    this.wsManager.send({
      type: 'SUBSCRIBE_PROJECT',
      payload: { projectId },
    })
  }
  
  unsubscribeFromProject(projectId: string) {
    this.wsManager.send({
      type: 'UNSUBSCRIBE_PROJECT',
      payload: { projectId },
    })
  }
  
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'EVENT_CREATED':
        this.handleEventCreated(message.payload)
        break
      case 'EVENT_UPDATED':
        this.handleEventUpdated(message.payload)
        break
      case 'EVENT_DELETED':
        this.handleEventDeleted(message.payload)
        break
      case 'PROJECT_UPDATED':
        this.handleProjectUpdated(message.payload)
        break
      case 'USER_JOINED_PROJECT':
        this.handleUserJoinedProject(message.payload)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }
  
  private handleConnect() {
    console.log('Realtime connection established')
    
    // 현재 프로젝트에 구독
    const currentProject = useProjectStore.getState().selectedProject
    if (currentProject) {
      this.subscribeToProject(currentProject.id)
    }
  }
  
  private handleDisconnect() {
    console.log('Realtime connection lost')
  }
  
  private handleEventCreated(event: any) {
    // Zustand 스토어 업데이트
    useCalendarStore.getState().addEvent(event)
    
    // 사용자에게 알림
    toast.success('새로운 이벤트가 생성되었습니다')
  }
  
  private handleEventUpdated(event: any) {
    // Zustand 스토어 업데이트
    useCalendarStore.getState().updateEvent(event.id, event)
    
    // 사용자에게 알림
    toast.info('이벤트가 업데이트되었습니다')
  }
  
  private handleEventDeleted(eventId: string) {
    // Zustand 스토어 업데이트
    useCalendarStore.getState().deleteEvent(eventId)
    
    // 사용자에게 알림
    toast.warning('이벤트가 삭제되었습니다')
  }
  
  private handleProjectUpdated(project: any) {
    // Zustand 스토어 업데이트
    useProjectStore.getState().updateProject(project.id, project)
  }
  
  private handleUserJoinedProject(data: any) {
    // Zustand 스토어 업데이트
    useProjectStore.getState().fetchMembers(data.projectId)
    
    // 사용자에게 알림
    toast.success(`${data.user.name}님이 프로젝트에 참여했습니다`)
  }
}
```

---

## 🎣 **실시간 동기화 Hook**

### **useRealtimeSync Hook**
```typescript
// src/hooks/useRealtimeSync.ts
export const useRealtimeSync = () => {
  const [isConnected, setIsConnected] = useState(false)
  const realtimeSync = useRef<RealtimeEventSync | null>(null)
  
  useEffect(() => {
    realtimeSync.current = new RealtimeEventSync()
    realtimeSync.current.connect()
    
    return () => {
      realtimeSync.current?.disconnect()
    }
  }, [])
  
  const subscribeToProject = useCallback((projectId: string) => {
    realtimeSync.current?.subscribeToProject(projectId)
  }, [])
  
  const unsubscribeFromProject = useCallback((projectId: string) => {
    realtimeSync.current?.unsubscribeFromProject(projectId)
  }, [])
  
  return {
    isConnected,
    subscribeToProject,
    unsubscribeFromProject,
  }
}
```

### **프로젝트 구독 관리**
```typescript
// src/hooks/useProjectSubscription.ts
export const useProjectSubscription = (projectId?: string) => {
  const { subscribeToProject, unsubscribeFromProject } = useRealtimeSync()
  
  useEffect(() => {
    if (!projectId) return
    
    // 프로젝트 구독
    subscribeToProject(projectId)
    
    // cleanup: 구독 해제
    return () => {
      unsubscribeFromProject(projectId)
    }
  }, [projectId, subscribeToProject, unsubscribeFromProject])
}
```

---

## 💬 **실시간 협업 기능**

### **실시간 커서 추적**
```typescript
// src/lib/realtime/collaboration.ts
interface CursorPosition {
  userId: string
  x: number
  y: number
  elementId?: string
}

export class CollaborationManager {
  private wsManager: WebSocketManager
  private cursors = new Map<string, CursorPosition>()
  
  constructor() {
    this.wsManager = new WebSocketManager({
      url: process.env.NEXT_PUBLIC_COLLAB_WS_ENDPOINT || 'ws://localhost:4001',
      onMessage: this.handleCollaborationMessage.bind(this),
    })
  }
  
  sendCursorPosition(position: Omit<CursorPosition, 'userId'>) {
    this.wsManager.send({
      type: 'CURSOR_MOVE',
      payload: position,
    })
  }
  
  sendSelection(elementId: string, selection: any) {
    this.wsManager.send({
      type: 'ELEMENT_SELECT',
      payload: { elementId, selection },
    })
  }
  
  sendTyping(elementId: string, isTyping: boolean) {
    this.wsManager.send({
      type: 'USER_TYPING',
      payload: { elementId, isTyping },
    })
  }
  
  private handleCollaborationMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'CURSOR_UPDATE':
        this.updateCursor(message.payload)
        break
      case 'USER_TYPING':
        this.handleUserTyping(message.payload)
        break
      case 'ELEMENT_SELECTED':
        this.handleElementSelected(message.payload)
        break
    }
  }
  
  private updateCursor(cursor: CursorPosition) {
    this.cursors.set(cursor.userId, cursor)
    // UI 업데이트 트리거
    window.dispatchEvent(new CustomEvent('cursor-update', { detail: cursor }))
  }
  
  private handleUserTyping(data: any) {
    window.dispatchEvent(new CustomEvent('user-typing', { detail: data }))
  }
  
  private handleElementSelected(data: any) {
    window.dispatchEvent(new CustomEvent('element-selected', { detail: data }))
  }
  
  getCursors() {
    return Array.from(this.cursors.values())
  }
}
```

### **실시간 협업 컴포넌트**
```typescript
// src/components/collaboration/RealtimeCursors.tsx
export const RealtimeCursors = () => {
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const collaborationManager = useRef<CollaborationManager | null>(null)
  
  useEffect(() => {
    collaborationManager.current = new CollaborationManager()
    
    const handleCursorUpdate = (event: CustomEvent) => {
      setCursors(collaborationManager.current?.getCursors() || [])
    }
    
    window.addEventListener('cursor-update', handleCursorUpdate as EventListener)
    
    return () => {
      window.removeEventListener('cursor-update', handleCursorUpdate as EventListener)
    }
  }, [])
  
  // 마우스 움직임 추적
  useEffect(() => {
    const handleMouseMove = throttle((event: MouseEvent) => {
      collaborationManager.current?.sendCursorPosition({
        x: event.clientX,
        y: event.clientY,
      })
    }, 50)
    
    document.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  return (
    <>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="realtime-cursor"
          style={{
            position: 'fixed',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div className="cursor-pointer" />
          <div className="cursor-label">
            User {cursor.userId.slice(0, 4)}
          </div>
        </div>
      ))}
    </>
  )
}
```

---

## 📊 **연결 상태 표시**

### **연결 상태 컴포넌트**
```typescript
// src/components/realtime/ConnectionStatus.tsx
export const ConnectionStatus = () => {
  const { isConnected } = useRealtimeSync()
  const [showReconnecting, setShowReconnecting] = useState(false)
  
  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => setShowReconnecting(true), 1000)
      return () => clearTimeout(timer)
    } else {
      setShowReconnecting(false)
    }
  }, [isConnected])
  
  if (isConnected) {
    return (
      <div className="connection-status connected">
        <div className="status-indicator" />
        <span>실시간 동기화 활성</span>
      </div>
    )
  }
  
  if (showReconnecting) {
    return (
      <div className="connection-status reconnecting">
        <div className="status-indicator pulse" />
        <span>재연결 중...</span>
      </div>
    )
  }
  
  return null
}
```

---

## 🔐 **보안 고려사항**

### **인증 및 권한 검증**
```typescript
// WebSocket 인증
const authWebSocket = new WebSocketManager({
  url: `${WS_ENDPOINT}?token=${getAuthToken()}`,
  onConnect: () => {
    // 연결 시 인증 토큰 전송
    wsManager.send({
      type: 'AUTH',
      payload: { token: getAuthToken() },
    })
  },
})

// 메시지 권한 검증
const validateMessagePermission = (message: WebSocketMessage): boolean => {
  // 프로젝트 권한 확인
  const userProjects = getUserProjects()
  return userProjects.some(p => p.id === message.payload.projectId)
}
```

---

## 📋 **요약**

이 문서는 바로캘린더의 실시간 WebSocket 동기화를 정의합니다:

### **🔌 WebSocket 관리**
- **자동 재연결**: 네트워크 불안정 시 지수 백오프
- **메시지 큐잉**: 오프라인 시 메시지 저장 후 전송
- **연결 상태 관리**: 실시간 연결 상태 모니터링

### **🔄 실시간 동기화**
- **이벤트 업데이트**: 실시간 캘린더 이벤트 동기화
- **프로젝트 구독**: 선택적 프로젝트 업데이트 구독
- **상태 동기화**: Zustand 스토어와 자동 연동

### **💬 협업 기능**
- **실시간 커서**: 다른 사용자의 마우스 위치 표시
- **타이핑 인디케이터**: 실시간 입력 상태 표시
- **선택 동기화**: 요소 선택 상태 공유