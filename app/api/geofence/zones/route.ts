import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('geofence_zones')
    .select('id, name, polygon, description')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ zones: data })
}

// Create geofence zone
export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { name, polygon, description } = body
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Role check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { data, error } = await supabase
    .from('geofence_zones')
    .insert({ name, polygon, description })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ zone: data })
}

// Update geofence zone
export async function PUT(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { id, name, polygon, description } = body
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Role check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { data, error } = await supabase
    .from('geofence_zones')
    .update({ name, polygon, description })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ zone: data })
}

// Delete geofence zone
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { id } = body
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Role check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { error } = await supabase
    .from('geofence_zones')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 