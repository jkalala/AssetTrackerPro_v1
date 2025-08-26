/**
 * Integration Sync API
 * Triggers manual synchronization for integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { IntegrationService } from '../../../../../lib/services/integration-service'
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

        const integrationService = new IntegrationService(supabase)
        const syncResult = await integrationService.triggerSync(
          context.user.tenantId,
          params.id
        )

        return NextResponse.json({
          success: true,
          data: syncResult,
        })
      } catch (error) {
        console.error('Error triggering sync:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger sync',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}