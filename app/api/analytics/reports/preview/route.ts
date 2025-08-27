import { NextRequest, NextResponse } from 'next/server'
import { ReportingService } from '@/lib/services/reporting-service'
import { getCurrentUser } from '@/lib/auth-actions'

const reportingService = new ReportingService()

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportData = await request.json()
    
    // Create a temporary report for preview
    const tempReport = {
      id: 'preview',
      tenant_id: user.tenant_id,
      created_by: user.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...reportData
    }

    // Generate preview data
    const data = await reportingService.executeReport(
      user.tenant_id,
      'preview',
      {}
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error generating report preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate report preview' },
      { status: 500 }
    )
  }
}