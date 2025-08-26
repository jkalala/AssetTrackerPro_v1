/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { 
  withResourceAccess, 
  TenantIsolationManager,
  createTenantResponse 
} from "@/lib/middleware/tenant-isolation";
import { TenantContext } from "@/lib/types/database";

export const runtime = 'nodejs'

export const GET = withResourceAccess("assets", "assetId")(
  async (context: TenantContext, req: NextRequest, { params }: { params: { assetId: string } }) => {
    try {
      // Create tenant-scoped query
      const query = await TenantIsolationManager.createTenantQuery("assets", context);
      
      const { data, error } = await query
        .select("*")
        .eq("id", params.assetId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        console.error('Error fetching asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log successful access
      await TenantIsolationManager.logSecurityEvent(
        'asset_accessed',
        { 
          assetId: params.assetId,
          assetName: data.name
        },
        req
      );

      return createTenantResponse({ asset: data }, context);
    } catch (error) {
      console.error('Unexpected error fetching asset:', error);
      return NextResponse.json(
        { error: 'Failed to fetch asset' },
        { status: 500 }
      );
    }
  }
);

export const PUT = withResourceAccess("assets", "assetId")(
  async (context: TenantContext, req: NextRequest, { params }: { params: { assetId: string } }) => {
    try {
      const body = await req.json();
      
      // Remove tenant_id from update data to prevent tampering
      const { tenant_id, ...updateData } = body;
      
      // Create tenant-scoped query
      const query = await TenantIsolationManager.createTenantQuery("assets", context);
      
      const { data, error } = await query
        .update(updateData)
        .eq("id", params.assetId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        console.error('Error updating asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log asset update
      await TenantIsolationManager.logSecurityEvent(
        'asset_updated',
        { 
          assetId: params.assetId,
          assetName: data.name,
          updatedFields: Object.keys(updateData)
        },
        req
      );

      return createTenantResponse({ asset: data }, context);
    } catch (error) {
      console.error('Unexpected error updating asset:', error);
      return NextResponse.json(
        { error: 'Failed to update asset' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withResourceAccess("assets", "assetId")(
  async (context: TenantContext, req: NextRequest, { params }: { params: { assetId: string } }) => {
    try {
      // Validate user has permission to delete assets
      await TenantIsolationManager.validateRole(['owner', 'admin', 'manager']);
      
      // Create tenant-scoped query
      const query = await TenantIsolationManager.createTenantQuery("assets", context);
      
      // First get the asset for logging
      const { data: asset } = await query
        .select("name")
        .eq("id", params.assetId)
        .single();
      
      const { error } = await query
        .delete()
        .eq("id", params.assetId);
      
      if (error) {
        console.error('Error deleting asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log asset deletion
      await TenantIsolationManager.logSecurityEvent(
        'asset_deleted',
        { 
          assetId: params.assetId,
          assetName: asset?.name || 'Unknown'
        },
        req
      );

      return createTenantResponse({ success: true }, context);
    } catch (error) {
      console.error('Unexpected error deleting asset:', error);
      return NextResponse.json(
        { error: 'Failed to delete asset' },
        { status: 500 }
      );
    }
  }
); 