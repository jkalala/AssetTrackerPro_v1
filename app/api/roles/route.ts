// =====================================================
// ROLES API ROUTE
// =====================================================
// API endpoints for role management

import { NextRequest, NextResponse } from 'next/server'
import { RoleService } from '@/lib/services/role-service'
import { withPermissions, PERMISSIONS } from '@/lib/middleware/role-validation'
import { createClient } from '@/lib/supabase/server'

const roleService = new RoleService()

// GET /api/roles - Get all roles for tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const includeInactive = searchParams.get('include_inactive') === 'true'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify user has permission to read roles
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const roles = await roleService.getRoles(tenantId, includeInactive)

    return NextResponse.json({
      success: true,
      roles
    })
  } catch (error: any) {
    console.error('Error getting roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get roles' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create new role
export const POST = withPermissions([PERMISSIONS.ROLES.CREATE])(
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { tenant_id, ...roleData } = body

      if (!tenant_id) {
        return NextResponse.json(
          { error: 'Tenant ID is required' },
          { status: 400 }
        )
      }

      // Get user context from middleware
      const userContext = (request as any).userContext
      if (!userContext) {
        return NextResponse.json(
          { error: 'User context not found' },
          { status: 401 }
        )
      }

      const role = await roleService.createRole(
        tenant_id,
        roleData,
        userContext.userId
      )

      return NextResponse.json({
        success: true,
        role
      })
    } catch (error: any) {
      console.error('Error creating role:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create role' },
        { status: 500 }
      )
    }
  }
)