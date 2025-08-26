/**
 * Individual Integration API
 * REST endpoints for managing specific integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { IntegrationService } from '../../../../lib/services/integration-service'
import { withAuth } from '../../../../lib/middleware/auth'
import { withRateLimit } from '../../../../lib/middleware/rate-limit'

export async function GET(
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
        const integration = await integrationService.getIntegration(
          context.user.tenantId,
          params.id
        )

        if (!integration) {
          return NextResponse.json(
            {
              success: false,
              error: 'Integration not found',
            },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          data: integration,
        })
      } catch (error) {
        console.error('Error fetching integration:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch integration',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    withRateLimit(async (req: NextRequest, context: any) => {
      try {
        const body = await req.json()

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
        const integration = await integrationService.updateIntegration(
          context.user.tenantId,
          params.id,
          body
        )

        return NextResponse.json({
          success: true,
          data: integration,
        })
      } catch (error) {
        console.error('Error updating integration:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update integration',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}

export async function DELETE(
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
        await integrationService.deleteIntegration(context.user.tenantId, params.id)

        return NextResponse.json({
          success: true,
          message: 'Integration deleted successfully',
        })
      } catch (error) {
        console.error('Error deleting integration:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to delete integration',
          },
          { status: 500 }
        )
      }
    })
  )(request)
}