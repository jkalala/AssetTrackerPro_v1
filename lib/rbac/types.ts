export type Role = 'super_admin' | 'admin' | 'manager' | 'user' | 'guest';

export type Permission = 
  | 'create:asset'
  | 'read:asset'
  | 'update:asset'
  | 'delete:asset'
  | 'manage:users'
  | 'manage:roles'
  | 'manage:tenants'
  | 'view:analytics'
  | 'manage:billing'
  | 'manage:settings';

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  maxUsers: number;
  maxAssets: number;
  features: {
    qrCodes: boolean;
    analytics: boolean;
    api: boolean;
    customBranding: boolean;
    multipleLocations: boolean;
    advancedReports: boolean;
  };
  createdAt: string;
  updatedAt: string;
  branding_logo_url?: string;
  branding_primary_color?: string;
  branding_secondary_color?: string;
  branding_company_name?: string;
}

export interface UserWithTenant {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
  tenant: Tenant;
  isOwner: boolean;
}

// Default role permissions configuration
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'create:asset',
    'read:asset',
    'update:asset',
    'delete:asset',
    'manage:users',
    'manage:roles',
    'manage:tenants',
    'view:analytics',
    'manage:billing',
    'manage:settings'
  ],
  admin: [
    'create:asset',
    'read:asset',
    'update:asset',
    'delete:asset',
    'manage:users',
    'view:analytics',
    'manage:settings'
  ],
  manager: [
    'create:asset',
    'read:asset',
    'update:asset',
    'view:analytics'
  ],
  user: [
    'read:asset',
    'create:asset'
  ],
  guest: [
    'read:asset'
  ]
}; 