import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("asset_categories")
    .select("*")
    .order("name", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { name, parent_id } = await req.json()
  const { data, error } = await supabase
    .from("asset_categories")
    .insert({ name, parent_id: parent_id || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { id, name, parent_id } = await req.json()
  const { data, error } = await supabase
    .from("asset_categories")
    .update({ name, parent_id: parent_id || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id } = await req.json()
  const { error } = await supabase
    .from("asset_categories")
    .delete()
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 