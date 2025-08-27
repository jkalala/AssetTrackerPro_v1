export interface ReportField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  table: string
  column: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  format?: string
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in'
  value: unknown
  values?: Record<string, unknown>[]
}

export interface ReportSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface ReportGrouping {
  field: string
  type: 'group' | 'date_group'
  dateInterval?: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface ReportVisualization {
  type: 'table' | 'chart' | 'metric' | 'map'
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
  config: Record<string, any>
}

export interface ReportDefinition {
  id: string
  tenant_id: string
  name: string
  description?: string
  category: string
  fields: ReportField[]
  filters: ReportFilter[]
  sorting: ReportSort[]
  grouping: ReportGrouping[]
  visualization: ReportVisualization
  template_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReportTemplate {
  id: string
  tenant_id: string
  name: string
  description?: string
  category: string
  definition: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>
  branding: ReportBranding
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReportBranding {
  logo_url?: string
  primary_color: string
  secondary_color: string
  font_family: string
  header_template?: string
  footer_template?: string
}

export interface ReportSchedule {
  id: string
  tenant_id: string
  report_id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  day_of_week?: number
  day_of_month?: number
  time: string
  timezone: string
  format: 'pdf' | 'excel' | 'csv'
  recipients: string[]
  is_active: boolean
  last_run?: string
  next_run: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReportExecution {
  id: string
  tenant_id: string
  report_id: string
  schedule_id?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  parameters: Record<string, any>
  result_url?: string
  error_message?: string
  execution_time_ms?: number
  row_count?: number
  file_size_bytes?: number
  created_by: string
  created_at: string
  completed_at?: string
}

export interface ExecutiveDashboard {
  id: string
  tenant_id: string
  name: string
  description?: string
  insights: ExecutiveInsight[]
  kpis: ExecutiveKPI[]
  trends: ExecutiveTrend[]
  alerts: ExecutiveAlert[]
  branding: ReportBranding
  refresh_interval: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExecutiveInsight {
  id: string
  title: string
  description: string
  type: 'trend' | 'anomaly' | 'recommendation' | 'alert'
  priority: 'low' | 'medium' | 'high' | 'critical'
  data: Record<string, any>
  generated_at: string
}

export interface ExecutiveKPI {
  id: string
  name: string
  value: number
  target?: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change_percent: number
  period: string
}

export interface ExecutiveTrend {
  id: string
  name: string
  data: Array<{ date: string; value: number }>
  trend_direction: 'up' | 'down' | 'stable'
  forecast?: Array<{ date: string; value: number; confidence: number }>
}

export interface ExecutiveAlert {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: string
  created_at: string
  acknowledged: boolean
}

export interface ReportQueryBuilder {
  tables: string[]
  joins: Array<{
    table: string
    type: 'inner' | 'left' | 'right' | 'full'
    on: string
  }>
  select: string[]
  where: string[]
  groupBy: string[]
  having: string[]
  orderBy: string[]
  limit?: number
  offset?: number
}

export interface AvailableField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  table: string
  column: string
  description?: string
  category: string
  aggregatable: boolean
  filterable: boolean
  sortable: boolean
}

export interface ReportData {
  columns: Array<{
    key: string
    name: string
    type: string
    format?: string
  }>
  rows: Record<string, any>[]
  total_rows: number
  execution_time_ms: number
  generated_at: string
}