import { NextRequest, NextResponse } from 'next/server'
import { ReportingService } from '@/lib/services/reporting-service'
import { createClient } from '@/lib/supabase/server'

const reportingService = new ReportingService()

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user?.tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dashboards = await reportingService.getExecutiveDashboards(user.tenant_id)
    
    // Generate fresh insights for each dashboard
    const dashboardsWithInsights = await Promise.all(
      dashboards.map(async (dashboard) => {
        const insights = await reportingService.generateExecutiveInsights(user.tenant_id)
        return {
          ...dashboard,
          insights,
          kpis: generateMockKPIs(),
          trends: generateMockTrends(),
          alerts: generateMockAlerts()
        }
      })
    )

    return NextResponse.json(dashboardsWithInsights)
  } catch (error) {
    console.error('Error fetching executive dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executive dashboards' },
      { status: 500 }
    )
  }
}

function generateMockKPIs() {
  return [
    {
      id: 'total_assets',
      name: 'Total Assets',
      value: 1247,
      unit: 'number',
      trend: 'up' as const,
      change_percent: 8.5,
      period: 'vs last month'
    },
    {
      id: 'asset_value',
      name: 'Total Asset Value',
      value: 2450000,
      unit: 'currency',
      trend: 'up' as const,
      change_percent: 12.3,
      period: 'vs last quarter'
    },
    {
      id: 'utilization_rate',
      name: 'Utilization Rate',
      value: 78.5,
      target: 85,
      unit: 'percentage',
      trend: 'down' as const,
      change_percent: -2.1,
      period: 'vs last month'
    },
    {
      id: 'maintenance_cost',
      name: 'Maintenance Cost',
      value: 45000,
      unit: 'currency',
      trend: 'stable' as const,
      change_percent: 0.8,
      period: 'this month'
    }
  ]
}

function generateMockTrends() {
  const generateTrendData = (baseValue: number, points: number = 12) => {
    return Array.from({ length: points }, (_, i) => ({
      date: new Date(Date.now() - (points - i - 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      value: baseValue + Math.random() * baseValue * 0.2 - baseValue * 0.1
    }))
  }

  return [
    {
      id: 'asset_growth',
      name: 'Asset Growth',
      data: generateTrendData(1200),
      trend_direction: 'up' as const
    },
    {
      id: 'maintenance_costs',
      name: 'Maintenance Costs',
      data: generateTrendData(40000),
      trend_direction: 'stable' as const
    }
  ]
}

function generateMockAlerts() {
  return [
    {
      id: 'alert_1',
      title: 'High Maintenance Costs',
      message: 'Maintenance costs have exceeded budget by 15% this month',
      severity: 'warning' as const,
      category: 'financial',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      acknowledged: false
    },
    {
      id: 'alert_2',
      title: 'Asset Utilization Below Target',
      message: 'Several high-value assets are showing low utilization rates',
      severity: 'info' as const,
      category: 'operations',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      acknowledged: true
    }
  ]
}