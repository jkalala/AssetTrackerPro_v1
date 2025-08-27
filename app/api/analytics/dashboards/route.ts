// =====================================================
// DASHBOARDS API ROUTE
// =====================================================
// API endpoints for dashboard management

import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard-service'
import { DashboardConfig } from '@/lib/types/analytics'
import { withAuth } from '@/lib/middleware/auth'

const dashboardService = new DashboardService()

// GET /api/analytics/dashboards - Get all dashboards for tenant
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    const dashboards = await dashboardService.getDashboards(
      user.tenantId,
      userId || undefined
    )

    return NextResponse.json({
      dashboards,
      total: dashboards.length
    })
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    )
  }
})

// POST /api/analytics/dashboards - Create new dashboard
export const POST = withAuth(async (request: NextRequest, { user }) => {
      try {
        const body = await request.json()
        
        // Validate required fields
        if (!body.name) {
          return NextResponse.json(
            { error: 'Dashboard name is required' },
            { status: 400 }
          )
        }

        const dashboardConfig: DashboardConfig = {
          tenant_id: user.tenantId,
          name: body.name,
          description: body.description,
          layout: body.layout || {
            columns: 12,
            rows: 8,
            gap: 16,
            responsive: true
          },
          widgets: body.widgets || [],
          filters: body.filters || [],
          refresh_interval: body.refresh_interval || '5m',
          is_public: body.is_public || false,
          created_by: user.id
        }

        const dashboard = await dashboardService.createDashboard(dashboardConfig)

        return NextResponse.json({
          dashboard,
          message: 'Dashboard created successfully'
        }, { status: 201 })
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    )
  }
})