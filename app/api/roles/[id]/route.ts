// =====================================================
// ROLE BY ID API ROUTE
// =====================================================
// API endpoints for individual role management

import { NextRequest, NextResponse } from 'next/server'
import { RoleService } from '@/lib/services/role-service'
import { withPermissions, PERMISSIONS } from '@/lib/middleware/role-validation'

const roleService = new RoleService()

// GET /api/roles/[id] - Get role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const role = await roleService.getRole(tenantId, params.id)

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      role
    })
  } catch (error: any) {
    console.error('Error getting role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/[id] - Update role
export const PUT = withPermissions([PERMISSIONS.ROLES.UPDATE])(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json()
      const { tenant_id, ...updates } = body

      if (!tenant_id) {
        return NextResponse.json(
          { error: 'Tenant ID is required' },
          { status: 400 }
        )
      }

      const role = await roleService.updateRole(tenant_id, params.id, updates)

      return NextResponse.json({
        success: true,
        role
      })
    } catch (error: any) {
      console.error('Error updating role:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update role' },
        { status: 500 }
      )
    }
  }
)

// DELETE /api/roles/[id] - Delete role
export const DELETE = withPermissions([PERMISSIONS.ROLES.DELETE])(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenant_id')

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID is required' },
          { status: 400 }
        )
      }

      const success = await roleService.deleteRole(tenantId, params.id)

      return NextResponse.json({
        success,
        message: 'Role deleted successfully'
      })
    } catch (error: any) {
      console.error('Error deleting role:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete role' },
        { status: 500 }
      )
    }
  }
)