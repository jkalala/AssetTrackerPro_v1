// =====================================================
// TENANT FEATURE FLAGS API ROUTES
// =====================================================
// API endpoints for managing tenant feature flags and capabilities

import { NextRequest, NextResponse } from 'next/server'
import { tenantConfiguration } from '@/lib/services/tenant-configuration'
import { 
  withTenantContext, 
  withRole, 
  TenantContextManager 
} from '@/lib/middleware/tenant-context'

// =====================================================
// GET /api/tenant/features
// Get tenant feature flags
// =====================================================

export const GET = withTenantContext(
  async (context, req: NextRequest) => {
    try {
      const result = await tenantConfiguration.getFeatureFlags(context.tenantId)
      
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
      console.error('Error getting tenant features:', error)
      return NextResponse.json(
        { error: 'Failed to get features' },
        { status: 500 }
      )
    }
  }
)

// =====================================================
// PUT /api/tenant/features
// Update tenant feature flags
// =====================================================

export const PUT = withRole(['owner', 'admin'])(
  async (context, req: NextRequest) => {
    try {
      const featureFlags = await req.json()
      
      // Validate request body
      if (!featureFlags || typeof featureFlags !== 'object') {
        return NextResponse.json(
          { error: 'Invalid feature flags data' },
          { status: 400 }
        )
      }

      const result = await tenantConfiguration.updateFeatureFlags(
        context.tenantId,
        featureFlags,
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
          message: 'Feature flags updated successfully'
        },
        context
      )
    } catch (error) {
      console.error('Error updating tenant features:', error)
      return NextResponse.json(
        { error: 'Failed to update features' },
        { status: 500 }
      )
    }
  }
)

// =====================================================
// GET /api/tenant/features/[feature]
// Check if specific feature is enabled
// =====================================================

export async function GET_FEATURE(
  req: NextRequest,
  { params }: { params: { feature: string } }
) {
  return withTenantContext(async (context) => {
    try {
      const { feature } = params
      
      if (!feature) {
        return NextResponse.json(
          { error: 'Feature name required' },
          { status: 400 }
        )
      }

      const result = await tenantConfiguration.hasFeature(
        context.tenantId,
        feature as any
      )
      
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return TenantContextManager.createTenantResponse(
        {
          success: true,
          data: {
            feature,
            enabled: result.enabled
          }
        },
        context
      )
    } catch (error) {
      console.error('Error checking feature:', error)
      return NextResponse.json(
        { error: 'Failed to check feature' },
        { status: 500 }
      )
    }
  })(req)
}