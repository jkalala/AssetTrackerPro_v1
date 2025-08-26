/**
 * Webhook Test API
 * Endpoint for testing webhook delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { WebhookService } from '../../../../../lib/services/webhook-service'
import { withAuth } from '../../../../../lib/middleware/auth'
import { withRateLimit } from '../../../../../lib/middleware/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    withRateLimit(async (req: NextRequest, context: any) => {
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
        const delivery = await webhookService.testWebhook(context.user.tenantId, params.id)

        return NextResponse.json({
          success: true,
          data: delivery,
        })
      } catch (error) {
        console.error('Error testing webhook:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to test webhook',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}