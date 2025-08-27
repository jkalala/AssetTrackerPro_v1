/**
 * GraphQL Resolvers for Enterprise Asset Management Platform
 * Implements tenant-scoped data access with comprehensive error handling
 */

import { GraphQLResolveInfo } from 'graphql'
import { Context } from '../context'
import { assetResolvers } from './asset-resolvers'
import { userResolvers } from './user-resolvers'
import { integrationResolvers } from './integration-resolvers'
import { webhookResolvers } from './webhook-resolvers'
// import { analyticsResolvers } from './analytics-resolvers'
import { subscriptionResolvers } from './subscription-resolvers'
import { scalarResolvers } from './scalar-resolvers'

export interface ResolverContext extends Context {
  tenantId: string
  userId: string
  permissions: string[]
}

export const resolvers = {
  ...scalarResolvers,

  Query: {
    // Tenant Operations
    tenant: async (
      _: Record<string, unknown>,
      __: Record<string, unknown>,
      context: ResolverContext,
      ____info: GraphQLResolveInfo
    ) => {
      const { tenantService } = context
      return await tenantService.getTenant(context.tenantId)
    },

    // Asset Operations
    asset: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ____info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.getAsset(context.tenantId, id)
    },

    assets: async (
      _: Record<string, unknown>,
      args: {
        first?: number
        after?: string
        filter?: Record<string, unknown>
        sort?: Record<string, unknown>
      },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.getAssets(context.tenantId, args)
    },

    // User Operations
    user: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { userService } = context
      return await userService.getUser(context.tenantId, id)
    },

    users: async (
      _: Record<string, unknown>,
      args: {
        first?: number
        after?: string
        filter?: Record<string, unknown>
      },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { userService } = context
      return await userService.getUsers(context.tenantId, args)
    },

    // Integration Operations
    integration: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.getIntegration(context.tenantId, id)
    },

    integrations: async (
      _: Record<string, unknown>,
      __: Record<string, unknown>,
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.getIntegrations(context.tenantId)
    },

    // Webhook Operations
    webhook: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.getWebhook(context.tenantId, id)
    },

    webhooks: async (
      _: Record<string, unknown>,
      __: Record<string, unknown>,
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.getWebhooks(context.tenantId)
    },

    // Analytics
    assetAnalytics: async (
      _: Record<string, unknown>,
      args: { filter?: Record<string, unknown>; period: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { analyticsService } = context
      return await analyticsService.getAssetAnalytics(context.tenantId, args)
    },

    // Search
    search: async (
      _: Record<string, unknown>,
      args: {
        query: string
        types?: string[]
        limit?: number
      },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { searchService } = context
      return await searchService.search(context.tenantId, args)
    },
  },

  Mutation: {
    // Asset Operations
    createAsset: async (
      _: Record<string, unknown>,
      { input }: { input: Record<string, unknown> },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.createAsset(context.tenantId, {
        ...input,
        createdBy: context.userId,
      })
    },

    updateAsset: async (
      _: Record<string, unknown>,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.updateAsset(context.tenantId, id, input)
    },

    deleteAsset: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      await assetService.deleteAsset(context.tenantId, id)
      return true
    },

    // Integration Operations
    createIntegration: async (
      _: Record<string, unknown>,
      { input }: { input: Record<string, unknown> },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.createIntegration(context.tenantId, input as any)
    },

    updateIntegration: async (
      _: Record<string, unknown>,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.updateIntegration(context.tenantId, id, input)
    },

    deleteIntegration: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      await integrationService.deleteIntegration(context.tenantId, id)
      return true
    },

    triggerSync: async (
      _: Record<string, unknown>,
      { integrationId }: { integrationId: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.triggerSync(context.tenantId, integrationId)
    },

    // Webhook Operations
    createWebhook: async (
      _: Record<string, unknown>,
      { input }: { input: Record<string, unknown> },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.createWebhook(context.tenantId, input as any)
    },

    updateWebhook: async (
      _: Record<string, unknown>,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.updateWebhook(context.tenantId, id, input)
    },

    deleteWebhook: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      await webhookService.deleteWebhook(context.tenantId, id)
      return true
    },

    testWebhook: async (
      _: Record<string, unknown>,
      { id }: { id: string },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.testWebhook(context.tenantId, id)
    },

    // Bulk Operations
    bulkCreateAssets: async (
      _: Record<string, unknown>,
      { input }: { input: Record<string, unknown>[] },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.bulkCreateAssets(context.tenantId, input, context.userId)
    },

    bulkUpdateAssets: async (
      _: Record<string, unknown>,
      { input }: { input: Record<string, unknown>[] },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.bulkUpdateAssets(context.tenantId, input)
    },

    bulkDeleteAssets: async (
      _: Record<string, unknown>,
      { ids }: { ids: string[] },
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.bulkDeleteAssets(context.tenantId, ids)
    },
  },

  Subscription: subscriptionResolvers,

  // Type Resolvers
  Tenant: {
    assets: async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.getAssets(parent.id as string, args)
    },

    users: async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { userService } = context
      return await userService.getUsers(parent.id as string, args)
    },

    integrations: async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.getIntegrations(parent.id as string)
    },

    webhooks: async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
      context: ResolverContext,
      ___info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.getWebhooks(parent.id as string)
    },
  },

  Asset: assetResolvers,
  User: userResolvers,
  Integration: integrationResolvers,
  Webhook: webhookResolvers,
}

export default resolvers