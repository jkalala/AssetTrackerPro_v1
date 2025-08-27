import { NextRequest, NextResponse } from 'next/server'
import { ReportingService } from '@/lib/services/reporting-service'
import { getCurrentUser } from '@/lib/auth-actions'

const reportingService = new ReportingService()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenant_id || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the schedule
    const schedules = await reportingService.getReportSchedules(user.tenant_id)
    const schedule = schedules.find(s => s.id === params.id)
    
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Process the scheduled report
    await reportingService.processScheduledReport(schedule)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error running scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to run scheduled report' },
      { status: 500 }
    )
  }
}