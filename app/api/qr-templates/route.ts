import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get tenant_id from user profile
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
  if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 400 })

  const { data, error } = await supabase
    .from("qr_templates")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get tenant_id from user profile
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
  if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant" }, { status: 400 })

  const body = await req.json()
  const { name, config, is_default } = body
  if (!name || !config) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const { data, error } = await supabase.from("qr_templates").insert({
    tenant_id: profile.tenant_id,
    name,
    config,
    is_default: !!is_default,
  }).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
} 