import { Role, Permission, DEFAULT_ROLE_PERMISSIONS } from './types'
import { createClient } from '@/lib/supabase/client'

export function hasPermission(userRole: Role, requiredPermission: Permission): boolean {
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(requiredPermission)
}

export function hasAnyPermission(userRole: Role, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: Role, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, permission))
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const supabase = createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    if (!profile) return []

    return DEFAULT_ROLE_PERMISSIONS[profile.role as Role] || []
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return []
  }
}

export async function updateUserRole(userId: string, newRole: Role): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

export async function isAuthorized(
  userId: string,
  requiredPermissions: Permission | Permission[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId)
    const required = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions]
    return required.every(permission => permissions.includes(permission))
  } catch (error) {
    console.error('Error checking authorization:', error)
    return false
  }
}
