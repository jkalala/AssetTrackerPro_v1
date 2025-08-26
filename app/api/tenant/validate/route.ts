import { NextRequest, NextResponse } from "next/server";
import { 
  withTenantIsolation, 
  TenantIsolationManager,
  createTenantResponse,
  createTenantErrorResponse
} from "@/lib/middleware/tenant-isolation";
import { TenantContext } from "@/lib/types/database";

/**
 * Endpoint to validate tenant access and demonstrate unauthorized access handling
 */
export const GET = withTenantIsolation(async (context: TenantContext, req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const targetTenantId = url.searchParams.get('tenantId');
    
    // If a specific tenant ID is provided, validate access
    if (targetTenantId) {
      if (targetTenantId !== context.tenantId) {
        // Log unauthorized access attempt
        await TenantIsolationManager.logSecurityEvent(
          'unauthorized_tenant_access_attempt',
          { 
            requestedTenantId: targetTenantId,
            userTenantId: context.tenantId,
            endpoint: '/api/tenant/validate'
          },
          req
        );
        
        return createTenantErrorResponse(
          'Unauthorized access to tenant data',
          403,
          { 
            requestedTenant: targetTenantId,
            userTenant: context.tenantId
          }
        );
      }
    }

    // Return tenant validation success
    return createTenantResponse({
      valid: true,
      tenantId: context.tenantId,
      userId: context.userId,
      role: context.role,
      message: 'Tenant access validated successfully'
    }, context);
    
  } catch (error) {
    console.error('Error validating tenant access:', error);
    return NextResponse.json(
      { error: 'Failed to validate tenant access' },
      { status: 500 }
    );
  }
});

/**
 * Endpoint to test cross-tenant data access (should fail)
 */
export const POST = withTenantIsolation(async (context: TenantContext, req: NextRequest) => {
  try {
    const body = await req.json();
    const { targetTenantId, action } = body;
    
    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'targetTenantId is required' },
        { status: 400 }
      );
    }
    
    // Attempt to validate access to different tenant
    try {
      await TenantIsolationManager.validateTenantAccess(targetTenantId);
      
      // This should not happen if isolation is working correctly
      return createTenantResponse({
        success: true,
        message: 'Access granted (this should not happen)',
        warning: 'Tenant isolation may not be working correctly'
      }, context);
      
    } catch (isolationError) {
      // This is the expected behavior - access should be denied
      await TenantIsolationManager.logSecurityEvent(
        'cross_tenant_access_blocked',
        { 
          targetTenantId,
          action,
          userTenantId: context.tenantId,
          blocked: true
        },
        req
      );
      
      return createTenantResponse({
        success: true,
        message: 'Tenant isolation working correctly',
        blocked: true,
        reason: isolationError instanceof Error ? isolationError.message : 'Access denied'
      }, context);
    }
    
  } catch (error) {
    console.error('Error testing tenant isolation:', error);
    return NextResponse.json(
      { error: 'Failed to test tenant isolation' },
      { status: 500 }
    );
  }
});