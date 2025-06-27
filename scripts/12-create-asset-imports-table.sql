-- Create asset_imports table for import history
CREATE TABLE IF NOT EXISTS asset_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text,
  imported_at timestamptz DEFAULT now(),
  success_count integer,
  error_count integer,
  error_rows jsonb,
  asset_ids text[],
  undo_available boolean DEFAULT true
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_asset_imports_user_id ON asset_imports(user_id); 