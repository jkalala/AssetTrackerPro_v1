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

    // Create execution record
    const execution = await reportingService.createReportExecution(
      user.tenant_id,
      user.id,
      {
        report_id: params.id,
        status: 'pending',
        format: 'json',
        parameters: {}
      }
    )

    // Start background execution (in a real implementation, this would be queued)
    setTimeout(async () => {
      try {
        await reportingService.updateReportExecution(execution.id, {
          status: 'running'
        })

        const reportData = await reportingService.executeReport(
          user.tenant_id,
          params.id
        )

        await reportingService.updateReportExecution(execution.id, {
          status: 'completed',
          execution_time_ms: reportData.execution_time_ms,
          row_count: reportData.total_rows,
          completed_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error executing report:', error)
        await reportingService.updateReportExecution(execution.id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
      }
    }, 1000)

    return NextResponse.json(execution, { status: 201 })
  } catch (error) {
    console.error('Error starting report execution:', error)
    return NextResponse.json(
      { error: 'Failed to start report execution' },
      { status: 500 }
    )
  }
}