// =====================================================
// ANALYTICS AND DASHBOARD TYPES
// =====================================================
// TypeScript types for the analytics and BI engine

export type WidgetType = 
  | 'metric' 
  | 'chart' 
  | 'table' 
  | 'gauge' 
  | 'progress' 
  | 'map' 
  | 'list'
  | 'heatmap'

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'doughnut' 
  | 'area' 
  | 'scatter' 
  | 'radar'

export type MetricAggregation = 
  | 'sum' 
  | 'avg' 
  | 'count' 
  | 'min' 
  | 'max' 
  | 'distinct'

export type TimeRange = 
  | '1h' 
  | '24h' 
  | '7d' 
  | '30d' 
  | '90d' 
  | '1y' 
  | 'custom'

export type RefreshInterval = 
  | 'none' 
  | '30s' 
  | '1m' 
  | '5m' 
  | '15m' 
  | '30m' 
  | '1h'

// =====================================================
// DASHBOARD CONFIGURATION
// =====================================================

export interface DashboardConfig {
  id?: string
  tenant_id: string
  name: string
  description?: string
  layout: DashboardLayout
  widgets: WidgetConfig[]
  filters: DashboardFilter[]
  refresh_interval: RefreshInterval
  is_public: boolean
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface DashboardLayout {
  columns: number
  rows: number
  gap: number
  responsive: boolean
}

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  description?: string
  position: WidgetPosition
  size: WidgetSize
  data_source: DataSource
  visualization: VisualizationConfig
  filters?: WidgetFilter[]
  refresh_interval?: RefreshInterval
}

export interface WidgetPosition {
  x: number
  y: number
}

export interface WidgetSize {
  width: number
  height: number
  min_width?: number
  min_height?: number
  max_width?: number
  max_height?: number
}

export interface DataSource {
  type: 'sql' | 'api' | 'static'
  query?: string
  endpoint?: string
  parameters?: Record<string, unknown>
  cache_duration?: number
}

export interface VisualizationConfig {
  chart_type?: ChartType
  aggregation?: MetricAggregation
  group_by?: string[]
  metrics: MetricConfig[]
  colors?: string[]
  options?: Record<string, unknown>
}

export interface MetricConfig {
  field: string
  label: string
  aggregation: MetricAggregation
  format?: 'number' | 'currency' | 'percentage' | 'duration'
  prefix?: string
  suffix?: string
  decimal_places?: number
}

// =====================================================
// FILTERS AND PARAMETERS
// =====================================================

export interface DashboardFilter {
  id: string
  name: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number'
  field: string
  options?: FilterOption[]
  default_value?: unknown
  required: boolean
}

export interface FilterOption {
  label: string
  value: unknown
}

export interface WidgetFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like'
  value: unknown
}

// =====================================================
// DASHBOARD DATA AND RESULTS
// =====================================================

export interface Dashboard {
  id: string
  tenant_id: string
  name: string
  description?: string
  layout: DashboardLayout
  widgets: Widget[]
  filters: DashboardFilter[]
  refresh_interval: RefreshInterval
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Widget extends WidgetConfig {
  data?: WidgetData
  loading?: boolean
  error?: string
  last_updated?: string
}

export interface WidgetData {
  labels?: string[]
  datasets?: DataSet[]
  value?: number | string
  rows?: Record<string, unknown>[]
  metadata?: Record<string, unknown>
}

export interface DataSet {
  label: string
  data: (number | null)[]
  backgroundColor?: string | string[]
  borderColor?: string
  borderWidth?: number
  fill?: boolean
}

// =====================================================
// KPI AND METRICS
// =====================================================

export interface KPIConfig {
  id: string
  tenant_id: string
  name: string
  description?: string
  metric: MetricConfig
  target?: number
  thresholds: KPIThreshold[]
  time_range: TimeRange
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface KPIThreshold {
  level: 'critical' | 'warning' | 'good' | 'excellent'
  min?: number
  max?: number
  color: string
}

export interface KPIResult {
  id: string
  value: number
  target?: number
  variance?: number
  variance_percentage?: number
  status: 'critical' | 'warning' | 'good' | 'excellent'
  trend: 'up' | 'down' | 'stable'
  trend_percentage?: number
  last_updated: string
}

// =====================================================
// REAL-TIME DATA STREAMING
// =====================================================

export interface DashboardSubscription {
  dashboard_id: string
  user_id: string
  connection_id: string
  filters?: Record<string, unknown>
  last_ping: string
}

export interface WidgetUpdate {
  widget_id: string
  data: WidgetData
  timestamp: string
}

export interface DashboardUpdate {
  dashboard_id: string
  widgets: WidgetUpdate[]
  timestamp: string
}

// =====================================================
// ANALYTICS QUERIES
// =====================================================

export interface AnalyticsQuery {
  tenant_id: string
  table: string
  select: string[]
  where?: QueryCondition[]
  group_by?: string[]
  order_by?: QueryOrder[]
  limit?: number
  offset?: number
  time_range?: {
    field: string
    start: string
    end: string
  }
}

export interface QueryCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'is_null' | 'is_not_null'
  value?: unknown
}

export interface QueryOrder {
  field: string
  direction: 'asc' | 'desc'
}

export interface AnalyticsResult {
  data: Record<string, unknown>[]
  total_count: number
  execution_time_ms: number
  cached: boolean
  cache_expires_at?: string
}

// =====================================================
// DASHBOARD TEMPLATES
// =====================================================

export interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: string
  preview_image?: string
  config: Omit<DashboardConfig, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>
  is_public: boolean
  created_by: string
  created_at: string
}

// =====================================================
// EXPORT AND SHARING
// =====================================================

export interface DashboardExport {
  format: 'pdf' | 'png' | 'csv' | 'excel'
  dashboard_id: string
  filters?: Record<string, unknown>
  options?: {
    include_data?: boolean
    page_size?: 'a4' | 'letter' | 'a3'
    orientation?: 'portrait' | 'landscape'
  }
}

export interface DashboardShare {
  id: string
  dashboard_id: string
  share_token: string
  expires_at?: string
  permissions: SharePermission[]
  created_by: string
  created_at: string
}

export interface SharePermission {
  type: 'view' | 'export'
  allowed: boolean
}