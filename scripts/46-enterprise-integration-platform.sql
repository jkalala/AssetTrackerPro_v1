-- Enterprise Integration Platform Migration
-- Creates tables for integrations, webhooks, and related functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Integration types enum
CREATE TYPE integration_type AS ENUM (
  'ERP_SAP',
  'ERP_ORACLE', 
  'ERP_DYNAMICS',
  'CMMS_MAXIMO',
  'CMMS_MAINTENANCE_CONNECTION',
  'LDAP',
  'ACTIVE_DIRECTORY',
  'WEBHOOK'
);

-- Integration status enum
CREATE TYPE integration_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'ERROR',
  'SYNCING'
);

-- Webhook delivery status enum
CREATE TYPE webhook_delivery_status AS ENUM (
  'PENDING',
  'DELIVERED',
  'FAILED',
  'RETRYING',
  'EXHAUSTED'
);

-- Sync result status enum
CREATE TYPE sync_result_status AS ENUM (
  'RUNNING',
  'SUCCESS',
  'PARTIAL',
  'FAILED'
);

-- Integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type integration_type NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  status integration_status NOT NULL DEFAULT 'INACTIVE',
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT integrations_tenant_name_unique UNIQUE (tenant_id, name)
);

-- Integration sync results table
CREATE TABLE integration_sync_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  status sync_result_status NOT NULL DEFAULT 'RUNNING',
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_succeeded INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  errors TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT sync_results_counts_valid CHECK (
    records_processed = records_succeeded + records_failed
  )
);

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_policy JSONB NOT NULL DEFAULT '{
    "maxAttempts": 5,
    "backoffMultiplier": 2,
    "initialDelay": 1000,
    "maxDelay": 300000
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT webhooks_tenant_name_unique UNIQUE (tenant_id, name),
  CONSTRAINT webhooks_url_valid CHECK (url ~ '^https?://'),
  CONSTRAINT webhooks_events_not_empty CHECK (array_length(events, 1) > 0)
);

-- Webhook deliveries table
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status webhook_delivery_status NOT NULL DEFAULT 'PENDING',
  response_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT webhook_deliveries_attempt_positive CHECK (attempt_number > 0),
  CONSTRAINT webhook_deliveries_response_code_valid CHECK (
    response_code IS NULL OR (response_code >= 100 AND response_code < 600)
  )
);

-- API keys table (enhanced for integration access)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  rate_limit INTEGER NOT NULL DEFAULT 1000, -- requests per minute
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT api_keys_tenant_name_unique UNIQUE (tenant_id, name),
  CONSTRAINT api_keys_rate_limit_positive CHECK (rate_limit > 0)
);

-- API key usage tracking
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT api_key_usage_status_code_valid CHECK (
    status_code >= 100 AND status_code < 600
  ),
  CONSTRAINT api_key_usage_response_time_positive CHECK (
    response_time_ms IS NULL OR response_time_ms >= 0
  )
);

-- Event log table for webhook events
CREATE TABLE event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for efficient querying
  CONSTRAINT event_log_event_type_not_empty CHECK (event_type != ''),
  CONSTRAINT event_log_resource_type_not_empty CHECK (resource_type != '')
);

-- Indexes for performance
CREATE INDEX idx_integrations_tenant_id ON integrations(tenant_id);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_next_sync ON integrations(next_sync_at) WHERE next_sync_at IS NOT NULL;

CREATE INDEX idx_integration_sync_results_integration_id ON integration_sync_results(integration_id);
CREATE INDEX idx_integration_sync_results_status ON integration_sync_results(status);
CREATE INDEX idx_integration_sync_results_started_at ON integration_sync_results(started_at);

CREATE INDEX idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_api_key_usage_api_key_id ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_created_at ON api_key_usage(created_at);
CREATE INDEX idx_api_key_usage_endpoint ON api_key_usage(endpoint);

CREATE INDEX idx_event_log_tenant_id ON event_log(tenant_id);
CREATE INDEX idx_event_log_event_type ON event_log(event_type);
CREATE INDEX idx_event_log_resource ON event_log(resource_type, resource_id);
CREATE INDEX idx_event_log_created_at ON event_log(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations
CREATE POLICY "Users can view integrations in their tenant" ON integrations
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage integrations in their tenant" ON integrations
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    )
  );

-- RLS Policies for integration sync results
CREATE POLICY "Users can view sync results for their tenant integrations" ON integration_sync_results
  FOR SELECT USING (
    integration_id IN (
      SELECT id FROM integrations 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage sync results" ON integration_sync_results
  FOR ALL USING (true);

-- RLS Policies for webhooks
CREATE POLICY "Users can view webhooks in their tenant" ON webhooks
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage webhooks in their tenant" ON webhooks
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    )
  );

-- RLS Policies for webhook deliveries
CREATE POLICY "Users can view webhook deliveries for their tenant webhooks" ON webhook_deliveries
  FOR SELECT USING (
    webhook_id IN (
      SELECT id FROM webhooks 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage webhook deliveries" ON webhook_deliveries
  FOR ALL USING (true);

-- RLS Policies for API keys
CREATE POLICY "Users can view API keys in their tenant" ON api_keys
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage API keys in their tenant" ON api_keys
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    )
  );

-- RLS Policies for API key usage
CREATE POLICY "Users can view API key usage for their tenant keys" ON api_key_usage
  FOR SELECT USING (
    api_key_id IN (
      SELECT id FROM api_keys 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can log API key usage" ON api_key_usage
  FOR INSERT WITH CHECK (true);

-- RLS Policies for event log
CREATE POLICY "Users can view events in their tenant" ON event_log
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can log events" ON event_log
  FOR INSERT WITH CHECK (true);

-- Functions for webhook event processing
CREATE OR REPLACE FUNCTION trigger_webhook_event(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_data JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
BEGIN
  -- Log the event
  INSERT INTO event_log (tenant_id, event_type, resource_type, resource_id, data)
  VALUES (p_tenant_id, p_event_type, p_resource_type, p_resource_id, p_data);
  
  -- Create webhook deliveries for active webhooks that listen to this event
  INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status, created_at)
  SELECT 
    w.id,
    p_event_type,
    jsonb_build_object(
      'id', gen_random_uuid(),
      'event', p_event_type,
      'data', p_data,
      'timestamp', NOW(),
      'tenant_id', p_tenant_id,
      'resource_type', p_resource_type,
      'resource_id', p_resource_id
    ),
    'PENDING',
    NOW()
  FROM webhooks w
  WHERE w.tenant_id = p_tenant_id
    AND w.is_active = true
    AND p_event_type = ANY(w.events);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old webhook deliveries
CREATE OR REPLACE FUNCTION cleanup_webhook_deliveries() RETURNS VOID AS $$
BEGIN
  -- Delete webhook deliveries older than 30 days
  DELETE FROM webhook_deliveries 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete API key usage logs older than 90 days
  DELETE FROM api_key_usage 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete event logs older than 1 year
  DELETE FROM event_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get integration statistics
CREATE OR REPLACE FUNCTION get_integration_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_integrations BIGINT,
  active_integrations BIGINT,
  failed_integrations BIGINT,
  total_syncs_today BIGINT,
  successful_syncs_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_integrations,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_integrations,
    COUNT(*) FILTER (WHERE status = 'ERROR') as failed_integrations,
    COALESCE(sync_stats.total_syncs_today, 0) as total_syncs_today,
    COALESCE(sync_stats.successful_syncs_today, 0) as successful_syncs_today
  FROM integrations i
  LEFT JOIN (
    SELECT 
      COUNT(*) as total_syncs_today,
      COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful_syncs_today
    FROM integration_sync_results isr
    JOIN integrations i2 ON isr.integration_id = i2.id
    WHERE i2.tenant_id = p_tenant_id
      AND isr.started_at >= CURRENT_DATE
  ) sync_stats ON true
  WHERE i.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_webhooks BIGINT,
  active_webhooks BIGINT,
  total_deliveries_today BIGINT,
  successful_deliveries_today BIGINT,
  failed_deliveries_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_webhooks,
    COUNT(*) FILTER (WHERE is_active = true) as active_webhooks,
    COALESCE(delivery_stats.total_deliveries_today, 0) as total_deliveries_today,
    COALESCE(delivery_stats.successful_deliveries_today, 0) as successful_deliveries_today,
    COALESCE(delivery_stats.failed_deliveries_today, 0) as failed_deliveries_today
  FROM webhooks w
  LEFT JOIN (
    SELECT 
      COUNT(*) as total_deliveries_today,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') as successful_deliveries_today,
      COUNT(*) FILTER (WHERE status IN ('FAILED', 'EXHAUSTED')) as failed_deliveries_today
    FROM webhook_deliveries wd
    JOIN webhooks w2 ON wd.webhook_id = w2.id
    WHERE w2.tenant_id = p_tenant_id
      AND wd.created_at >= CURRENT_DATE
  ) delivery_stats ON true
  WHERE w.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic webhook events
CREATE OR REPLACE FUNCTION assets_webhook_trigger() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM trigger_webhook_event(
      NEW.tenant_id,
      'asset.created',
      'asset',
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM trigger_webhook_event(
      NEW.tenant_id,
      'asset.updated',
      'asset',
      NEW.id,
      jsonb_build_object(
        'before', to_jsonb(OLD),
        'after', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM trigger_webhook_event(
      OLD.tenant_id,
      'asset.deleted',
      'asset',
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for asset webhook events
DROP TRIGGER IF EXISTS assets_webhook_trigger ON assets;
CREATE TRIGGER assets_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION assets_webhook_trigger();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION trigger_webhook_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_integration_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_webhook_stats TO authenticated;

-- Create a scheduled job to clean up old data (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-webhook-data', '0 2 * * *', 'SELECT cleanup_webhook_deliveries();');

COMMENT ON TABLE integrations IS 'Enterprise system integrations (ERP, CMMS, LDAP, etc.)';
COMMENT ON TABLE integration_sync_results IS 'Results and logs from integration synchronization runs';
COMMENT ON TABLE webhooks IS 'Webhook configurations for event notifications';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and results';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE api_key_usage IS 'API key usage tracking and analytics';
COMMENT ON TABLE event_log IS 'System event log for webhook triggers and audit trails';