-- Create table for custom asset field definitions
CREATE TABLE IF NOT EXISTS public.asset_field_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'dropdown', 'relation')),
  options JSONB,
  required BOOLEAN DEFAULT FALSE,
  validation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- Create table for storing custom field values per asset
CREATE TABLE IF NOT EXISTS public.asset_custom_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.asset_field_definitions(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (asset_id, field_id)
); 