-- =====================================================
-- ANALYTICS AND DASHBOARD SYSTEM SCHEMA
-- =====================================================
-- Database schema for real-time dashboards and analytics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DASHBOARD TABLES
-- =====================================================

-- Dashboard configurations
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL DEFAULT '{"columns": 12, "rows": 8, "gap": 16, "responsive": true}',
    widgets JSONB NOT NULL DEFAULT '[]',
    filters JSONB NOT NULL DEFAULT '[]',
    refresh_interval VARCHAR(10) NOT NULL DEFAULT '5m',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT dashboards_tenant_name_unique UNIQUE(tenant_id, name)
);

-- Dashboard templates for quick setup
CREATE TABLE IF NOT EXISTS dashboard_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    preview_image TEXT,
    config JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI configurations
CREATE TABLE IF NOT EXISTS kpi_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric JSONB NOT NULL,
    target DECIMAL(15,2),
    thresholds JSONB NOT NULL DEFAULT '[]',
    time_range VARCHAR(10) NOT NULL DEFAULT '30d',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT kpi_configs_tenant_name_unique UNIQUE(tenant_id, name)
);

-- Dashboard sharing and permissions
CREATE TABLE IF NOT EXISTS dashboard_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    share_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time dashboard subscriptions
CREATE TABLE IF NOT EXISTS dashboard_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) NOT NULL,
    filters JSONB DEFAULT '{}',
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT dashboard_subscriptions_unique UNIQUE(dashboard_id, user_id, connection_id)
);

-- =====================================================
-- ANALYTICS CACHE TABLES
-- =====================================================

-- Cache for expensive analytics queries
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cache_key VARCHAR(255) NOT NULL,
    query_hash VARCHAR(64) NOT NULL,
    result JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT analytics_cache_tenant_key_unique UNIQUE(tenant_id, cache_key)
);

-- Pre-computed metrics for faster dashboard loading
CREATE TABLE IF NOT EXISTS computed_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    time_period VARCHAR(10) NOT NULL,
    filters JSONB DEFAULT '{}',
    value DECIMAL(15,4) NOT NULL,
    metadata JSONB DEFAULT '{}',
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT computed_metrics_unique UNIQUE(tenant_id, metric_name, metric_type, time_period, filters)
);

-- =====================================================
-- REPORTING TABLES
-- =====================================================

-- Report templates and configurations
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- 'dashboard', 'table', 'chart', 'custom'
    config JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT report_templates_tenant_name_unique UNIQUE(tenant_id, name)
);

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    schedule_cron VARCHAR(100) NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]',
    format VARCHAR(20) NOT NULL DEFAULT 'pdf',
    filters JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report execution history
CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT,
    file_size BIGINT,
    error_message TEXT,
    execution_time_ms INTEGER,
    recipients_notified JSONB DEFAULT '[]'
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Dashboard indexes
CREATE INDEX IF NOT EXISTS idx_dashboards_tenant_id ON dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_updated_at ON dashboards(updated_at DESC);

-- KPI indexes
CREATE INDEX IF NOT EXISTS idx_kpi_configs_tenant_id ON kpi_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_configs_active ON kpi_configs(tenant_id, is_active);

-- Dashboard shares indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_token ON dashboard_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_expires ON dashboard_shares(expires_at) WHERE expires_at IS NOT NULL;

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_subscriptions_dashboard ON dashboard_subscriptions(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_subscriptions_user ON dashboard_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_subscriptions_ping ON dashboard_subscriptions(last_ping);

-- Analytics cache indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_tenant_key ON analytics_cache(tenant_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Computed metrics indexes
CREATE INDEX IF NOT EXISTS idx_computed_metrics_tenant ON computed_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_computed_metrics_name ON computed_metrics(tenant_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_computed_metrics_expires ON computed_metrics(expires_at);

-- Report indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant ON scheduled_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_executions_scheduled ON report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status, started_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE computed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Dashboard policies
CREATE POLICY "Users can view dashboards in their tenant" ON dashboards
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND
        (created_by = auth.uid() OR is_public = true OR 
         EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() AND ur.tenant_id = tenant_id 
                AND r.name IN ('admin', 'manager')))
    );

CREATE POLICY "Users can create dashboards in their tenant" ON dashboards
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id() AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can update their own dashboards or with admin role" ON dashboards
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id() AND
        (created_by = auth.uid() OR 
         EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() AND ur.tenant_id = tenant_id 
                AND r.name IN ('admin', 'manager')))
    );

CREATE POLICY "Users can delete their own dashboards or with admin role" ON dashboards
    FOR DELETE USING (
        tenant_id = get_current_tenant_id() AND
        (created_by = auth.uid() OR 
         EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() AND ur.tenant_id = tenant_id 
                AND r.name = 'admin'))
    );

-- Dashboard template policies (public read access)
CREATE POLICY "Anyone can view public dashboard templates" ON dashboard_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create dashboard templates" ON dashboard_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- KPI config policies
CREATE POLICY "Users can manage KPIs in their tenant" ON kpi_configs
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND
        EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
               WHERE ur.user_id = auth.uid() AND ur.tenant_id = tenant_id 
               AND r.name IN ('admin', 'manager', 'analyst'))
    );

-- Dashboard share policies
CREATE POLICY "Users can manage shares for their dashboards" ON dashboard_shares
    FOR ALL USING (
        EXISTS(SELECT 1 FROM dashboards d 
               WHERE d.id = dashboard_id AND d.tenant_id = get_current_tenant_id() 
               AND (d.created_by = auth.uid() OR 
                    EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                           WHERE ur.user_id = auth.uid() AND ur.tenant_id = d.tenant_id 
                           AND r.name IN ('admin', 'manager'))))
    );

-- Subscription policies
CREATE POLICY "Users can manage their own subscriptions" ON dashboard_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- Analytics cache policies
CREATE POLICY "Users can access cache for their tenant" ON analytics_cache
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- Computed metrics policies
CREATE POLICY "Users can access metrics for their tenant" ON computed_metrics
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- Report template policies
CREATE POLICY "Users can manage report templates in their tenant" ON report_templates
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND
        (created_by = auth.uid() OR is_public = true OR
         EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() AND ur.tenant_id = tenant_id 
                AND r.name IN ('admin', 'manager', 'analyst')))
    );

-- Scheduled report policies
CREATE POLICY "Users can manage scheduled reports in their tenant" ON scheduled_reports
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND
        EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
               WHERE ur.user_id = auth.uid() AND ur.tenant_id = tenant_id 
               AND r.name IN ('admin', 'manager', 'analyst'))
    );

-- Report execution policies
CREATE POLICY "Users can view report executions for their tenant" ON report_executions
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM scheduled_reports sr 
               WHERE sr.id = scheduled_report_id AND sr.tenant_id = get_current_tenant_id())
    );

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM computed_metrics WHERE expires_at < NOW();
    
    -- Clean up old dashboard subscriptions (inactive for more than 1 hour)
    DELETE FROM dashboard_subscriptions WHERE last_ping < NOW() - INTERVAL '1 hour';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update dashboard subscription ping
CREATE OR REPLACE FUNCTION update_dashboard_subscription_ping(
    p_dashboard_id UUID,
    p_user_id UUID,
    p_connection_id VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO dashboard_subscriptions (dashboard_id, user_id, connection_id, last_ping)
    VALUES (p_dashboard_id, p_user_id, p_connection_id, NOW())
    ON CONFLICT (dashboard_id, user_id, connection_id)
    DO UPDATE SET last_ping = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard metrics summary
CREATE OR REPLACE FUNCTION get_dashboard_metrics_summary(p_tenant_id UUID)
RETURNS TABLE(
    total_dashboards BIGINT,
    public_dashboards BIGINT,
    active_subscriptions BIGINT,
    total_kpis BIGINT,
    active_kpis BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM dashboards WHERE tenant_id = p_tenant_id),
        (SELECT COUNT(*) FROM dashboards WHERE tenant_id = p_tenant_id AND is_public = true),
        (SELECT COUNT(*) FROM dashboard_subscriptions ds 
         JOIN dashboards d ON ds.dashboard_id = d.id 
         WHERE d.tenant_id = p_tenant_id AND ds.last_ping > NOW() - INTERVAL '5 minutes'),
        (SELECT COUNT(*) FROM kpi_configs WHERE tenant_id = p_tenant_id),
        (SELECT COUNT(*) FROM kpi_configs WHERE tenant_id = p_tenant_id AND is_active = true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on dashboard changes
CREATE OR REPLACE FUNCTION update_dashboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboard_updated_at
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER trigger_update_kpi_config_updated_at
    BEFORE UPDATE ON kpi_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER trigger_update_report_template_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER trigger_update_scheduled_report_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_updated_at();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample dashboard templates
INSERT INTO dashboard_templates (name, description, category, config, created_by) VALUES
('Asset Overview', 'Comprehensive asset management dashboard with key metrics and charts', 'asset-management', '{
    "name": "Asset Overview",
    "layout": {"columns": 12, "rows": 8, "gap": 16, "responsive": true},
    "widgets": [
        {
            "id": "total-assets",
            "type": "metric",
            "title": "Total Assets",
            "position": {"x": 0, "y": 0},
            "size": {"width": 3, "height": 2},
            "data_source": {
                "type": "sql",
                "query": "SELECT COUNT(*) as value FROM assets WHERE status = ''active''"
            },
            "visualization": {
                "metrics": [{"field": "value", "label": "Assets", "aggregation": "sum", "format": "number"}]
            }
        },
        {
            "id": "asset-value",
            "type": "metric",
            "title": "Total Asset Value",
            "position": {"x": 3, "y": 0},
            "size": {"width": 3, "height": 2},
            "data_source": {
                "type": "sql",
                "query": "SELECT SUM(purchase_price) as value FROM assets WHERE status = ''active''"
            },
            "visualization": {
                "metrics": [{"field": "value", "label": "Value", "aggregation": "sum", "format": "currency"}]
            }
        }
    ],
    "filters": [],
    "refresh_interval": "5m",
    "is_public": false
}', (SELECT id FROM profiles LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Create a cleanup job (this would typically be handled by a cron job or scheduled task)
-- For demonstration purposes, we''ll create a function that can be called periodically
CREATE OR REPLACE FUNCTION schedule_analytics_cleanup()
RETURNS VOID AS $$
BEGIN
    -- This would be called by a scheduled job
    PERFORM cleanup_expired_analytics_cache();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;