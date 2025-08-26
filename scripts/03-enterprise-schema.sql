-- =====================================================
-- ENTERPRISE ASSET MANAGEMENT PLATFORM - DATABASE SCHEMA
-- =====================================================
-- This script creates the enhanced database schema for enterprise features
-- including multi-tenancy, advanced asset management, IoT integration,
-- geospatial capabilities, and comprehensive audit logging.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- CUSTOM TYPES AND ENUMS
-- =====================================================

-- Tenant status enum
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial', 'cancelled');

-- Subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise', 'custom');

-- Asset status enum (expanded)
CREATE TYPE asset_status AS ENUM ('active', 'maintenance', 'retired', 'lost', 'damaged', 'disposed', 'reserved');

-- Depreciation method enum
CREATE TYPE depreciation_method AS ENUM ('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production');

-- IoT device types
CREATE TYPE iot_device_type AS ENUM ('gps_tracker', 'temperature_sensor', 'humidity_sensor', 'vibration_sensor', 'rfid_reader', 'beacon');

-- IoT protocols
CREATE TYPE iot_protocol AS ENUM ('mqtt', 'lorawan', 'sigfox', 'wifi', 'bluetooth', 'cellular');

-- Device status
CREATE TYPE device_status AS ENUM ('active', 'inactive', 'maintenance', 'error');

-- Geofence event types
CREATE TYPE geofence_event_type AS ENUM ('entry', 'exit', 'dwell');

-- Geofence status
CREATE TYPE geofence_status AS ENUM ('active', 'inactive', 'draft');

-- Audit action types
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'assign', 'transfer');

-- =====================================================
-- CORE TENANT MANAGEMENT TABLES
-- =====================================================

-- Enhanced tenants table with comprehensive multi-tenant support
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status tenant_status DEFAULT 'trial',
  plan subscription_plan DEFAULT 'starter',
  
  -- Billing and subscription
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_email TEXT,
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Configuration and branding
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  feature_flags JSONB DEFAULT '{}',
  
  -- Data residency and compliance
  data_residency TEXT DEFAULT 'us-east-1',
  compliance_requirements TEXT[] DEFAULT '{}',
  
  -- Usage tracking
  asset_limit INTEGER DEFAULT 1000,
  user_limit INTEGER DEFAULT 10,
  storage_limit_gb INTEGER DEFAULT 10,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enhanced profiles table with tenant association
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Role and permissions
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user', 'viewer')),
  permissions JSONB DEFAULT '{}',
  department TEXT,
  job_title TEXT,
  
  -- Multi-factor authentication
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  backup_codes TEXT[],
  
  -- Session and security
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- Preferences
  preferences JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  
  -- Metadata
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENHANCED ASSET MANAGEMENT TABLES
-- =====================================================

-- Asset categories with hierarchy support
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.asset_categories(id),
  icon TEXT,
  color TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Enhanced assets table with comprehensive tracking
DROP TABLE IF EXISTS public.assets CASCADE;
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Categorization and hierarchy
  category_id UUID REFERENCES public.asset_categories(id),
  parent_asset_id UUID REFERENCES public.assets(id),
  tags TEXT[] DEFAULT '{}',
  
  -- Status and lifecycle
  status asset_status DEFAULT 'active',
  condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
  
  -- Location and tracking
  location JSONB, -- Structured location data
  current_location GEOMETRY(POINT, 4326), -- PostGIS point for geospatial queries
  assignee_id UUID REFERENCES public.profiles(id),
  department TEXT,
  
  -- Financial information
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  depreciation_method depreciation_method DEFAULT 'straight_line',
  depreciation_rate DECIMAL(5,2),
  residual_value DECIMAL(15,2),
  
  -- Lifecycle dates
  purchase_date DATE,
  warranty_start_date DATE,
  warranty_expiry_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  retirement_date DATE,
  disposal_date DATE,
  
  -- Vendor and procurement
  vendor_name TEXT,
  vendor_contact JSONB,
  purchase_order_number TEXT,
  invoice_number TEXT,
  
  -- Technical specifications
  model TEXT,
  serial_number TEXT,
  manufacturer TEXT,
  specifications JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Tracking and identification
  qr_code TEXT UNIQUE,
  barcode TEXT,
  rfid_tag TEXT,
  nfc_tag TEXT,
  
  -- File attachments
  attachments JSONB DEFAULT '[]',
  
  -- Compliance and certifications
  certifications JSONB DEFAULT '[]',
  compliance_notes TEXT,
  
  -- Audit information
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, asset_id)
);

-- Asset maintenance records
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Maintenance details
  maintenance_type TEXT NOT NULL, -- 'preventive', 'corrective', 'predictive'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Scheduling
  scheduled_date DATE,
  completed_date DATE,
  estimated_duration_hours DECIMAL(5,2),
  actual_duration_hours DECIMAL(5,2),
  
  -- Personnel and costs
  assigned_to UUID REFERENCES public.profiles(id),
  technician_notes TEXT,
  cost DECIMAL(10,2),
  parts_used JSONB DEFAULT '[]',
  
  -- Status tracking
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  
  -- Attachments and documentation
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced asset history with detailed change tracking
DROP TABLE IF EXISTS public.asset_history CASCADE;
CREATE TABLE public.asset_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Change details
  action audit_action NOT NULL,
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  change_summary TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Metadata
  performed_by UUID REFERENCES public.profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- IOT AND SENSOR INTEGRATION TABLES
-- =====================================================

-- IoT devices associated with assets
CREATE TABLE IF NOT EXISTS public.iot_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Device identification
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type iot_device_type NOT NULL,
  manufacturer TEXT,
  model TEXT,
  firmware_version TEXT,
  
  -- Communication
  protocol iot_protocol NOT NULL,
  endpoint_url TEXT,
  api_key TEXT,
  
  -- Configuration
  configuration JSONB DEFAULT '{}',
  sampling_interval INTEGER DEFAULT 300, -- seconds
  
  -- Status and health
  status device_status DEFAULT 'active',
  last_seen TIMESTAMPTZ,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  signal_strength INTEGER,
  
  -- Location
  location GEOMETRY(POINT, 4326),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, device_id)
);

-- Sensor data time series
CREATE TABLE IF NOT EXISTS public.sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  
  -- Sensor reading
  sensor_type TEXT NOT NULL,
  value DECIMAL(10,4),
  unit TEXT,
  quality_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  
  -- Location (if GPS-enabled device)
  location GEOMETRY(POINT, 4326),
  
  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- GEOSPATIAL AND GEOFENCING TABLES
-- =====================================================

-- Geofences for asset tracking
CREATE TABLE IF NOT EXISTS public.geofences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Geofence details
  name TEXT NOT NULL,
  description TEXT,
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  
  -- Rules and configuration
  rules JSONB DEFAULT '{}', -- Time-based rules, exceptions, etc.
  alert_on_entry BOOLEAN DEFAULT TRUE,
  alert_on_exit BOOLEAN DEFAULT TRUE,
  alert_on_dwell BOOLEAN DEFAULT FALSE,
  dwell_threshold_minutes INTEGER DEFAULT 60,
  
  -- Status
  status geofence_status DEFAULT 'active',
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geofence events
CREATE TABLE IF NOT EXISTS public.geofence_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  geofence_id UUID REFERENCES public.geofences(id) ON DELETE CASCADE,
  
  -- Event details
  event_type geofence_event_type NOT NULL,
  location GEOMETRY(POINT, 4326),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional context
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ
);

-- =====================================================
-- COMPREHENSIVE AUDIT AND COMPLIANCE TABLES
-- =====================================================

-- Enhanced audit logs for compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Event details
  action audit_action NOT NULL,
  resource_type TEXT NOT NULL, -- 'asset', 'user', 'tenant', etc.
  resource_id UUID,
  
  -- Change details
  before_state JSONB,
  after_state JSONB,
  changes JSONB,
  
  -- Context
  user_id UUID REFERENCES public.profiles(id),
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  
  -- Compliance
  compliance_category TEXT,
  retention_period_days INTEGER DEFAULT 2555, -- 7 years default
  
  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Policy details
  name TEXT NOT NULL,
  description TEXT,
  table_name TEXT NOT NULL,
  retention_period_days INTEGER NOT NULL,
  
  -- Conditions
  conditions JSONB DEFAULT '{}',
  
  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Tenant-based indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON public.assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_categories_tenant_id ON public.asset_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_tenant_id ON public.asset_maintenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_tenant_id ON public.asset_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant_id ON public.iot_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_tenant_id ON public.sensor_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geofences_tenant_id ON public.geofences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_tenant_id ON public.geofence_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- Asset-specific indexes
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_assignee_id ON public.assets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_assets_parent_asset_id ON public.assets(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_qr_code ON public.assets(qr_code);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON public.assets(serial_number);

-- Geospatial indexes
CREATE INDEX IF NOT EXISTS idx_assets_current_location ON public.assets USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_iot_devices_location ON public.iot_devices USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_sensor_data_location ON public.sensor_data USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_geofences_geometry ON public.geofences USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_geofence_events_location ON public.geofence_events USING GIST(location);

-- Time-series indexes
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON public.sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_timestamp ON public.sensor_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_events_timestamp ON public.geofence_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_asset_history_performed_at ON public.asset_history(performed_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assets_tenant_status ON public.assets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_tenant_category ON public.assets(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant_status ON public.iot_devices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action ON public.audit_logs(tenant_id, action);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_assets_search ON public.assets USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(model, '') || ' ' || COALESCE(serial_number, '')));
CREATE INDEX IF NOT EXISTS idx_asset_categories_search ON public.asset_categories USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_categories_updated_at BEFORE UPDATE ON public.asset_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_maintenance_updated_at BEFORE UPDATE ON public.asset_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON public.iot_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON public.geofences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON public.data_retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    tenant_id_val UUID;
    user_id_val UUID;
    action_val audit_action;
BEGIN
    -- Determine the action
    IF TG_OP = 'INSERT' THEN
        action_val := 'create';
        tenant_id_val := NEW.tenant_id;
    ELSIF TG_OP = 'UPDATE' THEN
        action_val := 'update';
        tenant_id_val := NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        action_val := 'delete';
        tenant_id_val := OLD.tenant_id;
    END IF;

    -- Get current user from session (if available)
    user_id_val := current_setting('app.current_user_id', true)::UUID;

    -- Insert audit log
    INSERT INTO public.audit_logs (
        tenant_id,
        action,
        resource_type,
        resource_id,
        before_state,
        after_state,
        user_id
    ) VALUES (
        tenant_id_val,
        action_val,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
            WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE row_to_json(NEW)
        END,
        user_id_val
    );

    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ language 'plpgsql';

-- Apply audit triggers to key tables
CREATE TRIGGER audit_assets AFTER INSERT OR UPDATE OR DELETE ON public.assets FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON public.tenants FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- INITIAL DATA AND CONSTRAINTS
-- =====================================================

-- Create default asset categories
INSERT INTO public.asset_categories (tenant_id, name, description, icon) VALUES
(NULL, 'IT Equipment', 'Computers, servers, networking equipment', 'computer'),
(NULL, 'Furniture', 'Office furniture and fixtures', 'chair'),
(NULL, 'Vehicles', 'Company vehicles and transportation', 'truck'),
(NULL, 'Machinery', 'Industrial machinery and equipment', 'cog'),
(NULL, 'Tools', 'Hand tools and power tools', 'wrench')
ON CONFLICT DO NOTHING;

-- Create system constraints
ALTER TABLE public.tenants ADD CONSTRAINT check_asset_limit_positive CHECK (asset_limit > 0);
ALTER TABLE public.tenants ADD CONSTRAINT check_user_limit_positive CHECK (user_limit > 0);
ALTER TABLE public.tenants ADD CONSTRAINT check_storage_limit_positive CHECK (storage_limit_gb > 0);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.tenants IS 'Multi-tenant organization management with billing and compliance features';
COMMENT ON TABLE public.profiles IS 'Enhanced user profiles with tenant association and security features';
COMMENT ON TABLE public.assets IS 'Comprehensive asset management with lifecycle tracking and geospatial support';
COMMENT ON TABLE public.asset_categories IS 'Hierarchical asset categorization system';
COMMENT ON TABLE public.asset_maintenance IS 'Maintenance scheduling and tracking';
COMMENT ON TABLE public.asset_history IS 'Detailed audit trail for all asset changes';
COMMENT ON TABLE public.iot_devices IS 'IoT device integration for real-time asset monitoring';
COMMENT ON TABLE public.sensor_data IS 'Time-series sensor data from IoT devices';
COMMENT ON TABLE public.geofences IS 'Geospatial boundaries for asset tracking';
COMMENT ON TABLE public.geofence_events IS 'Geofence entry/exit events';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit logging for compliance';
COMMENT ON TABLE public.data_retention_policies IS 'Automated data retention and cleanup policies';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Enterprise Asset Management Platform database schema created successfully!';
    RAISE NOTICE 'Schema includes:';
    RAISE NOTICE '- Multi-tenant architecture with comprehensive tenant management';
    RAISE NOTICE '- Enhanced asset management with lifecycle tracking';
    RAISE NOTICE '- IoT device integration and sensor data management';
    RAISE NOTICE '- Geospatial capabilities with PostGIS support';
    RAISE NOTICE '- Comprehensive audit logging for compliance';
    RAISE NOTICE '- Performance-optimized indexes and triggers';
    RAISE NOTICE 'Next steps: Run RLS policies script and configure tenant data';
END $$;