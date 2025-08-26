/**
 * Enterprise Integrations API
 * REST endpoints for managing enterprise system integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { IntegrationService } from '../../../lib/services/integration-service'
import { withAuth } from '../../../lib/middleware/auth'
import { withRateLimit } from '../../../lib/middleware/rate-limit'

export async function GET(request: NextRequest) {
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
        const integrations = await integrationService.getIntegrations(context.user.tenantId)

        return NextResponse.json({
          success: true,
          data: integrations,
        })
      } catch (error) {
        console.error('Error fetching integrations:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch integrations',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}

export async function POST(request: NextRequest) {
  return withAuth(
    withRateLimit(async (req: NextRequest, context: any) => {
      try {
        const body = await req.json()
        const { name, type, configuration } = body

        if (!name || !type || !configuration) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required fields: name, type, configuration',
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

        const integrationService = new IntegrationService(supabase)
        const integration = await integrationService.createIntegration(context.user.tenantId, {
          name,
          type,
          configuration,
        })

        return NextResponse.json({
          success: true,
          data: integration,
        })
      } catch (error) {
        console.error('Error creating integration:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create integration',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}