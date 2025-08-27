/**
 * Webhook Service
 * Handles reliable webhook delivery with retry mechanisms and security
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database'
import crypto from 'crypto'

export interface Webhook {
  id: string
  tenantId: string
  name: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  retryPolicy: RetryPolicy
  createdAt: Date
  updatedAt: Date
}

export interface RetryPolicy {
  maxAttempts: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  eventType: string
  payload: any
  status: WebhookDeliveryStatus
  responseCode?: number
  responseBody?: string
  attemptNumber: number
  deliveredAt?: Date
  nextRetryAt?: Date
  createdAt: Date
}

export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  EXHAUSTED = 'EXHAUSTED',
}

export interface WebhookEvent {
  type: string
  data: any
  tenantId: string
  timestamp: Date
  metadata?: Record<string, any>
}

export class WebhookService {
  private readonly defaultRetryPolicy: RetryPolicy = {
    maxAttempts: 5,
    backoffMultiplier: 2,
    initialDelay: 1000, // 1 second
    maxDelay: 300000, // 5 minutes
  }

  constructor(private supabase: SupabaseClient<Database>) {}

  async createWebhook(
    tenantId: string,
    data: {
      name: string
      url: string
      events: string[]
      secret?: string
      retryPolicy?: RetryPolicy
    }
  ): Promise<Webhook> {
    try {
      // Validate webhook URL
      this.validateWebhookUrl(data.url)

      // Generate secret if not provided
      const secret = data.secret || this.generateSecret()

      const { data: webhook, error } = await this.supabase
        .from('webhooks')
        .insert({
          tenant_id: tenantId,
          name: data.name,
          url: data.url,
          events: data.events,
          secret,
          is_active: true,
          retry_policy: data.retryPolicy || this.defaultRetryPolicy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return this.mapWebhookFromDb(webhook)
    } catch (error) {
      console.error('Error creating webhook:', error)
      throw error
    }
  }

  async getWebhook(tenantId: string, webhookId: string): Promise<Webhook | null> {
    try {
      const { data: webhook, error } = await this.supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return this.mapWebhookFromDb(webhook)
    } catch (error) {
      console.error('Error getting webhook:', error)
      throw error
    }
  }

  async getWebhooks(tenantId: string): Promise<Webhook[]> {
    try {
      const { data: webhooks, error } = await this.supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return webhooks.map(this.mapWebhookFromDb)
    } catch (error) {
      console.error('Error getting webhooks:', error)
      throw error
    }
  }

  async updateWebhook(
    tenantId: string,
    webhookId: string,
    updates: Partial<{
      name: string
      url: string
      events: string[]
      secret: string
      isActive: boolean
      retryPolicy: RetryPolicy
    }>
  ): Promise<Webhook> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name) updateData.name = updates.name
      if (updates.url) {
        this.validateWebhookUrl(updates.url)
        updateData.url = updates.url
      }
      if (updates.events) updateData.events = updates.events
      if (updates.secret) updateData.secret = updates.secret
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.retryPolicy) updateData.retry_policy = updates.retryPolicy

      const { data: webhook, error } = await this.supabase
        .from('webhooks')
        .update(updateData)
        .eq('id', webhookId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error

      return this.mapWebhookFromDb(webhook)
    } catch (error) {
      console.error('Error updating webhook:', error)
      throw error
    }
  }

  async deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('tenant_id', tenantId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting webhook:', error)
      throw error
    }
  }

  async testWebhook(tenantId: string, webhookId: string): Promise<WebhookDelivery> {
    try {
      const webhook = await this.getWebhook(tenantId, webhookId)
      if (!webhook) {
        throw new Error('Webhook not found')
      }

      // Create test event
      const testEvent: WebhookEvent = {
        type: 'webhook.test',
        data: {
          message: 'This is a test webhook delivery',
          timestamp: new Date().toISOString(),
        },
        tenantId,
        timestamp: new Date(),
        metadata: {
          test: true,
        },
      }

      return await this.deliverWebhook(webhook, testEvent)
    } catch (error) {
      console.error('Error testing webhook:', error)
      throw error
    }
  }

  async deliverEvent(event: WebhookEvent): Promise<void> {
    try {
      // Get all active webhooks for the tenant that listen to this event type
      const { data: webhooks, error } = await this.supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', event.tenantId)
        .eq('is_active', true)
        .contains('events', [event.type])

      if (error) throw error

      // Deliver to each webhook
      const deliveryPromises = webhooks.map(async (webhookData) => {
        const webhook = this.mapWebhookFromDb(webhookData)
        try {
          await this.deliverWebhook(webhook, event)
        } catch (error) {
          console.error(`Failed to deliver webhook ${webhook.id}:`, error)
        }
      })

      await Promise.allSettled(deliveryPromises)
    } catch (error) {
      console.error('Error delivering event:', error)
      throw error
    }
  }

  private async deliverWebhook(webhook: Webhook, event: WebhookEvent): Promise<WebhookDelivery> {
    try {
      // Create delivery record
      const { data: delivery, error } = await this.supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          event_type: event.type,
          payload: event,
          status: WebhookDeliveryStatus.PENDING,
          attempt_number: 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Attempt delivery
      const deliveryResult = await this.attemptDelivery(webhook, event, delivery.id, 1)

      return deliveryResult
    } catch (error) {
      console.error('Error delivering webhook:', error)
      throw error
    }
  }

  private async attemptDelivery(
    webhook: Webhook,
    event: WebhookEvent,
    deliveryId: string,
    attemptNumber: number
  ): Promise<WebhookDelivery> {
    try {
      // Prepare payload
      const payload = {
        id: deliveryId,
        event: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        tenant_id: event.tenantId,
        metadata: event.metadata,
      }

      // Generate signature
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AssetTracker-Webhooks/1.0',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-Delivery': deliveryId,
          'X-Webhook-Attempt': attemptNumber.toString(),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseBody = await response.text()

      if (response.ok) {
        // Success
        const { data: updatedDelivery, error } = await this.supabase
          .from('webhook_deliveries')
          .update({
            status: WebhookDeliveryStatus.DELIVERED,
            response_code: response.status,
            response_body: responseBody.substring(0, 1000), // Limit response body size
            delivered_at: new Date().toISOString(),
          })
          .eq('id', deliveryId)
          .select()
          .single()

        if (error) throw error

        return this.mapWebhookDeliveryFromDb(updatedDelivery)
      } else {
        // Failed - schedule retry if attempts remaining
        return await this.handleFailedDelivery(
          webhook,
          event,
          deliveryId,
          attemptNumber,
          response.status,
          responseBody
        )
      }
    } catch (error) {
      // Network error or timeout - schedule retry if attempts remaining
      return await this.handleFailedDelivery(
        webhook,
        event,
        deliveryId,
        attemptNumber,
        0,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  private async handleFailedDelivery(
    webhook: Webhook,
    event: WebhookEvent,
    deliveryId: string,
    attemptNumber: number,
    responseCode: number,
    responseBody: string
  ): Promise<WebhookDelivery> {
    const retryPolicy = webhook.retryPolicy

    if (attemptNumber >= retryPolicy.maxAttempts) {
      // Exhausted all retry attempts
      const { data: updatedDelivery, error } = await this.supabase
        .from('webhook_deliveries')
        .update({
          status: WebhookDeliveryStatus.EXHAUSTED,
          response_code: responseCode,
          response_body: responseBody.substring(0, 1000),
        })
        .eq('id', deliveryId)
        .select()
        .single()

      if (error) throw error

      return this.mapWebhookDeliveryFromDb(updatedDelivery)
    } else {
      // Schedule retry
      const delay = Math.min(
        retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attemptNumber - 1),
        retryPolicy.maxDelay
      )

      const nextRetryAt = new Date(Date.now() + delay)

      const { data: updatedDelivery, error } = await this.supabase
        .from('webhook_deliveries')
        .update({
          status: WebhookDeliveryStatus.RETRYING,
          response_code: responseCode,
          response_body: responseBody.substring(0, 1000),
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single()

      if (error) throw error

      // Schedule retry (in a real implementation, this would use a job queue)
      setTimeout(async () => {
        try {
          await this.attemptDelivery(webhook, event, deliveryId, attemptNumber + 1)
        } catch (error) {
          console.error('Error in retry attempt:', error)
        }
      }, delay)

      return this.mapWebhookDeliveryFromDb(updatedDelivery)
    }
  }

  async getWebhookDeliveries(
    tenantId: string,
    webhookId: string,
    options?: {
      limit?: number
      offset?: number
      status?: WebhookDeliveryStatus
    }
  ): Promise<WebhookDelivery[]> {
    try {
      let query = this.supabase
        .from('webhook_deliveries')
        .select(`
          *,
          webhook:webhooks!inner(tenant_id)
        `)
        .eq('webhook.tenant_id', tenantId)
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data: deliveries, error } = await query

      if (error) throw error

      return deliveries.map(this.mapWebhookDeliveryFromDb)
    } catch (error) {
      console.error('Error getting webhook deliveries:', error)
      throw error
    }
  }

  private validateWebhookUrl(url: string): void {
    try {
      const parsedUrl = new URL(url)
      
      // Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        throw new Error('Webhook URLs must use HTTPS in production')
      }

      // Block localhost and private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname
        if (
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          (hostname.startsWith('172.') && 
           parseInt(hostname.split('.')[1]) >= 16 && 
           parseInt(hostname.split('.')[1]) <= 31)
        ) {
          throw new Error('Private IP addresses and localhost are not allowed in production')
        }
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid webhook URL format')
      }
      throw error
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private generateSignature(payload: string, secret?: string): string {
    if (!secret) return ''
    
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    return `sha256=${hmac.digest('hex')}`
  }

  private mapWebhookFromDb(dbWebhook: Record<string, unknown>): Webhook {
    return {
      id: dbWebhook.id as string,
      tenantId: dbWebhook.tenant_id as string,
      name: dbWebhook.name as string,
      url: dbWebhook.url as string,
      events: dbWebhook.events as string[],
      secret: dbWebhook.secret as string,
      isActive: dbWebhook.is_active as boolean,
      retryPolicy: dbWebhook.retry_policy as RetryPolicy,
      createdAt: new Date(dbWebhook.created_at as string),
      updatedAt: new Date(dbWebhook.updated_at as string),
    }
  }

  private mapWebhookDeliveryFromDb(dbDelivery: Record<string, unknown>): WebhookDelivery {
    return {
      id: dbDelivery.id as string,
      webhookId: dbDelivery.webhook_id as string,
      eventType: dbDelivery.event_type as string,
      payload: dbDelivery.payload,
      status: dbDelivery.status as WebhookDeliveryStatus,
      responseCode: dbDelivery.response_code as number,
      responseBody: dbDelivery.response_body as string,
      attemptNumber: dbDelivery.attempt_number as number,
      deliveredAt: dbDelivery.delivered_at ? new Date(dbDelivery.delivered_at as string) : undefined,
      nextRetryAt: dbDelivery.next_retry_at ? new Date(dbDelivery.next_retry_at as string) : undefined,
      createdAt: new Date(dbDelivery.created_at as string),
    }
  }
}