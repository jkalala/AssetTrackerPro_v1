-- 37-tenant-sso-configs.sql
-- Table for per-tenant SSO configuration
CREATE TABLE IF NOT EXISTS public.tenant_sso_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc', 'google', 'azure', 'okta')),
  metadata JSONB,
  client_id TEXT,
  client_secret TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_tenant_id ON public.tenant_sso_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_provider ON public.tenant_sso_configs(provider); 