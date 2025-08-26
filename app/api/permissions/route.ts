// =====================================================
// PERMISSIONS API ROUTE
// =====================================================
// API endpoint for system permissions

import { NextRequest, NextResponse } from 'next/server'
import { RoleService } from '@/lib/services/role-service'
import { createClient } from '@/lib/supabase/server'

const roleService = new RoleService()

// GET /api/permissions - Get all system permissions
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const permissions = await roleService.getSystemPermissions()

    return NextResponse.json({
      success: true,
      permissions
    })
  } catch (error: any) {
    console.error('Error getting permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get permissions' },
      { status: 500 }
    )
  }
}