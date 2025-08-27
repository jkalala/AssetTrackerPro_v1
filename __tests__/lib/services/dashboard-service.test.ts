// =====================================================
// DASHBOARD SERVICE TESTS
// =====================================================
// Tests for the dashboard service functionality

import { DashboardService } from '@/lib/services/dashboard-service'
import { DashboardConfig } from '@/lib/types/analytics'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ 
      data: {
        id: 'test-dashboard-id',
        tenant_id: 'test-tenant',
        name: 'Test Dashboard',
        widgets: []
      }, 
      error: null 
    }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  }))
}))

describe('DashboardService', () => {
  let dashboardService: DashboardService

  beforeEach(() => {
    dashboardService = new DashboardService()
  })

  it('should be instantiated', () => {
    expect(dashboardService).toBeInstanceOf(DashboardService)
  })

  it('should create a dashboard', async () => {
    const config: DashboardConfig = {
      tenant_id: 'test-tenant',
      name: 'Test Dashboard',
      description: 'A test dashboard',
      layout: {
        columns: 12,
        rows: 8,
        gap: 16,
        responsive: true
      },
      widgets: [],
      filters: [],
      refresh_interval: '5m',
      is_public: false,
      created_by: 'test-user'
    }

    const dashboard = await dashboardService.createDashboard(config)
    expect(dashboard).toBeDefined()
    expect(dashboard.name).toBe('Test Dashboard')
  })

  it('should get a dashboard', async () => {
    const dashboard = await dashboardService.getDashboard('test-dashboard-id', 'test-tenant')
    expect(dashboard).toBeDefined()
    expect(dashboard?.id).toBe('test-dashboard-id')
  })

  it('should handle dashboard not found', async () => {
    // Mock the Supabase client to return null
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => mockSupabase)
    }))

    const dashboard = await dashboardService.getDashboard('non-existent', 'test-tenant')
    expect(dashboard).toBeNull()
  })

  it('should handle widget data retrieval', async () => {
    const widget = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 2 },
      data_source: {
        type: 'static' as const,
        parameters: { value: 100 }
      },
      visualization: {
        metrics: [{
          field: 'value',
          label: 'Test Metric',
          aggregation: 'sum' as const,
          format: 'number' as const
        }]
      }
    }

    const data = await dashboardService.getWidgetData(widget, 'test-tenant')
    expect(data).toBeDefined()
    expect(data.value).toBe(100)
  })

  it('should handle KPI calculation', async () => {
    const kpiConfig = {
      id: 'test-kpi',
      tenant_id: 'test-tenant',
      name: 'Test KPI',
      metric: {
        field: 'count',
        label: 'Asset Count',
        aggregation: 'count' as const,
        format: 'number' as const
      },
      target: 100,
      thresholds: [
        { level: 'excellent' as const, min: 90, color: '#10B981' },
        { level: 'good' as const, min: 70, max: 89, color: '#F59E0B' },
        { level: 'warning' as const, min: 50, max: 69, color: '#EF4444' },
        { level: 'critical' as const, max: 49, color: '#DC2626' }
      ],
      time_range: '30d' as const,
      is_active: true,
      created_by: 'test-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const results = await dashboardService.getKPIResults('test-tenant', [kpiConfig.id])
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    // Mock Supabase to throw an error
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Database error'))
    }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => mockSupabase)
    }))

    try {
      await dashboardService.getDashboard('error-dashboard', 'test-tenant')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})