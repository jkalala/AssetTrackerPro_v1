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
import { analyticsResolvers } from './analytics-resolvers'
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
      _: any,
      __: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { tenantService } = context
      return await tenantService.getTenant(context.tenantId)
    },

    // Asset Operations
    asset: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.getAsset(context.tenantId, id)
    },

    assets: async (
      _: any,
      args: {
        first?: number
        after?: string
        filter?: any
        sort?: any
      },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.getAssets(context.tenantId, args)
    },

    // User Operations
    user: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { userService } = context
      return await userService.getUser(context.tenantId, id)
    },

    users: async (
      _: any,
      args: {
        first?: number
        after?: string
        filter?: any
      },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { userService } = context
      return await userService.getUsers(context.tenantId, args)
    },

    // Integration Operations
    integration: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.getIntegration(context.tenantId, id)
    },

    integrations: async (
      _: any,
      __: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.getIntegrations(context.tenantId)
    },

    // Webhook Operations
    webhook: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.getWebhook(context.tenantId, id)
    },

    webhooks: async (
      _: any,
      __: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.getWebhooks(context.tenantId)
    },

    // Analytics
    assetAnalytics: async (
      _: any,
      args: { filter?: any; period: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { analyticsService } = context
      return await analyticsService.getAssetAnalytics(context.tenantId, args)
    },

    // Search
    search: async (
      _: any,
      args: {
        query: string
        types?: string[]
        limit?: number
      },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { searchService } = context
      return await searchService.search(context.tenantId, args)
    },
  },

  Mutation: {
    // Asset Operations
    createAsset: async (
      _: any,
      { input }: { input: any },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.createAsset(context.tenantId, {
        ...input,
        createdBy: context.userId,
      })
    },

    updateAsset: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.updateAsset(context.tenantId, id, input)
    },

    deleteAsset: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      await assetService.deleteAsset(context.tenantId, id)
      return true
    },

    // Integration Operations
    createIntegration: async (
      _: any,
      { input }: { input: any },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.createIntegration(context.tenantId, input)
    },

    updateIntegration: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.updateIntegration(context.tenantId, id, input)
    },

    deleteIntegration: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      await integrationService.deleteIntegration(context.tenantId, id)
      return true
    },

    triggerSync: async (
      _: any,
      { integrationId }: { integrationId: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.triggerSync(context.tenantId, integrationId)
    },

    // Webhook Operations
    createWebhook: async (
      _: any,
      { input }: { input: any },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.createWebhook(context.tenantId, input)
    },

    updateWebhook: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.updateWebhook(context.tenantId, id, input)
    },

    deleteWebhook: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      await webhookService.deleteWebhook(context.tenantId, id)
      return true
    },

    testWebhook: async (
      _: any,
      { id }: { id: string },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.testWebhook(context.tenantId, id)
    },

    // Bulk Operations
    bulkCreateAssets: async (
      _: any,
      { input }: { input: any[] },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.bulkCreateAssets(context.tenantId, input, context.userId)
    },

    bulkUpdateAssets: async (
      _: any,
      { input }: { input: any[] },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.bulkUpdateAssets(context.tenantId, input)
    },

    bulkDeleteAssets: async (
      _: any,
      { ids }: { ids: string[] },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.bulkDeleteAssets(context.tenantId, ids)
    },
  },

  Subscription: subscriptionResolvers,

  // Type Resolvers
  Tenant: {
    assets: async (
      parent: any,
      args: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { assetService } = context
      return await assetService.getAssets(parent.id, args)
    },

    users: async (
      parent: any,
      args: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { userService } = context
      return await userService.getUsers(parent.id, args)
    },

    integrations: async (
      parent: any,
      args: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { integrationService } = context
      return await integrationService.getIntegrations(parent.id)
    },

    webhooks: async (
      parent: any,
      args: any,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const { webhookService } = context
      return await webhookService.getWebhooks(parent.id)
    },
  },

  Asset: assetResolvers,
  User: userResolvers,
  Integration: integrationResolvers,
  Webhook: webhookResolvers,
}

export default resolvers