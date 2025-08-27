// =====================================================
// DASHBOARD SERVICE
// =====================================================
// Service for managing dashboards and real-time analytics

import { createClient } from '@/lib/supabase/server'
import { 
  Dashboard, 
  DashboardConfig, 
  Widget, 
  WidgetData, 
  AnalyticsQuery, 
  AnalyticsResult,
  KPIConfig,
  KPIResult,
  DashboardTemplate,
  DashboardExport,
  DashboardShare
} from '@/lib/types/analytics'

export class DashboardService {
  private async getSupabase() {
    return await createClient()
  }

  // =====================================================
  // DASHBOARD MANAGEMENT
  // =====================================================

  async createDashboard(config: DashboardConfig): Promise<Dashboard> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: dashboard, error } = await supabase
        .from('dashboards')
        .insert({
          tenant_id: config.tenant_id,
          name: config._name,
          description: config.description,
          layout: config.layout,
          widgets: config.widgets,
          filters: config.filters,
          refresh_interval: config.refresh_interval,
          is_public: config.is_public,
          created_by: config.created_by
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create dashboard: ${error.message}`)
      }

      return dashboard
    } catch (_error) {
      console.error('Error creating dashboard:', error)
      throw error
    }
  }

  async updateDashboard(dashboardId: string, updates: Partial<DashboardConfig>): Promise<Dashboard> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: dashboard, error } = await supabase
        .from('dashboards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dashboardId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update dashboard: ${error.message}`)
      }

      return dashboard
    } catch (_error) {
      console.error('Error updating dashboard:', error)
      throw error
    }
  }

  async getDashboard(dashboardId: string, tenantId: string): Promise<Dashboard | null> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: dashboard } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', dashboardId)
        .eq('tenant_id', tenantId)
        .single()

      if (!dashboard) {
        return null
      }

      // Load widget data
      const widgets = await Promise.all(
        dashboard.widgets.map(async (widget: Widget) => ({
          ...widget,
          data: await this.getWidgetData(widget, tenantId),
          loading: false
        }))
      )

      return {
        ...dashboard,
        widgets
      }
    } catch (_error) {
      console.error('Error getting dashboard:', error)
      return null
    }
  }

  async getDashboards(tenantId: string, userId?: string): Promise<Dashboard[]> {
    try {
      const supabase = await this.getSupabase()
      
      let _query = supabase
        .from('dashboards')
        .select('*')
        .eq('tenant_id', tenantId)

      if (userId) {
        _query = query.or(`created_by.eq.${userId},is_public.eq.true`)
      }

      const { data: dashboards, error } = await query
        .order('updated_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get dashboards: ${error.message}`)
      }

      return dashboards || []
    } catch (_error) {
      console.error('Error getting dashboards:', error)
      throw error
    }
  }

  async deleteDashboard(dashboardId: string, tenantId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', dashboardId)
        .eq('tenant_id', tenantId)

      if (error) {
        throw new Error(`Failed to delete dashboard: ${error.message}`)
      }

      return true
    } catch (_error) {
      console.error('Error deleting dashboard:', error)
      throw error
    }
  }

  // =====================================================
  // WIDGET DATA RETRIEVAL
  // =====================================================

  async getWidgetData(widget: Widget, tenantId: string): Promise<WidgetData> {
    try {
      const { data_source } = widget

      switch (data_source._type) {
        case 'sql':
          const queryParts = this.parseQuery(data_source.query || '', data_source.parameters)
          const result = await this.executeAnalyticsQuery({
            tenant_id: _tenantId,
            table: queryParts.table || 'assets',
            select: queryParts.select || ['*'],
            where: queryParts.where,
            group_by: queryParts.group_by,
            order_by: queryParts.order_by,
            limit: queryParts.limit,
            offset: queryParts.offset,
            time_range: queryParts.time_range
          })
          return {
            labels: result.data.map((row: Record<string, unknown>) => Object.keys(row)[0]),
            datasets: [{
              label: 'Data',
              data: result.data.map((row: Record<string, unknown>) => Object.values(row)[0] as number)
            }],
            rows: result.data,
            metadata: { total_count: result.total_count, execution_time_ms: result.execution_time_ms }
          }
        
        case 'api':
          return await this.fetchApiData(data_source.endpoint || '', data_source.parameters)
        
        case 'static':
          return data_source.parameters as WidgetData || {}
        
        default:
          throw new Error(`Unsupported data source type: ${data_source.type}`)
      }
    } catch (_error) {
      console.error('Error getting widget data:', error)
      return { 
        rows: [],
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private parseQuery(query: string, _parameters?: Record<string, unknown>): Partial<AnalyticsQuery> {
    // Simple query parser - in production, use a proper SQL parser
    const lowerQuery = query.toLowerCase()
    
    // Extract table name
    const fromMatch = lowerQuery.match(/from\s+(\w+)/)
    const table = fromMatch?.[1] || 'assets'
    
    // Extract select fields
    const selectMatch = query.match(/select\s+(.*?)\s+from/i)
    const selectFields = selectMatch?.[1]?.split(',').map(f => f.trim()) || ['*']
    
    return {
      table,
      select: selectFields,
      // Add parameter substitution logic here
    }
  }

  private async fetchApiData(endpoint: string, parameters?: Record<string, unknown>): Promise<WidgetData> {
    try {
      const url = new URL(endpoint)
      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (_error) {
      console.error('Error fetching API data:', error)
      throw error
    }
  }

  // =====================================================
  // ANALYTICS QUERIES
  // =====================================================

  async executeAnalyticsQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    try {
      const supabase = await this.getSupabase()
      const startTime = Date.now()
      
      let dbQuery = supabase
        .from(query.table)
        .select(query.select.join(','))

      // Apply tenant isolation
      dbQuery = dbQuery.eq('tenant_id', query.tenant_id)

      // Apply where conditions
      if (query.where) {
        query.where.forEach(condition => {
          switch (condition.operator) {
            case 'eq':
              dbQuery = dbQuery.eq(condition.field, condition.value)
              break
            case 'ne':
              dbQuery = dbQuery.neq(condition.field, condition.value)
              break
            case 'gt':
              dbQuery = dbQuery.gt(condition.field, condition.value)
              break
            case 'gte':
              dbQuery = dbQuery.gte(condition.field, condition.value)
              break
            case 'lt':
              dbQuery = dbQuery.lt(condition.field, condition.value)
              break
            case 'lte':
              dbQuery = dbQuery.lte(condition.field, condition.value)
              break
            case 'in':
              dbQuery = dbQuery.in(condition.field, condition.value as unknown[])
              break
            case 'like':
              dbQuery = dbQuery.like(condition.field, condition.value as string)
              break
            case 'is_null':
              dbQuery = dbQuery.is(condition.field, null)
              break
            case 'is_not_null':
              dbQuery = dbQuery.not(condition.field, 'is', null)
              break
          }
        })
      }

      // Apply time range filter
      if (query.time_range) {
        dbQuery = dbQuery
          .gte(query.time_range.field, query.time_range.start)
          .lte(query.time_range.field, query.time_range.end)
      }

      // Apply ordering
      if (query.order_by) {
        query.order_by.forEach(order => {
          dbQuery = dbQuery.order(order.field, { ascending: order.direction === 'asc' })
        })
      }

      // Apply pagination
      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit)
      }
      if (query.offset) {
        dbQuery = dbQuery.range(query.offset, (query.offset + (query.limit || 100)) - 1)
      }

      const { data, error, count } = await dbQuery

      if (error) {
        throw new Error(`Query execution failed: ${error.message}`)
      }

      const executionTime = Date.now() - startTime

      return {
        data: Array.isArray(data) ? data.map(item => typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}) : [],
        total_count: count || 0,
        execution_time_ms: executionTime,
        cached: false
      }
    } catch (_error) {
      console.error('Error executing analytics query:', error)
      throw error
    }
  }

  // =====================================================
  // KPI MANAGEMENT
  // =====================================================

  async createKPI(config: Omit<KPIConfig, 'id' | 'created_at' | 'updated_at'>): Promise<KPIConfig> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: kpi, error } = await supabase
        .from('kpi_configs')
        .insert(config)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create KPI: ${error.message}`)
      }

      return kpi
    } catch (_error) {
      console.error('Error creating KPI:', error)
      throw error
    }
  }

  async getKPIResults(tenantId: string, kpiIds?: string[]): Promise<KPIResult[]> {
    try {
      const supabase = await this.getSupabase()
      
      let _query = supabase
        .from('kpi_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      if (kpiIds && kpiIds.length > 0) {
        _query = query.in('id', kpiIds)
      }

      const { data: kpis, error } = await query

      if (error) {
        throw new Error(`Failed to get KPIs: ${error.message}`)
      }

      // Calculate KPI results
      const results = await Promise.all(
        (kpis || []).map(async (kpi: KPIConfig) => {
          const value = await this.calculateKPIValue(kpi)
          return this.evaluateKPI(kpi, value)
        })
      )

      return results
    } catch (_error) {
      console.error('Error getting KPI results:', error)
      throw error
    }
  }

  private async calculateKPIValue(kpi: KPIConfig): Promise<number> {
    // Implement KPI calculation logic based on the metric configuration
    // This is a simplified version - in production, this would be more sophisticated
    try {
      const query: AnalyticsQuery = {
        tenant_id: kpi.tenant_id,
        table: 'assets', // This would be dynamic based on KPI config
        select: [`${kpi.metric.aggregation}(${kpi.metric.field}) as value`],
        time_range: this.getTimeRangeFilter(kpi.time_range)
      }

      const result = await this.executeAnalyticsQuery(query)
      return (result.data[0]?.value as number) || 0
    } catch (_error) {
      console.error('Error calculating KPI value:', error)
      return 0
    }
  }

  private evaluateKPI(kpi: KPIConfig, value: number): KPIResult {
    // Determine status based on thresholds
    let status: KPIResult['status'] = 'good'
    
    for (const threshold of kpi.thresholds) {
      const inRange = (threshold.min === undefined || value >= threshold.min) &&
                     (threshold.max === undefined || value <= threshold.max)
      
      if (inRange) {
        status = threshold.level
        break
      }
    }

    // Calculate variance
    const variance = kpi.target ? value - kpi.target : undefined
    const variancePercentage = kpi.target && kpi.target !== 0 
      ? (variance! / kpi.target) * 100 
      : undefined

    return {
      id: kpi.id,
      value,
      target: kpi.target,
      variance,
      variance_percentage: variancePercentage,
      status,
      trend: 'stable', // This would be calculated based on historical data
      last_updated: new Date().toISOString()
    }
  }

  private getTimeRangeFilter(timeRange: string): { field: string; start: string; end: string } {
    const now = new Date()
    const field = 'created_at' // Default field, should be configurable
    
    let start: Date
    
    switch (timeRange) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return {
      field,
      start: start.toISOString(),
      end: now.toISOString()
    }
  }

  // =====================================================
  // DASHBOARD TEMPLATES
  // =====================================================

  async getDashboardTemplates(category?: string): Promise<DashboardTemplate[]> {
    try {
      const supabase = await this.getSupabase()
      
      let _query = supabase
        .from('dashboard_templates')
        .select('*')
        .eq('is_public', true)

      if (category) {
        _query = query.eq('category', category)
      }

      const { data: templates, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get dashboard templates: ${error.message}`)
      }

      return templates || []
    } catch (_error) {
      console.error('Error getting dashboard templates:', error)
      throw error
    }
  }

  async createDashboardFromTemplate(
    templateId: string, 
    tenantId: string, 
    userId: string, 
    customizations?: Partial<DashboardConfig>
  ): Promise<Dashboard> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: template } = await supabase
        .from('dashboard_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (!template) {
        throw new Error('Dashboard template not found')
      }

      const dashboardConfig: DashboardConfig = {
        ...template.config,
        ...customizations,
        tenant_id: _tenantId,
        created_by: userId
      }

      return await this.createDashboard(dashboardConfig)
    } catch (_error) {
      console.error('Error creating dashboard from template:', error)
      throw error
    }
  }

  // =====================================================
  // REAL-TIME UPDATES
  // =====================================================

  async refreshWidget(widgetId: string, dashboardId: string, tenantId: string): Promise<WidgetData> {
    try {
      const dashboard = await this.getDashboard(dashboardId, tenantId)
      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      const widget = dashboard.widgets.find(w => w.id === widgetId)
      if (!widget) {
        throw new Error('Widget not found')
      }

      return await this.getWidgetData(widget, tenantId)
    } catch (_error) {
      console.error('Error refreshing widget:', error)
      throw error
    }
  }

  // =====================================================
  // EXPORT AND SHARING
  // =====================================================

  async exportDashboard(_exportConfig: DashboardExport): Promise<Buffer> {
    try {
      // This would integrate with a PDF/image generation service
      // For now, return a placeholder
      throw new Error('Dashboard export not yet implemented')
    } catch (_error) {
      console.error('Error exporting dashboard:', error)
      throw error
    }
  }

  async createDashboardShare(
    dashboardId: string, 
    permissions: string[], 
    expiresAt?: string
  ): Promise<DashboardShare> {
    try {
      const supabase = await this.getSupabase()
      
      const shareToken = this.generateShareToken()
      
      const { data: share, error } = await supabase
        .from('dashboard_shares')
        .insert({
          dashboard_id: dashboardId,
          share_token: shareToken,
          expires_at: expiresAt,
          permissions: permissions.map(type => ({ type, allowed: true })),
          created_by: 'current_user' // This should come from context
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create dashboard share: ${error.message}`)
      }

      return share
    } catch (_error) {
      console.error('Error creating dashboard share:', error)
      throw error
    }
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}