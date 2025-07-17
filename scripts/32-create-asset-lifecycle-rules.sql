-- Create table for asset lifecycle rules
CREATE TABLE IF NOT EXISTS public.asset_lifecycle_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g. 'retire', 'archive', 'depreciate'
  trigger_field TEXT NOT NULL, -- e.g. 'purchase_date', 'warranty_expiry'
  interval TEXT, -- e.g. '5 years', '1 year', ISO 8601 duration
  trigger_date DATE, -- for one-off rules
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 