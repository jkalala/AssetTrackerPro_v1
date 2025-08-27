import { NextRequest, NextResponse } from 'next/server'
import { ReportingService } from '@/lib/services/reporting-service'
import { createClient } from '@/lib/supabase/server'

const reportingService = new ReportingService()

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user?.tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await reportingService.getReportDefinitions(user.tenant_id)
    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user?.tenant_id || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const report = await reportingService.createReportDefinition(
      user.tenant_id,
      user.id,
      data
    )

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}