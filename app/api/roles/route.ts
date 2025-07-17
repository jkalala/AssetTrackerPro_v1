import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

// Helper to get user and tenant
async function getUserAndTenant(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { error: "Unauthorized" }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single()
  if (profileError || !profile) return { error: "No tenant" }
  return { user, tenant_id: profile.tenant_id, supabase }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, permissions")
    .order("name", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roles: data })
}

export async function POST(req: NextRequest) {
  const { tenant_id, error, supabase, user } = await (async () => {
    const result = await getUserAndTenant(req)
    // Get user for permission check
    if (result.error || !result.supabase) return { ...result, user: null }
    const { user } = result
    return { ...result, user }
  })()
  if (error || !supabase || !user) return NextResponse.json({ error: error || "No supabase client" }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:roles' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { name, permissions } = await req.json()
  if (!name || !Array.isArray(permissions)) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const { data, error: insertError } = await supabase
    .from("roles")
    .insert({ name, permissions, tenant_id, is_builtin: false })
    .select()
    .single()
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const { tenant_id, error, supabase, user } = await (async () => {
    const result = await getUserAndTenant(req)
    if (result.error || !result.supabase) return { ...result, user: null }
    const { user } = result
    return { ...result, user }
  })()
  if (error || !supabase || !user) return NextResponse.json({ error: error || "No supabase client" }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:roles' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { id, name, permissions } = await req.json()
  if (!id || !name || !Array.isArray(permissions)) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const { data, error: updateError } = await supabase
    .from("roles")
    .update({ name, permissions, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant_id)
    .select()
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { tenant_id, error, supabase, user } = await (async () => {
    const result = await getUserAndTenant(req)
    if (result.error || !result.supabase) return { ...result, user: null }
    const { user } = result
    return { ...result, user }
  })()
  if (error || !supabase || !user) return NextResponse.json({ error: error || "No supabase client" }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:roles' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  // Check if any user is assigned to this role
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", id)
  if ((count ?? 0) > 0) return NextResponse.json({ error: "Role is assigned to users" }, { status: 400 })
  const { error: delError } = await supabase
    .from("roles")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant_id)
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 