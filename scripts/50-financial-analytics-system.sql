-- Financial Analytics and Cost Management System
-- This script creates comprehensive financial tracking and analytics capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for financial analytics
CREATE TYPE depreciation_method AS ENUM (
  'straight_line',
  'declining_balance',
  'double_declining_balance',
  'sum_of_years_digits',
  'units_of_production'
);

CREATE TYPE cost_category AS ENUM (
  'acquisition',
  'maintenance',
  'operational',
  'insurance',
  'storage',
  'disposal',
  'other'
);

CREATE TYPE budget_status AS ENUM (
  'draft',
  'approved',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE variance_type AS ENUM (
  'favorable',
  'unfavorable',
  'neutral'
);

-- Asset Financial Information (enhanced)
CREATE TABLE IF NOT EXISTS asset_financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  -- Purchase Information
  purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  vendor_id UUID,
  purchase_order_number TEXT,
  
  -- Depreciation Configuration
  depreciation_method depreciation_method DEFAULT 'straight_line',
  useful_life_years INTEGER,
  useful_life_units INTEGER, -- For units of production method
  salvage_value DECIMAL(15,2) DEFAULT 0,
  depreciation_start_date DATE,
  
  -- Current Values
  current_book_value DECIMAL(15,2),
  current_market_value DECIMAL(15,2),
  last_valuation_date DATE,
  
  -- Warranty and Insurance
  warranty_cost DECIMAL(15,2) DEFAULT 0,
  warranty_expiry_date DATE,
  insurance_cost_annual DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, asset_id)
);

-- Depreciation Schedule
CREATE TABLE depreciation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_financial_id UUID NOT NULL REFERENCES asset_financial_data(id) ON DELETE CASCADE,
  
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  depreciation_amount DECIMAL(15,2) NOT NULL,
  accumulated_depreciation DECIMAL(15,2) NOT NULL,
  book_value DECIMAL(15,2) NOT NULL,
  
  -- For units of production method
  units_produced INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Cost Tracking
CREATE TABLE asset_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  cost_category cost_category NOT NULL,
  cost_amount DECIMAL(15,2) NOT NULL,
  cost_date DATE NOT NULL,
  description TEXT,
  
  -- Reference Information
  vendor_id UUID,
  invoice_number TEXT,
  work_order_id UUID,
  
  -- Approval Information
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Management
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  budget_year INTEGER NOT NULL,
  status budget_status DEFAULT 'draft',
  
  -- Budget Amounts
  total_budget DECIMAL(15,2) NOT NULL,
  allocated_amount DECIMAL(15,2) DEFAULT 0,
  spent_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Department/Category Filters
  department_id UUID,
  asset_category_id UUID,
  cost_categories cost_category[],
  
  -- Approval Information
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Line Items
CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  
  line_item_name TEXT NOT NULL,
  description TEXT,
  cost_category cost_category NOT NULL,
  
  -- Budget Amounts
  budgeted_amount DECIMAL(15,2) NOT NULL,
  spent_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Asset Filters
  asset_ids UUID[],
  asset_category_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Variance Analysis
CREATE TABLE budget_variances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  budget_line_item_id UUID REFERENCES budget_line_items(id) ON DELETE CASCADE,
  
  analysis_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Variance Calculations
  budgeted_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) NOT NULL,
  variance_amount DECIMAL(15,2) NOT NULL,
  variance_percentage DECIMAL(5,2) NOT NULL,
  variance_type variance_type NOT NULL,
  
  -- Analysis
  variance_reason TEXT,
  corrective_action TEXT,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI Analysis
CREATE TABLE roi_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- Investment Costs
  initial_investment DECIMAL(15,2) NOT NULL,
  additional_investments DECIMAL(15,2) DEFAULT 0,
  total_investment DECIMAL(15,2) NOT NULL,
  
  -- Returns/Benefits
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  cost_savings DECIMAL(15,2) DEFAULT 0,
  productivity_gains DECIMAL(15,2) DEFAULT 0,
  total_returns DECIMAL(15,2) NOT NULL,
  
  -- ROI Calculations
  net_return DECIMAL(15,2) NOT NULL,
  roi_percentage DECIMAL(5,2) NOT NULL,
  payback_period_months INTEGER,
  
  -- Utilization Metrics
  utilization_percentage DECIMAL(5,2),
  downtime_hours INTEGER DEFAULT 0,
  maintenance_hours INTEGER DEFAULT 0,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCO (Total Cost of Ownership) Analysis
CREATE TABLE tco_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  analysis_period_years INTEGER NOT NULL DEFAULT 5,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Acquisition Costs
  purchase_price DECIMAL(15,2) NOT NULL,
  installation_cost DECIMAL(15,2) DEFAULT 0,
  training_cost DECIMAL(15,2) DEFAULT 0,
  initial_setup_cost DECIMAL(15,2) DEFAULT 0,
  
  -- Operating Costs (Annual)
  maintenance_cost_annual DECIMAL(15,2) DEFAULT 0,
  energy_cost_annual DECIMAL(15,2) DEFAULT 0,
  insurance_cost_annual DECIMAL(15,2) DEFAULT 0,
  storage_cost_annual DECIMAL(15,2) DEFAULT 0,
  labor_cost_annual DECIMAL(15,2) DEFAULT 0,
  
  -- End-of-Life Costs
  disposal_cost DECIMAL(15,2) DEFAULT 0,
  salvage_value DECIMAL(15,2) DEFAULT 0,
  
  -- TCO Calculations
  total_acquisition_cost DECIMAL(15,2) NOT NULL,
  total_operating_cost DECIMAL(15,2) NOT NULL,
  total_end_of_life_cost DECIMAL(15,2) NOT NULL,
  total_cost_of_ownership DECIMAL(15,2) NOT NULL,
  
  -- Per-period calculations
  tco_per_year DECIMAL(15,2) NOT NULL,
  tco_per_month DECIMAL(15,2) NOT NULL,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Alerts Configuration
CREATE TABLE financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'budget_variance', 'depreciation_milestone', 'roi_threshold', etc.
  
  -- Alert Conditions
  threshold_value DECIMAL(15,2),
  threshold_percentage DECIMAL(5,2),
  comparison_operator TEXT NOT NULL, -- 'gt', 'lt', 'eq', 'gte', 'lte'
  
  -- Scope
  budget_id UUID REFERENCES budgets(id),
  asset_ids UUID[],
  asset_category_id UUID,
  
  -- Notification Settings
  notification_channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'sms', 'push', 'webhook'
  notification_recipients UUID[] NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Alert History
CREATE TABLE financial_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES financial_alerts(id) ON DELETE CASCADE,
  
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_value DECIMAL(15,2),
  threshold_value DECIMAL(15,2),
  
  -- Context
  asset_id UUID REFERENCES assets(id),
  budget_id UUID REFERENCES budgets(id),
  
  -- Notification Status
  notifications_sent JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_asset_financial_data_tenant_asset ON asset_financial_data(tenant_id, asset_id);
CREATE INDEX idx_depreciation_schedule_asset_period ON depreciation_schedule(asset_financial_id, period_start_date);
CREATE INDEX idx_asset_costs_tenant_asset_date ON asset_costs(tenant_id, asset_id, cost_date);
CREATE INDEX idx_asset_costs_category_date ON asset_costs(cost_category, cost_date);
CREATE INDEX idx_budgets_tenant_year ON budgets(tenant_id, budget_year);
CREATE INDEX idx_budget_variances_budget_date ON budget_variances(budget_id, analysis_date);
CREATE INDEX idx_roi_analysis_asset_period ON roi_analysis(asset_id, analysis_period_start, analysis_period_end);
CREATE INDEX idx_tco_analysis_asset_date ON tco_analysis(asset_id, analysis_date);
CREATE INDEX idx_financial_alerts_tenant_active ON financial_alerts(tenant_id, is_active);

-- Row Level Security Policies
ALTER TABLE asset_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_variances ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tco_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY tenant_isolation_asset_financial_data ON asset_financial_data
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_depreciation_schedule ON depreciation_schedule
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_asset_costs ON asset_costs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_budgets ON budgets
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_budget_line_items ON budget_line_items
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_budget_variances ON budget_variances
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_roi_analysis ON roi_analysis
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_tco_analysis ON tco_analysis
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_financial_alerts ON financial_alerts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_financial_alert_history ON financial_alert_history
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);