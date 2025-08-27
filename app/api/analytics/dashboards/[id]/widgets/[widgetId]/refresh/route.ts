// =====================================================
// WIDGET REFRESH API ROUTE
// =====================================================
// API endpoint for refreshing individual widget data

import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard-service'
import { withAuth } from '@/lib/middleware/auth'

const dashboardService = new DashboardService()

// POST /api/analytics/dashboards/[id]/widgets/[widgetId]/refresh - Refresh widget data
export const POST = withAuth(async (
  request: NextRequest,
  { user },
  { params }: { params: { id: string; widgetId: string } }
) => {
  try {
    const { id: dashboardId, widgetId } = params

    // Validate dashboard exists and user has access
    const dashboard = await dashboardService.getDashboard(dashboardId, user.tenantId)
    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    // Refresh widget data
    const widgetData = await dashboardService.refreshWidget(widgetId, dashboardId, user.tenantId)

    return NextResponse.json({
      data: widgetData,
      message: 'Widget refreshed successfully'
    })
  } catch (error) {
    console.error('Error refreshing widget:', error)
    return NextResponse.json(
      { error: 'Failed to refresh widget' },
      { status: 500 }
    )
  }
})