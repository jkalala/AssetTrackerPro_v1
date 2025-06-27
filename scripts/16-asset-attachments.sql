-- 16-asset-attachments.sql
-- Migration: Asset Attachments Table

create table if not exists asset_attachments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  type text,
  size integer,
  uploaded_by uuid references profiles(id) on delete set null,
  uploaded_at timestamptz default now(),
  constraint asset_attachment_unique unique(asset_id, file_url)
);

-- Index for fast lookup
create index if not exists idx_asset_attachments_asset_id on asset_attachments(asset_id); 