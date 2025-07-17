-- Seed default roles and permissions for RBAC
INSERT INTO roles (name, permissions, is_builtin, created_at, updated_at)
VALUES
  ('super_admin', '{create:asset,read:asset,update:asset,delete:asset,manage:users,manage:roles,manage:tenants,view:analytics,manage:billing,manage:settings}', true, NOW(), NOW()),
  ('admin', '{create:asset,read:asset,update:asset,delete:asset,manage:users,view:analytics,manage:settings}', true, NOW(), NOW()),
  ('manager', '{create:asset,read:asset,update:asset,view:analytics}', true, NOW(), NOW()),
  ('user', '{read:asset,create:asset}', true, NOW(), NOW()),
  ('guest', '{read:asset}', true, NOW(), NOW()); 