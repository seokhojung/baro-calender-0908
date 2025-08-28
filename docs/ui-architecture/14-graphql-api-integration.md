# 🔌 **8b. GraphQL API Integration**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - GraphQL API 통합

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **GraphQL API 설계 및 클라이언트 통합** 아키텍처를 정의합니다. 타입 안전성, 효율적인 데이터 페칭, 최적화된 캐싱 전략을 통해 고성능 API 통합을 구현합니다.

---

## 📊 **GraphQL 스키마 정의**

### **기본 타입 정의**
```typescript
// src/lib/graphql/schema.ts
import { gql } from '@apollo/client'

// 타입 정의
export const typeDefs = gql`
  scalar DateTime
  scalar JSON
  
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    timezone: String!
    language: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    projects: [Project!]!
    events: [Event!]!
  }
  
  type Project {
    id: ID!
    name: String!
    description: String
    color: String!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    owner: User!
    members: [ProjectMember!]!
    events: [Event!]!
  }
  
  type ProjectMember {
    id: ID!
    project: Project!
    user: User!
    role: ProjectRole!
    joinedAt: DateTime!
  }
  
  enum ProjectRole {
    OWNER
    ADMIN
    MEMBER
    VIEWER
  }
  
  type Event {
    id: ID!
    title: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    allDay: Boolean!
    location: String
    project: Project
    attendees: [EventAttendee!]!
    recurring: RecurringRule
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type EventAttendee {
    id: ID!
    event: Event!
    user: User!
    status: AttendanceStatus!
    responseAt: DateTime
  }
  
  enum AttendanceStatus {
    PENDING
    ACCEPTED
    DECLINED
    TENTATIVE
  }
  
  type RecurringRule {
    id: ID!
    frequency: RecurringFrequency!
    interval: Int!
    endDate: DateTime
    count: Int
    daysOfWeek: [Int!]
    daysOfMonth: [Int!]
    monthsOfYear: [Int!]
  }
  
  enum RecurringFrequency {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
  }
`
```

### **Query/Mutation/Subscription 정의**
```typescript
export const operations = gql`
  type Query {
    # 사용자 관련
    me: User
    user(id: ID!): User
    
    # 프로젝트 관련
    projects: [Project!]!
    project(id: ID!): Project
    myProjects: [Project!]!
    
    # 이벤트 관련
    events(
      startDate: DateTime!
      endDate: DateTime!
      projectIds: [ID!]
      userIds: [ID!]
    ): [Event!]!
    event(id: ID!): Event
    
    # 검색
    searchEvents(query: String!): [Event!]!
    searchProjects(query: String!): [Project!]!
  }
  
  type Mutation {
    # 사용자 관련
    updateProfile(input: UpdateProfileInput!): User!
    
    # 프로젝트 관련
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    addProjectMember(projectId: ID!, input: AddMemberInput!): ProjectMember!
    removeProjectMember(projectId: ID!, userId: ID!): Boolean!
    
    # 이벤트 관련
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    respondToEvent(eventId: ID!, status: AttendanceStatus!): EventAttendee!
  }
  
  type Subscription {
    # 실시간 업데이트
    eventUpdated(projectId: ID!): Event!
    projectUpdated: Project!
    userJoinedProject(projectId: ID!): ProjectMember!
  }
`
```

### **입력 타입 정의**
```typescript
export const inputTypes = gql`
  # 입력 타입들
  input UpdateProfileInput {
    name: String
    timezone: String
    language: String
    avatar: String
  }
  
  input CreateProjectInput {
    name: String!
    description: String
    color: String!
    isPublic: Boolean!
  }
  
  input UpdateProjectInput {
    name: String
    description: String
    color: String
    isPublic: Boolean
  }
  
  input AddMemberInput {
    userId: ID!
    role: ProjectRole!
  }
  
  input CreateEventInput {
    title: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    allDay: Boolean!
    location: String
    projectId: ID
    attendeeIds: [ID!]
    recurring: RecurringRuleInput
  }
  
  input UpdateEventInput {
    title: String
    description: String
    startDate: DateTime
    endDate: DateTime
    allDay: Boolean
    location: String
    projectId: ID
    attendeeIds: [ID!]
    recurring: RecurringRuleInput
  }
  
  input RecurringRuleInput {
    frequency: RecurringFrequency!
    interval: Int!
    endDate: DateTime
    count: Int
    daysOfWeek: [Int!]
    daysOfMonth: [Int!]
    monthsOfYear: [Int!]
  }
`
```

---

## 🔧 **GraphQL 클라이언트 설정**

### **Apollo Client 구성**
```typescript
// src/lib/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'
import { BatchHttpLink } from '@apollo/client/link/batch-http'

// HTTP 링크 설정
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
})

// 배치 HTTP 링크 (여러 요청을 하나로 묶어서 전송)
const batchHttpLink = new BatchHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  batchMax: 5, // 최대 5개 요청을 묶음
  batchInterval: 20, // 20ms 대기
})

// 인증 헤더 추가
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth-token')
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// 에러 처리
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
      
      // 인증 에러 처리
      if (message.includes('Unauthorized') || message.includes('Forbidden')) {
        // 토큰 갱신 또는 로그아웃
        localStorage.removeItem('auth-token')
        window.location.href = '/login'
      }
    })
  }
  
  if (networkError) {
    console.error('Network error:', networkError)
    
    // 네트워크 에러 시 재시도 (런타임 타입 가드 적용)
    if ('statusCode' in networkError && networkError.statusCode === 500) {
      return forward(operation)
    }
  }
})

// 재시도 링크
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // 특정 에러만 재시도 (런타임 타입 가드 적용)
      return !!error && 'statusCode' in error && error.statusCode >= 500
    },
  },
})
```

### **캐시 설정**
```typescript
// 캐시 설정
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        events: {
          keyArgs: ['startDate', 'endDate', 'projectIds', 'userIds'],
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          },
        },
        projects: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          },
        },
      },
    },
    Event: {
      keyFields: ['id'],
      fields: {
        attendees: {
          merge(existing = [], incoming) {
            return incoming
          },
        },
      },
    },
    Project: {
      keyFields: ['id'],
      fields: {
        members: {
          merge(existing = [], incoming) {
            return incoming
          },
        },
        events: {
          merge(existing = [], incoming) {
            return incoming
          },
        },
      },
    },
  },
})

// Apollo 클라이언트 생성
export const client = new ApolloClient({
  link: from([
    errorLink,
    retryLink,
    authLink,
    batchHttpLink,
  ]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
})
```

---

## 🎣 **GraphQL Hooks & Queries**

### **사용자 관련 Hooks**
```typescript
// src/hooks/graphql/useUser.ts
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      avatar
      timezone
      language
      projects {
        id
        name
        color
      }
    }
  }
`

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      timezone
      language
      avatar
    }
  }
`

export const useMe = () => {
  return useQuery(GET_ME)
}

export const useUpdateProfile = () => {
  return useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_ME }],
  })
}
```

### **이벤트 관련 Hooks**
```typescript
// src/hooks/graphql/useEvents.ts
export const GET_EVENTS = gql`
  query GetEvents(
    $startDate: DateTime!
    $endDate: DateTime!
    $projectIds: [ID!]
    $userIds: [ID!]
  ) {
    events(
      startDate: $startDate
      endDate: $endDate
      projectIds: $projectIds
      userIds: $userIds
    ) {
      id
      title
      description
      startDate
      endDate
      allDay
      location
      project {
        id
        name
        color
      }
      attendees {
        user {
          id
          name
          avatar
        }
        status
      }
      recurring {
        frequency
        interval
      }
    }
  }
`

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      startDate
      endDate
    }
  }
`

export const useEvents = (variables: any) => {
  return useQuery(GET_EVENTS, {
    variables,
    fetchPolicy: 'cache-and-network',
  })
}

export const useCreateEvent = () => {
  return useMutation(CREATE_EVENT, {
    update(cache, { data: { createEvent } }) {
      // 캐시 업데이트
      const existing = cache.readQuery({
        query: GET_EVENTS,
        variables: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      })
      
      if (existing) {
        cache.writeQuery({
          query: GET_EVENTS,
          variables: {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          },
          data: {
            events: [...existing.events, createEvent],
          },
        })
      }
    },
  })
}
```

### **프로젝트 관련 Hooks**
```typescript
// src/hooks/graphql/useProjects.ts
export const GET_PROJECTS = gql`
  query GetProjects {
    myProjects {
      id
      name
      description
      color
      isPublic
      owner {
        id
        name
      }
      members {
        user {
          id
          name
          avatar
        }
        role
      }
    }
  }
`

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      color
    }
  }
`

export const useProjects = () => {
  return useQuery(GET_PROJECTS)
}

export const useCreateProject = () => {
  return useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
  })
}
```

---

## 🚀 **최적화 전략**

### **쿼리 최적화**
```typescript
// Fragment 재사용
export const EVENT_FRAGMENT = gql`
  fragment EventDetails on Event {
    id
    title
    description
    startDate
    endDate
    allDay
    location
  }
`

// Fragment 사용
export const GET_EVENT_WITH_DETAILS = gql`
  ${EVENT_FRAGMENT}
  query GetEvent($id: ID!) {
    event(id: $id) {
      ...EventDetails
      project {
        id
        name
        color
      }
      attendees {
        user {
          id
          name
        }
        status
      }
    }
  }
`
```

### **Persisted Queries**
```typescript
// APQ (Automatic Persisted Queries) 설정
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { sha256 } from 'crypto-hash'

const persistedQueriesLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,
})
```

---

## 📋 **요약**

이 문서는 바로캘린더의 GraphQL API 통합을 정의합니다:

### **🔧 API 설계**
- **타입 안전성**: TypeScript와 GraphQL 코드 생성
- **스키마 정의**: 명확한 타입과 관계 정의
- **효율적 쿼리**: Fragment와 배치 처리

### **⚡ 최적화**
- **캐싱 전략**: InMemoryCache와 타입 정책
- **배치 요청**: 여러 쿼리를 하나로 묶음
- **에러 처리**: 재시도 로직과 에러 복구

### **🎣 개발자 경험**
- **Custom Hooks**: 재사용 가능한 쿼리/뮤테이션
- **자동 완성**: TypeScript 타입 추론
- **개발 도구**: Apollo DevTools 지원