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

    const schedules = await reportingService.getReportSchedules(user.tenant_id)
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
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
    const schedule = await reportingService.createReportSchedule(
      user.tenant_id,
      user.id,
      data
    )

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}