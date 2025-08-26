// =====================================================
// TENANT BRANDING API ROUTES
// =====================================================
// API endpoints for managing tenant branding and visual customization

import { NextRequest, NextResponse } from 'next/server'
import { tenantConfiguration } from '@/lib/services/tenant-configuration'
import { 
  withTenantContext, 
  withRole, 
  TenantContextManager 
} from '@/lib/middleware/tenant-context'

// =====================================================
// GET /api/tenant/branding
// Get tenant branding configuration
// =====================================================

export const GET = withTenantContext(
  async (context, req: NextRequest) => {
    try {
      const result = await tenantConfiguration.getBranding(context.tenantId)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return TenantContextManager.createTenantResponse(
        {
          success: true,
          data: result.data
        },
        context
      )
    } catch (error) {
      console.error('Error getting tenant branding:', error)
      return NextResponse.json(
        { error: 'Failed to get branding' },
        { status: 500 }
      )
    }
  }
)

// =====================================================
// PUT /api/tenant/branding
// Update tenant branding configuration
// =====================================================

export const PUT = withRole(['owner', 'admin'])(
  async (context, req: NextRequest) => {
    try {
      const branding = await req.json()
      
      // Validate request body
      if (!branding || typeof branding !== 'object') {
        return NextResponse.json(
          { error: 'Invalid branding data' },
          { status: 400 }
        )
      }

      const result = await tenantConfiguration.updateBranding(
        context.tenantId,
        branding,
        context.userId
      )
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return TenantContextManager.createTenantResponse(
        {
          success: true,
          data: result.data,
          message: 'Branding updated successfully'
        },
        context
      )
    } catch (error) {
      console.error('Error updating tenant branding:', error)
      return NextResponse.json(
        { error: 'Failed to update branding' },
        { status: 500 }
      )
    }
  }
)