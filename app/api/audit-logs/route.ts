import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

export async function GET(request: Request) {
  const supabase = await createClient();
  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'view:analytics' as Permission);
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const entityId = searchParams.get("entityId");
  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (entity) query = query.eq("entity", entity);
  if (entityId) query = query.eq("entity_id", entityId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
} 