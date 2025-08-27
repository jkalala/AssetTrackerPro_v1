-- Analytics Dashboard System Schema (Fixed Version)
-- This script creates the database schema for analytics dashboards without RLS dependencies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ANALYTICS DASHBOARDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tenant_dashboard_name UNIQUE(tenant_id, name)
);

-- =====================================================
-- DASHBOARD WIDGETS TABLE
-- =====================================================

CREATE TYPE widget_type AS ENUM (
  'metric',
  'chart',
  'table',
  'map',
  'gauge',
  'progress',
  'text'
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  widget_type widget_type NOT NULL,
  title TEXT NOT NULL,
  position JSONB DEFAULT '{}',
  size JSONB DEFAULT '{}',
  configuration JSONB DEFAULT '{}',
  data_source JSONB DEFAULT '{}',
  refresh_interval INTEGER DEFAULT 300, -- 5 minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tenant_cache_key UNIQUE(tenant_id, cache_key)
);

-- =====================================================
-- COMPUTED METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS computed_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  formula JSONB NOT NULL,
  unit TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tenant_metric_name UNIQUE(tenant_id, name)
);

-- =====================================================
-- DASHBOARD TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  template_data JSONB NOT NULL,
  preview_image TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_template_name UNIQUE(name)
);

-- =====================================================
-- KPI CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kpi_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query JSONB NOT NULL,
  target_value DECIMAL,
  unit TEXT,
  format_options JSONB DEFAULT '{}',
  thresholds JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tenant_kpi_name UNIQUE(tenant_id, name)
);

-- =====================================================
-- DASHBOARD SHARES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES profiles(id),
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_dashboard_share UNIQUE(dashboard_id, shared_with)
);

-- =====================================================
-- DASHBOARD SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'email', 'slack')),
  delivery_options JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_dashboard_subscription UNIQUE(dashboard_id, user_id)
);

-- =====================================================
-- REPORT TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  parameters JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tenant_report_template_name UNIQUE(tenant_id, name)
);

-- =====================================================
-- SCHEDULED REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES report_templates(id),
  schedule_expression TEXT NOT NULL, -- Cron expression
  parameters JSONB DEFAULT '{}',
  recipients JSONB DEFAULT '[]',
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv')),
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REPORT EXECUTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  scheduled_report_id UUID REFERENCES scheduled_reports(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  parameters JSONB DEFAULT '{}',
  result_url TEXT,
  error_message TEXT,
  execution_time_ms INTEGER,
  file_size_bytes BIGINT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- FUNCTIONS FOR ANALYTICS OPERATIONS
-- =====================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh dashboard widget data
CREATE OR REPLACE FUNCTION refresh_dashboard_widget(p_widget_id UUID)
RETURNS JSONB AS $$
DECLARE
  widget_config JSONB;
  result JSONB;
BEGIN
  -- Get widget configuration
  SELECT configuration INTO widget_config
  FROM dashboard_widgets
  WHERE id = p_widget_id;

  -- This would contain the logic to execute the widget's data source query
  -- For now, return a placeholder result
  result := jsonb_build_object(
    'status', 'success',
    'data', '[]',
    'refreshed_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate KPI value
CREATE OR REPLACE FUNCTION calculate_kpi_value(p_tenant_id UUID, p_kpi_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  kpi_query JSONB;
  result DECIMAL;
BEGIN
  -- Get KPI configuration
  SELECT query INTO kpi_query
  FROM kpi_configs
  WHERE id = p_kpi_id AND tenant_id = p_tenant_id;

  -- This would contain the logic to execute the KPI query
  -- For now, return a placeholder result
  result := 100.0;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Analytics dashboards indexes
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_tenant_id ON analytics_dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_created_by ON analytics_dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_is_public ON analytics_dashboards(is_public);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_is_template ON analytics_dashboards(is_template);

-- Dashboard widgets indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_tenant_id ON dashboard_widgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active);

-- Analytics cache indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_tenant_id ON analytics_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Computed metrics indexes
CREATE INDEX IF NOT EXISTS idx_computed_metrics_tenant_id ON computed_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_computed_metrics_category ON computed_metrics(category);
CREATE INDEX IF NOT EXISTS idx_computed_metrics_active ON computed_metrics(is_active);

-- Dashboard templates indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_category ON dashboard_templates(category);
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_public ON dashboard_templates(is_public);

-- KPI configs indexes
CREATE INDEX IF NOT EXISTS idx_kpi_configs_tenant_id ON kpi_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_configs_active ON kpi_configs(is_active);

-- Dashboard shares indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard_id ON dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_shared_with ON dashboard_shares(shared_with);

-- Dashboard subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_subscriptions_dashboard_id ON dashboard_subscriptions(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_subscriptions_user_id ON dashboard_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_subscriptions_active ON dashboard_subscriptions(is_active);

-- Report templates indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_public ON report_templates(is_public);

-- Scheduled reports indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant_id ON scheduled_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run) WHERE is_active = true;

-- Report executions indexes
CREATE INDEX IF NOT EXISTS idx_report_executions_tenant_id ON report_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_scheduled_report_id ON report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_created_at ON report_executions(created_at);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for dashboard summary
CREATE VIEW dashboard_summary AS
SELECT
  d.tenant_id,
  d.id,
  d.name,
  d.description,
  d.is_public,
  d.created_by,
  d.created_at,
  COUNT(w.id) as widget_count,
  COUNT(s.id) as share_count
FROM analytics_dashboards d
LEFT JOIN dashboard_widgets w ON d.id = w.dashboard_id AND w.is_active = true
LEFT JOIN dashboard_shares s ON d.id = s.dashboard_id
GROUP BY d.tenant_id, d.id, d.name, d.description, d.is_public, d.created_by, d.created_at;

-- View for active KPIs
CREATE VIEW active_kpis AS
SELECT
  k.tenant_id,
  k.id,
  k.name,
  k.description,
  k.unit,
  k.target_value,
  k.thresholds,
  k.created_by,
  k.created_at
FROM kpi_configs k
WHERE k.is_active = true;

-- =====================================================
-- SCHEDULED CLEANUP FUNCTION
-- =====================================================

-- Function for scheduled cleanup (can be called periodically)
CREATE OR REPLACE FUNCTION schedule_analytics_cleanup()
RETURNS VOID AS $$
BEGIN
    -- This would be called by a scheduled job
    PERFORM cleanup_expired_analytics_cache();
END;
$$ LANGUAGE plpgsql;

-- Note: RLS is handled at the application level through service layer
-- All queries include tenant_id filters to ensure proper isolation
-- This approach avoids dependencies on user_roles and roles tables

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMENT ON TABLE analytics_dashboards IS 'Analytics dashboards for data visualization';
COMMENT ON TABLE dashboard_widgets IS 'Individual widgets within dashboards';
COMMENT ON TABLE analytics_cache IS 'Cache for analytics query results';
COMMENT ON TABLE computed_metrics IS 'User-defined computed metrics';
COMMENT ON TABLE dashboard_templates IS 'Reusable dashboard templates';
COMMENT ON TABLE kpi_configs IS 'Key Performance Indicator configurations';
COMMENT ON TABLE dashboard_shares IS 'Dashboard sharing permissions';
COMMENT ON TABLE dashboard_subscriptions IS 'Dashboard delivery subscriptions';
COMMENT ON TABLE report_templates IS 'Report templates for scheduled reports';
COMMENT ON TABLE scheduled_reports IS 'Scheduled report configurations';
COMMENT ON TABLE report_executions IS 'Report execution history and results';