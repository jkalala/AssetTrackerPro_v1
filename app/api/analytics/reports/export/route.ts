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

    const { report, data, format } = await request.json()
    
    let fileBuffer: Buffer
    let mimeType: string
    let fileName: string

    switch (format) {
      case 'pdf':
        fileBuffer = await reportingService.exportReportToPDF(data, report.template)
        mimeType = 'application/pdf'
        fileName = `${report.name || 'report'}.pdf`
        break
      case 'excel':
        fileBuffer = await reportingService.exportReportToExcel(data, report.template)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileName = `${report.name || 'report'}.xlsx`
        break
      case 'csv':
        const csvContent = await reportingService.exportReportToCSV(data)
        fileBuffer = Buffer.from(csvContent, 'utf-8')
        mimeType = 'text/csv'
        fileName = `${report.name || 'report'}.csv`
        break
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}