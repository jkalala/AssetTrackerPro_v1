// =====================================================
// INDIVIDUAL DASHBOARD API ROUTE
// =====================================================
// API endpoints for individual dashboard operations

import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard-service'
import { withAuth } from '@/lib/middleware/auth'

const dashboardService = new DashboardService()

// GET /api/analytics/dashboards/[id] - Get specific dashboard
export const GET = withAuth(async (
  request: NextRequest,
  { user },
  { params }: { params: { id: string } }
) => {
  try {
    const dashboardId = params.id

    const dashboard = await dashboardService.getDashboard(dashboardId, user.tenantId)

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
})

// PUT /api/analytics/dashboards/[id] - Update dashboard
export const PUT = withAuth(async (
  request: NextRequest,
  { user },
  { params }: { params: { id: string } }
) => {
  try {
    const dashboardId = params.id
    const body = await request.json()

    // Validate dashboard exists and user has permission
    const existingDashboard = await dashboardService.getDashboard(dashboardId, user.tenantId)
    if (!existingDashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    // Check if user can edit this dashboard
    if (existingDashboard.created_by !== user.id && !user.role?.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this dashboard' },
        { status: 403 }
      )
    }

    const updates = {
      name: body.name,
      description: body.description,
      layout: body.layout,
      widgets: body.widgets,
      filters: body.filters,
      refresh_interval: body.refresh_interval,
      is_public: body.is_public
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof typeof updates] === undefined) {
        delete updates[key as keyof typeof updates]
      }
    })

    const dashboard = await dashboardService.updateDashboard(dashboardId, updates)

    return NextResponse.json({
      dashboard,
      message: 'Dashboard updated successfully'
    })
  } catch (error) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    )
  }
})

// DELETE /api/analytics/dashboards/[id] - Delete dashboard
export const DELETE = withAuth(async (
  request: NextRequest,
  { user },
  { params }: { params: { id: string } }
) => {
  try {
    const dashboardId = params.id

    // Validate dashboard exists and user has permission
    const existingDashboard = await dashboardService.getDashboard(dashboardId, user.tenantId)
    if (!existingDashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    // Check if user can delete this dashboard
    if (existingDashboard.created_by !== user.id && !user.role?.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this dashboard' },
        { status: 403 }
      )
    }

    await dashboardService.deleteDashboard(dashboardId, user.tenantId)

    return NextResponse.json({
      message: 'Dashboard deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    )
  }
})