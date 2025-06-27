-- 20-create-geofence-zones.sql
create table if not exists geofence_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  polygon jsonb not null, -- GeoJSON Polygon
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_geofence_zones_name on geofence_zones(name); 