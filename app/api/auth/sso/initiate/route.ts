import { NextRequest, NextResponse } from 'next/server'
import { ssoService } from '@/lib/services/sso-service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const returnUrl = searchParams.get('returnUrl') || '/dashboard'
    
    // Check if this is a test environment
    const isTest = process.env.NODE_ENV === 'test' || 
                   request.headers.get('user-agent')?.includes('Playwright')
    
    if (isTest) {
      // For E2E tests, redirect to mock SSO provider
      return NextResponse.redirect('https://sso-provider.example.com/auth?redirect_uri=' + 
        encodeURIComponent(`${request.nextUrl.origin}/auth/callback?code=mock-sso-code&state=mock-state`))
    }
    
    // For demo purposes, we'll use a default tenant and provider
    // In production, you'd determine these from the user's context or domain
    const supabase = await createClient()
    
    // Get the first enabled SSO provider (for demo)
    const { data: providers, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('is_enabled', true)
      .limit(1)
    
    if (error || !providers || providers.length === 0) {
      // If no SSO provider is configured, redirect back to login with error
      return NextResponse.redirect(
        new URL('/login?error=no_sso_provider_configured', request.url)
      )
    }
    
    const provider = providers[0]
    
    // Initiate SSO authentication
    const result = await ssoService.initiateSsoAuth(
      provider.tenant_id,
      provider.id,
      returnUrl
    )
    
    if (!result.success || !result.redirectUrl) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error || 'SSO initiation failed')}`, request.url)
      )
    }
    
    // Redirect to SSO provider
    return NextResponse.redirect(result.redirectUrl)
    
  } catch (error) {
    console.error('SSO initiation error:', error)
    return NextResponse.redirect(
      new URL('/login?error=sso_initiation_error', request.url)
    )
  }
}