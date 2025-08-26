import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

// Helper to get tenant_id from user profile
async function getTenantId(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single()
  if (error || !data) return null
  return data.tenant_id
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenant_id = await getTenantId(supabase, user.id)
  if (!tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 403 })
  const { data, error } = await supabase
    .from("asset_field_definitions")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:settings' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const tenant_id = await getTenantId(supabase, user.id)
  if (!tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 403 })
  const { name, label, type, options, required, validation } = await req.json()
  const { data, error } = await supabase
    .from("asset_field_definitions")
    .insert({ tenant_id, name, label, type, options, required, validation })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:settings' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const tenant_id = await getTenantId(supabase, user.id)
  if (!tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 403 })
  const { id, name, label, type, options, required, validation } = await req.json()
  const { data, error } = await supabase
    .from("asset_field_definitions")
    .update({ name, label, type, options, required, validation, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:settings' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const tenant_id = await getTenantId(supabase, user.id)
  if (!tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 403 })
  const { id } = await req.json()
  const { error } = await supabase
    .from("asset_field_definitions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 