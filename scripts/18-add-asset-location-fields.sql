-- 18-add-asset-location-fields.sql
alter table assets add column if not exists location_text text;
alter table assets add column if not exists location_lat double precision;
alter table assets add column if not exists location_lng double precision;
alter table assets add column if not exists location_updated_at timestamptz;
alter table assets add column if not exists location_source text; 