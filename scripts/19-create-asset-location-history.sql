-- 19-create-asset-location-history.sql
create table if not exists asset_location_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  location_text text,
  location_lat double precision,
  location_lng double precision,
  location_source text,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz default now(),
  prev_location_text text,
  prev_location_lat double precision,
  prev_location_lng double precision
);

create index if not exists idx_location_history_asset_id on asset_location_history(asset_id); 