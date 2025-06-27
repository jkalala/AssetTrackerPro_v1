-- Asset Depreciation & Financial Tracking fields
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS purchase_value numeric,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS depreciation_method text DEFAULT 'straight_line',
  ADD COLUMN IF NOT EXISTS depreciation_period_years integer,
  ADD COLUMN IF NOT EXISTS salvage_value numeric; 