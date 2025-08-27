/**
 * GraphQL Server Configuration
 * Apollo Server setup with enterprise features
 */

import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { applyMiddleware } from 'graphql-middleware'
import { shield, rule, and, or } from 'graphql-shield'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { typeDefs } from './schema'
import resolvers from './resolvers'
import { createContext, authenticateContext, AuthenticatedContext } from './context'
import { GraphQLError } from 'graphql'

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 1000, // Number of requests
  duration: 60, // Per 60 seconds
})

// Authentication rules
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context: AuthenticatedContext) => {
    return !!context.user
  }
)

const _isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, context: AuthenticatedContext) => {
    return context.user?.role === 'TENANT_ADMIN' || context.user?.role === 'SUPER_ADMIN'
  }
)

const _isSuperAdmin = rule({ cache: 'contextual' })(
  async (parent, args, context: AuthenticatedContext) => {
    return context.user?.role === 'SUPER_ADMIN'
  }
)

const hasPermission = (permission: string) =>
  rule({ cache: 'contextual' })(
    async (parent, args, context: AuthenticatedContext) => {
      return (
        context.user?.permissions.includes(permission) ||
        context.user?.role === 'SUPER_ADMIN'
      )
    }
  )

// Permission shield
const _permissions = shield(
  {
    Query: {
      tenant: isAuthenticated,
      asset: and(isAuthenticated, hasPermission('assets:read')),
      assets: and(isAuthenticated, hasPermission('assets:read')),
      user: and(isAuthenticated, hasPermission('users:read')),
      users: and(isAuthenticated, hasPermission('users:read')),
      integration: and(isAuthenticated, hasPermission('integrations:read')),
      integrations: and(isAuthenticated, hasPermission('integrations:read')),
      webhook: and(isAuthenticated, hasPermission('webhooks:read')),
      webhooks: and(isAuthenticated, hasPermission('webhooks:read')),
      assetAnalytics: and(isAuthenticated, hasPermission('analytics:read')),
      search: isAuthenticated,
    },
    Mutation: {
      createAsset: and(isAuthenticated, hasPermission('assets:create')),
      updateAsset: and(isAuthenticated, hasPermission('assets:update')),
      deleteAsset: and(isAuthenticated, hasPermission('assets:delete')),
      createIntegration: and(isAuthenticated, hasPermission('integrations:create')),
      updateIntegration: and(isAuthenticated, hasPermission('integrations:update')),
      deleteIntegration: and(isAuthenticated, hasPermission('integrations:delete')),
      triggerSync: and(isAuthenticated, hasPermission('integrations:execute')),
      createWebhook: and(isAuthenticated, hasPermission('webhooks:create')),
      updateWebhook: and(isAuthenticated, hasPermission('webhooks:update')),
      deleteWebhook: and(isAuthenticated, hasPermission('webhooks:delete')),
      testWebhook: and(isAuthenticated, hasPermission('webhooks:test')),
      bulkCreateAssets: and(isAuthenticated, hasPermission('assets:bulk_create')),
      bulkUpdateAssets: and(isAuthenticated, hasPermission('assets:bulk_update')),
      bulkDeleteAssets: and(isAuthenticated, hasPermission('assets:bulk_delete')),
    },
  },
  {
    allowExternalErrors: true,
    fallbackError: new GraphQLError('Access denied', {
      extensions: { code: 'FORBIDDEN' },
    }),
  }
)

// Rate limiting middleware
const rateLimitMiddleware = async (resolve: Record<string, unknown>, root: Record<string, unknown>, args: Record<string, unknown>, context: Record<string, unknown>, info: Record<string, unknown>) => {
  try {
    const key = (context as any).user?.id || (context as any).req?.ip || 'anonymous'
    await rateLimiter.consume(key)
    return (resolve as any)(root, args, context, info)
  } catch (rejRes: Record<string, unknown>) {
    throw new GraphQLError('Rate limit exceeded', {
      extensions: {
        code: 'RATE_LIMITED',
        retryAfter: Math.round((rejRes?.msBeforeNext || 60000) / 1000),
      },
    })
  }
}

// Create executable schema with middleware
const schema = applyMiddleware(
  makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
  permissions,
  rateLimitMiddleware as any
)

// Apollo Server configuration
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    // Request logging
    {
      async requestDidStart() {
        return {
          async didResolveOperation(requestContext: Record<string, unknown>) {
            console.log(`GraphQL Operation: ${requestContext.request.operationName}`)
          },
          async didEncounterErrors(requestContext: Record<string, unknown>) {
            console.error('GraphQL Errors:', requestContext.errors)
          },
        }
      },
    },
    // Performance monitoring
    {
      async requestDidStart() {
        return {
          async willSendResponse(requestContext: Record<string, unknown>) {
            const startTime = requestContext.request.http?.startTime || Date.now()
            const duration = Date.now() - startTime
            if (duration > 1000) {
              console.warn(`Slow GraphQL query: ${duration}ms`, {
                operation: requestContext.request.operationName,
                variables: requestContext.request.variables,
              })
            }
          },
        }
      },
    },
  ],
  formatError: (error) => {
    // Log error details
    console.error('GraphQL Error:', {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: error.extensions,
    })

    // Return sanitized error for production
    if (process.env.NODE_ENV === 'production') {
      // Don't expose internal errors in production
      if (error.extensions?.code === 'INTERNAL_ERROR') {
        return new GraphQLError('Internal server error', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    }

    return error
  },
})

// Create Next.js handler
export const handler = startServerAndCreateNextHandler(server, {
  context: async (req: Record<string, unknown>) => {
    const baseContext = await createContext(req)
    
    try {
      // Try to authenticate the request
      const authenticatedContext = await authenticateContext(baseContext)
      return authenticatedContext
    } catch (_error) {
      // Return base context for public operations
      return baseContext
    }
  },
})

export { server }