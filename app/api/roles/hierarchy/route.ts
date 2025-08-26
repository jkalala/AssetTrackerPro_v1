// =====================================================
// ROLE HIERARCHY API ROUTE
// =====================================================
// API endpoint for role hierarchy

import { NextRequest, NextResponse } from 'next/server'
import { RoleService } from '@/lib/services/role-service'
import { createClient } from '@/lib/supabase/server'

const roleService = new RoleService()

// GET /api/roles/hierarchy - Get role hierarchy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

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

    const hierarchy = await roleService.getRoleHierarchy(tenantId)

    return NextResponse.json({
      success: true,
      hierarchy
    })
  } catch (error: any) {
    console.error('Error getting role hierarchy:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get role hierarchy' },
      { status: 500 }
    )
  }
}