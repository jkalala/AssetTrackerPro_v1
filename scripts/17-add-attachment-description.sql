-- 17-add-attachment-description.sql
alter table asset_attachments add column if not exists description text; 