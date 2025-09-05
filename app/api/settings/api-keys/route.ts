import { storeApiKey } from '@/lib/api-key'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Get tenant_id from user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, created_at, revoked, user_id')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keys: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'manage:settings' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { name } = await request.json()
  // Get tenant_id from user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  try {
    const { apiKey } = await storeApiKey({ tenant_id: profile.tenant_id, user_id: user.id, name })
    return NextResponse.json({ apiKey })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    )
  }
}
