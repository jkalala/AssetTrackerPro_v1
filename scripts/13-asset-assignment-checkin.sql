-- Add assignment fields to assets table
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS checked_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';

-- Create asset_assignments table for assignment/check-in/out history
CREATE TABLE IF NOT EXISTS asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES profiles(id),
  assigned_by uuid REFERENCES profiles(id),
  checked_out_at timestamptz DEFAULT now(),
  checked_in_at timestamptz,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assignee_id ON asset_assignments(assignee_id); 