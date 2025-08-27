/**
 * Webhooks API
 * REST endpoints for managing webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { WebhookService } from '../../../lib/services/webhook-service'
import { withAuth } from '../../../lib/middleware/auth'
import { withRateLimit } from '../../../lib/middleware/rate-limit'

export async function GET(request: NextRequest) {
  return withAuth(
    withRateLimit(async (req: NextRequest, context?: any) => {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              get(name: string) {
                return req.cookies.get(name)?.value
              },
              set() {},
              remove() {},
            },
          }
        )

        const webhookService = new WebhookService(supabase)
        const webhooks = await webhookService.getWebhooks(context.user.tenantId)

        return NextResponse.json({
          success: true,
          data: webhooks,
        })
      } catch (error) {
        console.error('Error fetching webhooks:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch webhooks',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}

export async function POST(request: NextRequest) {
  return withAuth(
    withRateLimit(async (req: NextRequest, context?: any) => {
      try {
        const body = await req.json()
        const { name, url, events, secret, retryPolicy } = body

        if (!name || !url || !events || !Array.isArray(events)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required fields: name, url, events (array)',
            },
            { status: 400 }
          )
        }

        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              get(name: string) {
                return req.cookies.get(name)?.value
              },
              set() {},
              remove() {},
            },
          }
        )

        const webhookService = new WebhookService(supabase)
        const webhook = await webhookService.createWebhook(context.user.tenantId, {
          name,
          url,
          events,
          secret,
          retryPolicy,
        })

        return NextResponse.json({
          success: true,
          data: webhook,
        })
      } catch (error) {
        console.error('Error creating webhook:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create webhook',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}