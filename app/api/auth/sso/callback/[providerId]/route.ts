import { NextRequest, NextResponse } from 'next/server'
import { ssoService } from '@/lib/services/sso-service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { providerId: string } }) {
  try {
    const { providerId } = params
    const searchParams = request.nextUrl.searchParams

    // Extract callback data from query parameters
    const callbackData: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      callbackData[key] = value
    })

    const supabase = await createClient()

    // Get provider information
    const { data: provider, error: providerError } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', providerId)
      .eq('is_enabled', true)
      .single()

    if (providerError || !provider) {
      return NextResponse.redirect(new URL('/login?error=invalid_sso_provider', request.url))
    }

    // Handle SSO callback
    const result = await ssoService.handleSsoCallback(provider.tenant_id, providerId, callbackData)

    if (!result.success || !result.userInfo) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(result.error || 'SSO authentication failed')}`,
          request.url
        )
      )
    }

    const { userInfo } = result

    // Create or update user in Supabase Auth
    // For demo purposes, we'll create a session directly
    // In production, you'd integrate with Supabase Auth properly

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userInfo.email)
      .single()

    let userId: string

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`.trim(),
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          sso_provider: provider.provider_name,
        },
      })

      if (createError || !newUser.user) {
        return NextResponse.redirect(new URL('/login?error=user_creation_failed', request.url))
      }

      userId = newUser.user.id

      // Create profile
      await supabase.from('profiles').insert({
        id: userId,
        email: userInfo.email,
        full_name: userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`.trim(),
        tenant_id: provider.tenant_id,
        role: 'user',
      })
    } else if (existingUser) {
      userId = existingUser.id
    } else {
      return NextResponse.redirect(new URL('/login?error=user_lookup_failed', request.url))
    }

    // Generate session token (simplified for demo)
    // In production, use proper Supabase Auth session management
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId,
        email: userInfo.email,
        tenantId: provider.tenant_id,
        ssoProvider: provider.provider_name,
        timestamp: Date.now(),
      })
    ).toString('base64')

    // Set session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('sso-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('SSO callback error:', error)
    return NextResponse.redirect(new URL('/login?error=sso_callback_error', request.url))
  }
}

export async function POST(request: NextRequest, { params }: { params: { providerId: string } }) {
  // Handle SAML POST callback
  try {
    const formData = await request.formData()

    // Extract SAML response data
    const callbackData: Record<string, string> = {}
    formData.forEach((value, key) => {
      callbackData[key] = value.toString()
    })

    // Process the same way as GET
    return GET(request, { params })
  } catch (error) {
    console.error('SSO POST callback error:', error)
    return NextResponse.redirect(new URL('/login?error=sso_callback_error', request.url))
  }
}
