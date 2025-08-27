import { NextRequest, NextResponse } from 'next/server'
import { ReportingService } from '@/lib/services/reporting-service'
import { getCurrentUser } from '@/lib/auth-actions'

const reportingService = new ReportingService()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fields = await reportingService.getAvailableFields(user.tenant_id)
    return NextResponse.json(fields)
  } catch (error) {
    console.error('Error fetching available fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available fields' },
      { status: 500 }
    )
  }
}