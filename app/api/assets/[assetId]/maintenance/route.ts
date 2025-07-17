import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { data, error } = await supabase
    .from("asset_maintenance_schedules")
    .select("*")
    .eq("asset_id", assetId)
    .order("next_due", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { type, interval, next_due, notes } = await req.json()
  const { data, error } = await supabase
    .from("asset_maintenance_schedules")
    .insert({ asset_id: assetId, type, interval, next_due, notes })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { id, type, interval, next_due, notes, status, completed_at } = await req.json()
  const { data, error } = await supabase
    .from("asset_maintenance_schedules")
    .update({ type, interval, next_due, notes, status, completed_at, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("asset_id", assetId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { id } = await req.json()
  const { error } = await supabase
    .from("asset_maintenance_schedules")
    .delete()
    .eq("id", id)
    .eq("asset_id", assetId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 