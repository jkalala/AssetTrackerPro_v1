import { ratelimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { 
  withTenantIsolation, 
  TenantIsolationManager,
  createTenantResponse 
} from "@/lib/middleware/tenant-isolation";
import { TenantContext } from "@/lib/types/database";

export const GET = withTenantIsolation(async (context: TenantContext, req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { 
        status: 429, 
        headers: { 
          "X-RateLimit-Limit": limit.toString(), 
          "X-RateLimit-Remaining": remaining.toString(), 
          "X-RateLimit-Reset": reset.toString() 
        } 
      }
    );
  }

  const url = new URL(req.url);
  const fields = url.searchParams.get("fields")?.split(",").map(f => f.trim()).filter(Boolean) || ["*"];
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");

  try {
    // Create tenant-scoped query
    const query = await TenantIsolationManager.createTenantQuery("assets", context);
    
    // Build query with filters
    let assetsQuery = query.select(fields.join(","));
    
    if (dateFrom) assetsQuery = assetsQuery.gte("created_at", dateFrom);
    if (dateTo) assetsQuery = assetsQuery.lte("created_at", dateTo);
    if (category) assetsQuery = assetsQuery.eq("category", category);
    if (status) assetsQuery = assetsQuery.eq("status", status);

    const { data, error } = await assetsQuery;
    
    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log successful access
    await TenantIsolationManager.logSecurityEvent(
      'assets_accessed',
      { 
        count: data?.length || 0,
        filters: { dateFrom, dateTo, category, status }
      },
      req
    );

    return createTenantResponse({ assets: data }, context);
  } catch (error) {
    console.error('Unexpected error in assets API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
});

export const POST = withTenantIsolation(async (context: TenantContext, req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { 
        status: 429, 
        headers: { 
          "X-RateLimit-Limit": limit.toString(), 
          "X-RateLimit-Remaining": remaining.toString(), 
          "X-RateLimit-Reset": reset.toString() 
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Add tenant context to the asset data
    const assetData = await TenantIsolationManager.addTenantContext(body);
    
    // Create tenant-scoped query
    const query = await TenantIsolationManager.createTenantQuery("assets", context);
    
    const { data, error } = await query
      .insert(assetData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating asset:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log asset creation
    await TenantIsolationManager.logSecurityEvent(
      'asset_created',
      { 
        assetId: data.id,
        assetName: data.name
      },
      req
    );

    return createTenantResponse({ asset: data }, context, 201);
  } catch (error) {
    console.error('Unexpected error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}); 