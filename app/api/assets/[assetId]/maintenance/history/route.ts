import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { data, error } = await supabase
    .from("asset_maintenance_history")
    .select("*, performed_by:performed_by(*)")
    .eq("asset_id", assetId)
    .order("performed_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { schedule_id, performed_at, notes, performed_by } = await req.json()
  const { data, error } = await supabase
    .from("asset_maintenance_history")
    .insert({ asset_id: assetId, schedule_id, performed_at, notes, performed_by })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
} 