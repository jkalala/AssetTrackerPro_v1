import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const body = await req.json()
  const { permissions } = body
  if (!Array.isArray(permissions)) return NextResponse.json({ error: "Missing permissions array" }, { status: 400 })
  const { data, error } = await supabase.from("roles").update({ permissions }).eq("id", params.id).select("id, name, permissions").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ role: data })
} 