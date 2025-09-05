import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiKeyService } from '@/lib/services/api-key-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const includeRevoked = searchParams.get('include_revoked') === 'true'

    const result = await apiKeyService.getUserApiKeys(profile.tenant_id, user.id, includeRevoked)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      apiKeys: result.apiKeys,
    })
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      key_name,
      permissions = {},
      scopes = [],
      expires_in_days,
      rate_limit_requests,
      rate_limit_window_seconds,
      allowed_ips = [],
    } = body

    if (!key_name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    // Get user's tenant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    const result = await apiKeyService.createApiKey(
      profile.tenant_id,
      user.id,
      key_name,
      permissions,
      scopes,
      {
        expiresInDays: expires_in_days,
        rateLimitRequests: rate_limit_requests,
        rateLimitWindowSeconds: rate_limit_window_seconds,
        allowedIps: allowed_ips,
      }
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      keyValue: result.keyValue,
    })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      key_id,
      key_name,
      permissions,
      scopes,
      allowed_ips,
      rate_limit_requests,
      rate_limit_window_seconds,
      expires_at,
    } = body

    if (!key_id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    // Get user's tenant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    const result = await apiKeyService.updateApiKey(profile.tenant_id, user.id, key_id, {
      keyName: key_name,
      permissions,
      scopes,
      allowedIps: allowed_ips,
      rateLimitRequests: rate_limit_requests,
      rateLimitWindowSeconds: rate_limit_window_seconds,
      expiresAt: expires_at,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
    })
  } catch (error) {
    console.error('Update API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('key_id')
    const reason = searchParams.get('reason') || 'User revoked'

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    // Get user's tenant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    const result = await apiKeyService.revokeApiKey(profile.tenant_id, user.id, keyId, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
