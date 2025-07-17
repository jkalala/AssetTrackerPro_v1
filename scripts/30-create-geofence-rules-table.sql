-- Create geofence_rules table for granular geofence logic
CREATE TABLE IF NOT EXISTS geofence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  category TEXT,
  geofence_id UUID REFERENCES geofence_zones(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('entry', 'exit', 'dwell')),
  min_duration_minutes INTEGER, -- for dwell/exit triggers
  notify_email BOOLEAN DEFAULT FALSE,
  notify_in_app BOOLEAN DEFAULT TRUE,
  escalation_level TEXT, -- e.g., 'info', 'warning', 'critical'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofence_rules_tenant_id ON geofence_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geofence_rules_asset_id ON geofence_rules(asset_id);
CREATE INDEX IF NOT EXISTS idx_geofence_rules_category ON geofence_rules(category);
CREATE INDEX IF NOT EXISTS idx_geofence_rules_geofence_id ON geofence_rules(geofence_id); 