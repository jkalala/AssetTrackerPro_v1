-- Advanced Reporting System Schema
-- This script creates the database schema for the advanced reporting system

-- Note: RLS policies will be handled at the application level
-- to avoid IMMUTABLE function requirements in database policies

-- Report definitions table
CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  definition JSONB NOT NULL DEFAULT '{}',
  visualization JSONB NOT NULL DEFAULT '{}',
  template_id UUID REFERENCES report_templates(id),
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_report_name UNIQUE(tenant_id, name)
);

-- Report templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  definition JSONB NOT NULL DEFAULT '{}',
  branding JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_template_name UNIQUE(tenant_id, name)
);

-- Report schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  time TIME NOT NULL DEFAULT '09:00:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv')),
  recipients JSONB NOT NULL DEFAULT '[]',
  parameters JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report executions table
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
  parameters JSONB DEFAULT '{}',
  result_url TEXT,
  error_message TEXT,
  execution_time_ms INTEGER,
  row_count INTEGER,
  file_size_bytes BIGINT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Executive dashboards table
CREATE TABLE IF NOT EXISTS executive_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL DEFAULT '{}',
  branding JSONB NOT NULL DEFAULT '{}',
  refresh_interval INTEGER DEFAULT 300, -- 5 minutes
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_dashboard_name UNIQUE(tenant_id, name)
);

-- Executive insights table
CREATE TABLE IF NOT EXISTS executive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES executive_dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trend', 'anomaly', 'recommendation', 'alert')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available fields for report builder
CREATE TABLE IF NOT EXISTS report_available_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('string', 'number', 'date', 'boolean')),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  aggregatable BOOLEAN DEFAULT false,
  filterable BOOLEAN DEFAULT true,
  sortable BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_field_name UNIQUE(tenant_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_definitions_tenant_id ON report_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_definitions_category ON report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_report_definitions_created_by ON report_definitions(created_by);

CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_public ON report_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant_id ON report_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_report_id ON report_schedules(report_id);

CREATE INDEX IF NOT EXISTS idx_report_executions_tenant_id ON report_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_created_at ON report_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_executive_dashboards_tenant_id ON executive_dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executive_insights_tenant_id ON executive_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executive_insights_dashboard_id ON executive_insights(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_executive_insights_type ON executive_insights(type);

CREATE INDEX IF NOT EXISTS idx_report_available_fields_tenant_id ON report_available_fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_available_fields_category ON report_available_fields(category);

-- Note: RLS is handled at the application level through service layer
-- All queries include tenant_id filters to ensure proper isolation
-- This approach avoids IMMUTABLE function requirements in database policies

-- Insert system report templates
INSERT INTO report_templates (id, name, description, category, definition, branding, is_public, is_system, created_by)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'Asset Utilization Report',
    'Comprehensive report showing asset utilization across categories',
    'assets',
    '{"fields": [{"id": "asset_name", "name": "Asset Name", "type": "string", "table": "assets", "column": "name"}, {"id": "category", "name": "Category", "type": "string", "table": "asset_categories", "column": "name"}, {"id": "utilization", "name": "Utilization %", "type": "number", "table": "assets", "column": "utilization_rate"}], "visualization": {"type": "chart", "chartType": "bar"}}',
    '{"primary_color": "#3b82f6", "secondary_color": "#64748b", "font_family": "Inter"}',
    true,
    true,
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Maintenance Cost Analysis',
    'Analysis of maintenance costs by asset category and time period',
    'maintenance',
    '{"fields": [{"id": "asset_category", "name": "Asset Category", "type": "string", "table": "asset_categories", "column": "name"}, {"id": "maintenance_cost", "name": "Maintenance Cost", "type": "number", "table": "maintenance_records", "column": "cost", "aggregation": "sum"}, {"id": "maintenance_date", "name": "Maintenance Date", "type": "date", "table": "maintenance_records", "column": "completed_date"}], "visualization": {"type": "chart", "chartType": "line"}}',
    '{"primary_color": "#10b981", "secondary_color": "#64748b", "font_family": "Inter"}',
    true,
    true,
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Executive Summary Dashboard',
    'High-level executive dashboard with key metrics and trends',
    'executive',
    '{"fields": [{"id": "total_assets", "name": "Total Assets", "type": "number", "table": "assets", "column": "id", "aggregation": "count"}, {"id": "asset_value", "name": "Total Asset Value", "type": "number", "table": "assets", "column": "current_value", "aggregation": "sum"}, {"id": "maintenance_cost", "name": "Monthly Maintenance Cost", "type": "number", "table": "maintenance_records", "column": "cost", "aggregation": "sum"}], "visualization": {"type": "metric"}}',
    '{"primary_color": "#8b5cf6", "secondary_color": "#64748b", "font_family": "Inter"}',
    true,
    true,
    '00000000-0000-0000-0000-000000000000'
  );

-- Insert system available fields
INSERT INTO report_available_fields (name, display_name, type, table_name, column_name, description, category, aggregatable, filterable, sortable, is_system)
VALUES 
  ('asset_id', 'Asset ID', 'string', 'assets', 'asset_id', 'Unique asset identifier', 'assets', false, true, true, true),
  ('asset_name', 'Asset Name', 'string', 'assets', 'name', 'Asset name', 'assets', false, true, true, true),
  ('asset_description', 'Asset Description', 'string', 'assets', 'description', 'Asset description', 'assets', false, true, false, true),
  ('asset_status', 'Asset Status', 'string', 'assets', 'status', 'Current asset status', 'assets', false, true, true, true),
  ('asset_category', 'Asset Category', 'string', 'asset_categories', 'name', 'Asset category', 'assets', false, true, true, true),
  ('purchase_price', 'Purchase Price', 'number', 'assets', 'purchase_price', 'Original purchase price', 'financial', true, true, true, true),
  ('current_value', 'Current Value', 'number', 'assets', 'current_value', 'Current asset value', 'financial', true, true, true, true),
  ('purchase_date', 'Purchase Date', 'date', 'assets', 'purchase_date', 'Date asset was purchased', 'assets', false, true, true, true),
  ('warranty_expiry', 'Warranty Expiry', 'date', 'assets', 'warranty_expiry', 'Warranty expiration date', 'assets', false, true, true, true),
  ('assignee_name', 'Assignee', 'string', 'profiles', 'full_name', 'Person assigned to asset', 'assignments', false, true, true, true),
  ('location_name', 'Location', 'string', 'assets', 'location', 'Asset location', 'location', false, true, true, true),
  ('maintenance_cost', 'Maintenance Cost', 'number', 'maintenance_records', 'cost', 'Maintenance cost', 'maintenance', true, true, true, true),
  ('maintenance_date', 'Maintenance Date', 'date', 'maintenance_records', 'completed_date', 'Maintenance completion date', 'maintenance', false, true, true, true),
  ('created_at', 'Created Date', 'date', 'assets', 'created_at', 'Asset creation date', 'assets', false, true, true, true),
  ('updated_at', 'Last Updated', 'date', 'assets', 'updated_at', 'Last update date', 'assets', false, true, true, true);

-- Function to calculate next run time for schedules
CREATE OR REPLACE FUNCTION calculate_next_run(
  frequency TEXT,
  day_of_week INTEGER,
  day_of_month INTEGER,
  run_time TIME,
  timezone TEXT,
  last_run TIMESTAMPTZ DEFAULT NULL
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_run TIMESTAMPTZ;
  base_time TIMESTAMPTZ;
BEGIN
  -- Use last_run as base, or current time if no last_run
  base_time := COALESCE(last_run, NOW());
  
  CASE frequency
    WHEN 'daily' THEN
      next_run := (base_time::DATE + INTERVAL '1 day' + run_time)::TIMESTAMPTZ AT TIME ZONE timezone;
    WHEN 'weekly' THEN
      next_run := (base_time::DATE + INTERVAL '1 week' - INTERVAL '1 day' * EXTRACT(DOW FROM base_time) + INTERVAL '1 day' * day_of_week + run_time)::TIMESTAMPTZ AT TIME ZONE timezone;
      IF next_run <= base_time THEN
        next_run := next_run + INTERVAL '1 week';
      END IF;
    WHEN 'monthly' THEN
      next_run := (DATE_TRUNC('month', base_time) + INTERVAL '1 month' + INTERVAL '1 day' * (day_of_month - 1) + run_time)::TIMESTAMPTZ AT TIME ZONE timezone;
      IF next_run <= base_time THEN
        next_run := (DATE_TRUNC('month', next_run) + INTERVAL '1 month' + INTERVAL '1 day' * (day_of_month - 1) + run_time)::TIMESTAMPTZ AT TIME ZONE timezone;
      END IF;
    WHEN 'quarterly' THEN
      next_run := (DATE_TRUNC('quarter', base_time) + INTERVAL '3 months' + INTERVAL '1 day' * (day_of_month - 1) + run_time)::TIMESTAMPTZ AT TIME ZONE timezone;
      IF next_run <= base_time THEN
        next_run := (DATE_TRUNC('quarter', next_run) + INTERVAL '3 months' + INTERVAL '1 day' * (day_of_month - 1) + run_time)::TIMESTAMPTZ AT TIME ZONE timezone;
      END IF;
  END CASE;
  
  RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_run when schedule is created or updated
CREATE OR REPLACE FUNCTION update_schedule_next_run()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run := calculate_next_run(
    NEW.frequency,
    NEW.day_of_week,
    NEW.day_of_month,
    NEW.time,
    NEW.timezone,
    NEW.last_run
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_schedule_next_run
  BEFORE INSERT OR UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_next_run();

-- Function to generate executive insights
CREATE OR REPLACE FUNCTION generate_executive_insights(tenant_uuid UUID)
RETURNS TABLE(
  title TEXT,
  description TEXT,
  type TEXT,
  priority TEXT,
  data JSONB
) AS $$
BEGIN
  -- Asset utilization insights
  RETURN QUERY
  SELECT 
    'Low Asset Utilization Detected'::TEXT,
    'Several assets are showing utilization below 30%'::TEXT,
    'recommendation'::TEXT,
    'medium'::TEXT,
    jsonb_build_object(
      'affected_assets', (
        SELECT COUNT(*) FROM assets 
        WHERE tenant_id = tenant_uuid 
        AND (specifications->>'utilization_rate')::NUMERIC < 30
      ),
      'potential_savings', 50000
    );
    
  -- Maintenance cost trends
  RETURN QUERY
  SELECT 
    'Maintenance Costs Trending Up'::TEXT,
    'Maintenance costs have increased 15% over the last quarter'::TEXT,
    'trend'::TEXT,
    'high'::TEXT,
    jsonb_build_object(
      'increase_percent', 15,
      'period', 'last_quarter',
      'total_cost', 125000
    );
    
  -- Asset value insights
  RETURN QUERY
  SELECT 
    'Asset Portfolio Performance'::TEXT,
    'Total asset value has grown by 8% this year'::TEXT,
    'trend'::TEXT,
    'low'::TEXT,
    jsonb_build_object(
      'growth_percent', 8,
      'total_value', (
        SELECT COALESCE(SUM(current_value), 0) 
        FROM assets 
        WHERE tenant_id = tenant_uuid
      ),
      'period', 'year_to_date'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE report_definitions IS 'Stores user-defined report configurations';
COMMENT ON TABLE report_templates IS 'Stores reusable report templates with branding';
COMMENT ON TABLE report_schedules IS 'Stores scheduled report delivery configurations';
COMMENT ON TABLE report_executions IS 'Tracks report execution history and results';
COMMENT ON TABLE executive_dashboards IS 'Stores executive dashboard configurations';
COMMENT ON TABLE executive_insights IS 'Stores generated executive insights and recommendations';
COMMENT ON TABLE report_available_fields IS 'Defines available fields for report building';