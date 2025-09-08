import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// Create HTTP link
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// Auth link to add authentication token
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error link for handling GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      const errorType = extensions?.code || 'UNKNOWN_ERROR';
      
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}, Type: ${errorType}`
      );
      
      // Handle authentication errors
      if (errorType === 'UNAUTHENTICATED' || errorType === 'UNAUTHORIZED') {
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
        return;
      }
      
      // Handle validation errors
      if (errorType === 'BAD_USER_INPUT') {
        // These are usually form validation errors, don't log them
        return;
      }
      
      // Send error to monitoring service
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(new Error(`GraphQL Error: ${message}`), {
          tags: {
            errorType,
            operation: operation.operationName,
          },
          contexts: {
            graphql: {
              query: operation.query.loc?.source.body,
              variables: operation.variables,
              path,
            },
          },
        });
      }
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    
    // Send network errors to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(networkError, {
        tags: {
          errorType: 'NETWORK_ERROR',
          operation: operation.operationName,
        },
      });
    }
    
    // Handle specific network errors
    if ('statusCode' in networkError) {
      switch (networkError.statusCode) {
        case 401:
          localStorage.removeItem('auth-token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 500:
          console.error('Server error');
          break;
      }
    }
  }
});

// Retry link for handling transient failures
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // Retry network errors but not GraphQL errors
      return !!error && !('graphQLErrors' in error && error.graphQLErrors?.length);
    },
  },
});

// Create Apollo Client with cache configuration
const client = new ApolloClient({
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Calendar events pagination
          events: {
            keyArgs: ['filter', 'dateRange'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          
          // Projects
          projects: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
      
      Event: {
        keyFields: ['id'],
        fields: {
          startDate: {
            read(value) {
              return value ? new Date(value) : null;
            },
          },
          endDate: {
            read(value) {
              return value ? new Date(value) : null;
            },
          },
        },
      },
      
      Project: {
        keyFields: ['id'],
        fields: {
          createdAt: {
            read(value) {
              return value ? new Date(value) : null;
            },
          },
          updatedAt: {
            read(value) {
              return value ? new Date(value) : null;
            },
          },
        },
      },
      
      User: {
        keyFields: ['id'],
        fields: {
          preferences: {
            merge(existing, incoming) {
              return { ...existing, ...incoming };
            },
          },
        },
      },
    },
  }),
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
});

// Query and mutation helpers with optimistic updates
export const optimisticResponse = {
  createEvent: (variables: any) => ({
    __typename: 'Mutation',
    createEvent: {
      __typename: 'Event',
      id: `temp-${Date.now()}`,
      ...variables.input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
  
  updateEvent: (variables: any) => ({
    __typename: 'Mutation',
    updateEvent: {
      __typename: 'Event',
      id: variables.id,
      ...variables.input,
      updatedAt: new Date().toISOString(),
    },
  }),
  
  deleteEvent: (variables: any) => ({
    __typename: 'Mutation',
    deleteEvent: {
      __typename: 'Event',
      id: variables.id,
    },
  }),
};

// Cache update helpers
export const updateCache = {
  afterCreateEvent: (cache: any, { data }: any) => {
    if (!data?.createEvent) return;
    
    const newEvent = data.createEvent;
    
    // Update events query cache
    const cacheKey = { query: 'events' }; // This would be the actual query
    try {
      const existingEvents = cache.readQuery(cacheKey);
      if (existingEvents) {
        cache.writeQuery({
          ...cacheKey,
          data: {
            ...existingEvents,
            events: [...existingEvents.events, newEvent],
          },
        });
      }
    } catch (error) {
      // Query not in cache yet, ignore
    }
  },
  
  afterUpdateEvent: (cache: any, { data }: any) => {
    if (!data?.updateEvent) return;
    
    // The cache will automatically update due to id-based normalization
    const updatedEvent = data.updateEvent;
    cache.writeFragment({
      id: cache.identify(updatedEvent),
      fragment: gql`
        fragment UpdatedEvent on Event {
          id
          title
          description
          startDate
          endDate
          updatedAt
        }
      `,
      data: updatedEvent,
    });
  },
  
  afterDeleteEvent: (cache: any, { data }: any) => {
    if (!data?.deleteEvent) return;
    
    const deletedEvent = data.deleteEvent;
    cache.evict({
      id: cache.identify(deletedEvent),
    });
    cache.gc();
  },
};

// Prefetch common queries
export const prefetchQueries = {
  user: () => {
    if (typeof window !== 'undefined' && localStorage.getItem('auth-token')) {
      client.query({
        query: gql`
          query GetCurrentUser {
            me {
              id
              email
              name
              preferences {
                theme
                language
                timezone
              }
            }
          }
        `,
        fetchPolicy: 'cache-first',
      }).catch(err => {
        console.warn('Failed to prefetch user:', err);
      });
    }
  },
  
  projects: () => {
    client.query({
      query: gql`
        query GetProjects {
          projects {
            id
            name
            color
            isActive
          }
        }
      `,
      fetchPolicy: 'cache-first',
    }).catch(err => {
      console.warn('Failed to prefetch projects:', err);
    });
  },
};

// GraphQL fragments for reuse
import { gql } from '@apollo/client';

export const fragments = {
  EventFields: gql`
    fragment EventFields on Event {
      id
      title
      description
      startDate
      endDate
      allDay
      color
      category
      location
      createdAt
      updatedAt
    }
  `,
  
  ProjectFields: gql`
    fragment ProjectFields on Project {
      id
      name
      description
      color
      isActive
      createdAt
      updatedAt
      settings {
        defaultDuration
        defaultReminders
        allowOverlap
      }
    }
  `,
  
  UserFields: gql`
    fragment UserFields on User {
      id
      email
      name
      avatar
      timezone
      preferences {
        theme
        language
        dateFormat
        timeFormat
        weekStartsOn
        defaultView
        notifications {
          email
          browser
          mobile
        }
      }
    }
  `,
};

export default client;