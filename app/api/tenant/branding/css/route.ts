// =====================================================
// TENANT CSS GENERATION API
// =====================================================
// API endpoint for generating tenant-specific CSS stylesheets

import { NextRequest, NextResponse } from 'next/server'
import { tenantConfiguration } from '@/lib/services/tenant-configuration'
import { withTenantContext } from '@/lib/middleware/tenant-context'

// =====================================================
// GET /api/tenant/branding/css
// Generate tenant-specific CSS stylesheet
// =====================================================

export const GET = withTenantContext(
  async (context, req: NextRequest) => {
    try {
      const result = await tenantConfiguration.generateTenantCSS(context.tenantId)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      // Return CSS with appropriate headers
      return new NextResponse(result.css, {
        status: 200,
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-Tenant-ID': context.tenantId
        }
      })
    } catch (error) {
      console.error('Error generating tenant CSS:', error)
      return NextResponse.json(
        { error: 'Failed to generate CSS' },
        { status: 500 }
      )
    }
  }
)