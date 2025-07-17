-- Create geofence_events table for logging geofence entry/exit events
CREATE TABLE IF NOT EXISTS geofence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  geofence_id uuid NOT NULL REFERENCES geofence_zones(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('entry', 'exit')),
  timestamp timestamptz NOT NULL DEFAULT now()
);
-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_geofence_events_asset_id ON geofence_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence_id ON geofence_events(geofence_id); 