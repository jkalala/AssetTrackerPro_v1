// =====================================================
// TENANT CONFIGURATION API ROUTES
// =====================================================
// API endpoints for managing tenant configuration, branding, and feature flags

import { NextRequest, NextResponse } from 'next/server'
import { tenantConfiguration } from '@/lib/services/tenant-configuration'
import { 
  withTenantContext, 
  withRole, 
  TenantContextManager 
} from '@/lib/middleware/tenant-context'

// =====================================================
// GET /api/tenant/configuration
// Get complete tenant configuration
// =====================================================

export const GET = withRole(['owner', 'admin'])(
  async (context, req: NextRequest) => {
    try {
      const result = await tenantConfiguration.getConfiguration(context.tenantId)
      
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
      console.error('Error getting tenant configuration:', error)
      return NextResponse.json(
        { error: 'Failed to get configuration' },
        { status: 500 }
      )
    }
  }
)

// =====================================================
// PUT /api/tenant/configuration
// Update tenant configuration (bulk update)
// =====================================================

export const PUT = withRole(['owner', 'admin'])(
  async (context, req: NextRequest) => {
    try {
      const updates = await req.json()
      
      // Validate request body
      if (!updates || typeof updates !== 'object') {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      }

      const result = await tenantConfiguration.updateConfiguration(
        context.tenantId,
        updates,
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
          message: 'Configuration updated successfully'
        },
        context
      )
    } catch (error) {
      console.error('Error updating tenant configuration:', error)
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      )
    }
  }
)