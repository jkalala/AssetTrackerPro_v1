import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get tenant_id from user profile
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
  if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 400 })

  const body = await req.json()
  const { asset_id, category, geofence_id, trigger_event, min_duration_minutes, notify_email, notify_in_app, escalation_level, is_active } = body
  if (!trigger_event || !geofence_id) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  const { data, error } = await supabase.from("geofence_rules").update({
    asset_id,
    category,
    geofence_id,
    trigger_event,
    min_duration_minutes,
    notify_email,
    notify_in_app,
    escalation_level,
    is_active: is_active !== false,
    updated_at: new Date().toISOString(),
  }).eq("id", params.id).eq("tenant_id", profile.tenant_id).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get tenant_id from user profile
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
  if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 400 })

  const { error } = await supabase.from("geofence_rules").delete().eq("id", params.id).eq("tenant_id", profile.tenant_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 