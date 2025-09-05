import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mfaService } from '@/lib/services/mfa-service'

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
    const { method_type, method_name, phone_number, email } = body

    if (!method_type || !method_name) {
      return NextResponse.json({ error: 'Method type and name are required' }, { status: 400 })
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

    let result

    switch (method_type) {
      case 'totp':
        result = await mfaService.setupTOTP(
          profile.tenant_id,
          user.id,
          method_name,
          user.email || ''
        )
        break

      case 'sms':
        if (!phone_number) {
          return NextResponse.json({ error: 'Phone number is required for SMS' }, { status: 400 })
        }
        result = await mfaService.setupSMS(profile.tenant_id, user.id, method_name, phone_number)
        break

      case 'email':
        const emailAddress = email || user.email
        if (!emailAddress) {
          return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
        }
        result = await mfaService.setupEmail(profile.tenant_id, user.id, method_name, emailAddress)
        break

      default:
        return NextResponse.json({ error: 'Invalid method type' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return setup data (secret is only returned during setup, not stored in method)
    const response: {
      success: boolean
      method: unknown
      qrCode?: string
      secret?: string
      backupCodes?: string[]
    } = {
      success: true,
      method: result.method,
    }

    if (result.qrCode) {
      response.qrCode = result.qrCode
    }

    if (result.secret) {
      response.secret = result.secret
    }

    if (result.backupCodes) {
      response.backupCodes = result.backupCodes
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
