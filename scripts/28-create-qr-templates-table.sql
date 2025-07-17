-- Create qr_templates table for per-tenant QR code template configs
CREATE TABLE IF NOT EXISTS qr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- stores fields, logo URL, layout, etc.
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_templates_tenant_id ON qr_templates(tenant_id); 