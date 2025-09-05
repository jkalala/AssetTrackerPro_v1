import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider')
  if (!provider) {
    return NextResponse.json({ error: 'Missing provider' }, { status: 400 })
  }
  // Redirect to Supabase Auth OAuth endpoint
  const redirectUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + '/auth/callback')}`
  return NextResponse.redirect(redirectUrl)
}
