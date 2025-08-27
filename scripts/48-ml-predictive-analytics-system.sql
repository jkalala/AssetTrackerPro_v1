-- =====================================================
-- ML AND PREDICTIVE ANALYTICS SYSTEM
-- =====================================================
-- Database schema for machine learning and predictive analytics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ML MODELS TABLE
-- =====================================================

CREATE TYPE model_type AS ENUM (
  'predictive_maintenance',
  'utilization_optimization', 
  'anomaly_detection',
  'lifecycle_forecasting',
  'cost_prediction'
);

CREATE TYPE model_status AS ENUM (
  'training',
  'ready',
  'error',
  'deprecated'
);

CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type model_type NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  status model_status DEFAULT 'training',
  accuracy DECIMAL(5,4),
  training_data_size INTEGER,
  features JSONB DEFAULT '[]',
  hyperparameters JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_trained_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, name, version)
);

-- Note: RLS handled at application level for ml_models

-- =====================================================
-- ML PREDICTIONS TABLE
-- =====================================================

CREATE TYPE prediction_type AS ENUM (
  'failure_risk',
  'maintenance_due',
  'replacement_needed',
  'utilization_optimization',
  'anomaly_detection',
  'lifecycle_forecast'
);

CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,
  prediction_type prediction_type NOT NULL,
  probability DECIMAL(5,4),
  confidence DECIMAL(5,4),
  predicted_date TIMESTAMPTZ,
  factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Note: RLS handled at application level for ml_predictions

-- =====================================================
-- UTILIZATION ANALYSES TABLE
-- =====================================================

CREATE TABLE utilization_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  current_utilization DECIMAL(5,4) NOT NULL,
  optimal_utilization DECIMAL(5,4) NOT NULL,
  efficiency_score DECIMAL(5,4) NOT NULL,
  recommendations JSONB DEFAULT '[]',
  cost_impact JSONB DEFAULT '{}',
  analysis_period_start TIMESTAMPTZ,
  analysis_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS handled at application level for utilization_analyses

-- =====================================================
-- ANOMALY DETECTIONS TABLE
-- =====================================================

CREATE TYPE anomaly_type AS ENUM (
  'performance',
  'usage',
  'sensor',
  'behavioral'
);

CREATE TYPE anomaly_severity AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

CREATE TABLE anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  anomaly_type anomaly_type NOT NULL,
  severity anomaly_severity NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '[]',
  suggested_actions JSONB DEFAULT '[]',
  resolution_notes TEXT
);

-- Note: RLS handled at application level for anomaly_detections

-- =====================================================
-- ASSET FORECASTS TABLE
-- =====================================================

CREATE TYPE forecast_type AS ENUM (
  'lifecycle',
  'replacement',
  'maintenance_cost',
  'utilization'
);

CREATE TABLE asset_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  forecast_type forecast_type NOT NULL,
  time_horizon_months INTEGER NOT NULL,
  predictions JSONB DEFAULT '[]',
  confidence_intervals JSONB DEFAULT '[]',
  assumptions JSONB DEFAULT '[]',
  accuracy_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ
);

-- Note: RLS handled at application level for asset_forecasts

-- =====================================================
-- ML INSIGHTS TABLE
-- =====================================================

CREATE TYPE insight_type AS ENUM (
  'maintenance_alert',
  'utilization_opportunity',
  'cost_optimization',
  'performance_degradation',
  'lifecycle_milestone'
);

CREATE TYPE insight_category AS ENUM (
  'maintenance',
  'operations',
  'financial',
  'performance',
  'compliance'
);

CREATE TYPE insight_impact AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TABLE ml_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type insight_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact insight_impact NOT NULL,
  category insight_category NOT NULL,
  data JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Note: RLS handled at application level for ml_insights

-- =====================================================
-- BATCH PROCESSING JOBS TABLE
-- =====================================================

CREATE TYPE batch_job_type AS ENUM (
  'maintenance_predictions',
  'utilization_analysis',
  'anomaly_detection',
  'lifecycle_forecasting'
);

CREATE TYPE batch_job_status AS ENUM (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TABLE ml_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_type batch_job_type NOT NULL,
  status batch_job_status DEFAULT 'queued',
  progress DECIMAL(5,2) DEFAULT 0,
  total_assets INTEGER NOT NULL,
  processed_assets INTEGER DEFAULT 0,
  results_summary JSONB DEFAULT '{}',
  error_message TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Note: RLS handled at application level for ml_batch_jobs

-- =====================================================
-- FEATURE IMPORTANCE TABLE
-- =====================================================

CREATE TABLE ml_feature_importance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  importance_score DECIMAL(8,6) NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, feature_name)
);

-- =====================================================
-- MODEL PERFORMANCE HISTORY TABLE
-- =====================================================

CREATE TABLE ml_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  confusion_matrix JSONB,
  validation_date TIMESTAMPTZ DEFAULT NOW(),
  test_data_size INTEGER
);

-- =====================================================
-- FUNCTIONS FOR ML OPERATIONS
-- =====================================================

-- Function to clean up expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ml_predictions 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get asset risk score
CREATE OR REPLACE FUNCTION get_asset_risk_score(p_tenant_id UUID, p_asset_id UUID)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  risk_score DECIMAL(5,4) := 0;
  maintenance_risk DECIMAL(5,4);
  anomaly_count INTEGER;
BEGIN
  -- Get latest maintenance prediction
  SELECT probability INTO maintenance_risk
  FROM ml_predictions
  WHERE tenant_id = p_tenant_id 
    AND asset_id = p_asset_id
    AND prediction_type = 'failure_risk'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Count recent anomalies
  SELECT COUNT(*) INTO anomaly_count
  FROM anomaly_detections
  WHERE tenant_id = p_tenant_id
    AND asset_id = p_asset_id
    AND detected_at > NOW() - INTERVAL '30 days'
    AND resolved_at IS NULL;
  
  -- Calculate composite risk score
  risk_score := COALESCE(maintenance_risk, 0) + (anomaly_count * 0.1);
  risk_score := LEAST(risk_score, 1.0); -- Cap at 1.0
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update model usage timestamp
CREATE OR REPLACE FUNCTION update_model_usage(p_model_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ml_models 
  SET last_used_at = NOW()
  WHERE id = p_model_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED JOBS FOR MAINTENANCE (OPTIONAL - REQUIRES pg_cron EXTENSION)
-- =====================================================

-- Note: These scheduled jobs require the pg_cron extension to be enabled
-- If pg_cron is not available, these jobs can be run manually or via external schedulers

-- Function to setup cron jobs if extension is available
CREATE OR REPLACE FUNCTION setup_ml_cron_jobs()
RETURNS TEXT AS $$
BEGIN
  -- Check if cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Create a job to clean up expired predictions daily
    PERFORM cron.schedule(
      'cleanup-expired-predictions',
      '0 2 * * *', -- Daily at 2 AM
      'SELECT cleanup_expired_predictions();'
    );

    -- Create a job to update model performance metrics weekly
    PERFORM cron.schedule(
      'update-model-metrics',
      '0 3 * * 0', -- Weekly on Sunday at 3 AM
      'SELECT 1;' -- Placeholder - would implement model performance updates
    );

    RETURN 'ML cron jobs scheduled successfully';
  ELSE
    RETURN 'pg_cron extension not available - ML jobs not scheduled';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Try to setup cron jobs (will gracefully handle missing extension)
SELECT setup_ml_cron_jobs();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_predictions_tenant_asset ON ml_predictions(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_type_date ON ml_predictions(prediction_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_expires ON ml_predictions(expires_at);

CREATE INDEX IF NOT EXISTS idx_utilization_analyses_tenant_asset ON utilization_analyses(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_utilization_analyses_efficiency ON utilization_analyses(efficiency_score);
CREATE INDEX IF NOT EXISTS idx_utilization_analyses_date ON utilization_analyses(created_at);

CREATE INDEX IF NOT EXISTS idx_anomaly_detections_tenant_asset ON anomaly_detections(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_severity ON anomaly_detections(severity);

CREATE INDEX IF NOT EXISTS idx_asset_forecasts_tenant_asset ON asset_forecasts(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_forecasts_type ON asset_forecasts(forecast_type);
CREATE INDEX IF NOT EXISTS idx_asset_forecasts_validity ON asset_forecasts(valid_until);

CREATE INDEX IF NOT EXISTS idx_ml_insights_tenant_category ON ml_insights(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_ml_insights_impact ON ml_insights(impact);
CREATE INDEX IF NOT EXISTS idx_ml_insights_status ON ml_insights(status);
CREATE INDEX IF NOT EXISTS idx_ml_insights_expires ON ml_insights(expires_at);

CREATE INDEX IF NOT EXISTS idx_ml_batch_jobs_tenant_status ON ml_batch_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ml_batch_jobs_type ON ml_batch_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ml_batch_jobs_created ON ml_batch_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_ml_feature_importance_model ON ml_feature_importance(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_feature_importance_rank ON ml_feature_importance(rank);

CREATE INDEX IF NOT EXISTS idx_ml_model_performance_model ON ml_model_performance(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_model_performance_date ON ml_model_performance(validation_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ml_predictions_tenant_type_date ON ml_predictions(tenant_id, prediction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_tenant_severity_date ON anomaly_detections(tenant_id, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_utilization_analyses_tenant_efficiency ON utilization_analyses(tenant_id, efficiency_score);
CREATE INDEX IF NOT EXISTS idx_ml_insights_tenant_impact_status ON ml_insights(tenant_id, impact, status);

-- Partial indexes for active records (without NOW() function to avoid IMMUTABLE requirement)
CREATE INDEX IF NOT EXISTS idx_ml_predictions_active ON ml_predictions(tenant_id, asset_id, expires_at) 
  WHERE expires_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_unresolved ON anomaly_detections(tenant_id, asset_id, severity) 
  WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ml_insights_active ON ml_insights(tenant_id, category, impact) 
  WHERE status = 'active';

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for asset risk summary (simplified to avoid tenant_id column dependency)
CREATE VIEW asset_risk_summary AS
SELECT
  mp.tenant_id,
  a.id as asset_id,
  a.name as asset_name,
  COUNT(DISTINCT mp.id) as prediction_count,
  COUNT(DISTINCT ad.id) as anomaly_count,
  MAX(mp.created_at) as last_prediction_date,
  MAX(ad.detected_at) as last_anomaly_date
FROM assets a
LEFT JOIN ml_predictions mp ON a.id = mp.asset_id
LEFT JOIN anomaly_detections ad ON a.id = ad.asset_id AND mp.tenant_id = ad.tenant_id
WHERE mp.tenant_id IS NOT NULL
GROUP BY mp.tenant_id, a.id, a.name;

-- View for ML insights dashboard
CREATE VIEW ml_insights_dashboard AS
SELECT 
  tenant_id,
  category,
  impact,
  COUNT(*) as insight_count,
  COUNT(*) FILTER (WHERE acknowledged_at IS NULL) as unacknowledged_count,
  MAX(created_at) as latest_insight_date
FROM ml_insights
WHERE status = 'active'
GROUP BY tenant_id, category, impact;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON ml_models TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ml_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON utilization_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON anomaly_detections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON asset_forecasts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ml_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ml_batch_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ml_feature_importance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ml_model_performance TO authenticated;

-- Grant permissions on views
GRANT SELECT ON asset_risk_summary TO authenticated;
GRANT SELECT ON ml_insights_dashboard TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE ml_models IS 'Machine learning models and their metadata';
COMMENT ON TABLE ml_predictions IS 'Predictions generated by ML models';
COMMENT ON TABLE utilization_analyses IS 'Asset utilization optimization analyses';
COMMENT ON TABLE anomaly_detections IS 'Detected anomalies in asset behavior';
COMMENT ON TABLE asset_forecasts IS 'Forecasts for asset lifecycle and performance';
COMMENT ON TABLE ml_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE ml_batch_jobs IS 'Batch processing jobs for ML operations';
COMMENT ON TABLE ml_feature_importance IS 'Feature importance scores for ML models';
COMMENT ON TABLE ml_model_performance IS 'Historical performance metrics for ML models';