import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    // Get user for authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format = 'json', reportType = 'all', dateFrom, dateTo, category, status } = await request.json()

    // Get current date and calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    let query = supabase.from('assets').select('id, name, status, category, purchase_value, created_at')
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)
    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Fetch comprehensive analytics data
    const [
      totalAssets,
      activeAssets,
      assetsCreatedToday,
      assetsCreatedThisWeek,
      assetsCreatedThisMonth,
      assetsByCategory,
      assetsByStatus,
      recentActivity,
      qrCodeStats,
      userActivity,
      locationStats,
      valueStats,
      allAssets
    ] = await Promise.all([
      // Total assets
      supabase.from('assets').select('id', { count: 'exact' }),
      
      // Active assets
      supabase.from('assets').select('id', { count: 'exact' }).eq('status', 'active'),
      
      // Assets created today
      supabase.from('assets').select('id', { count: 'exact' })
        .gte('created_at', today.toISOString()),
      
      // Assets created this week
      supabase.from('assets').select('id', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString()),
      
      // Assets created this month
      supabase.from('assets').select('id', { count: 'exact' })
        .gte('created_at', monthAgo.toISOString()),
      
      // Assets by category
      supabase.from('assets').select('category, id').not('category', 'is', null),
      
      // Assets by status
      supabase.from('assets').select('status, id'),
      
      // Recent activity (last 50 activities)
      supabase.from('assets').select('id, name, created_at, updated_at, status')
        .order('updated_at', { ascending: false })
        .limit(50),
      
      // QR code statistics
      supabase.from('assets').select('id, qr_code').not('qr_code', 'is', null),
      
      // User activity (profiles)
      supabase.from('profiles').select('id, full_name, created_at, last_sign_in_at'),
      
      // Location statistics
      supabase.from('assets').select('location').not('location', 'is', null),
      
      // Value statistics
      supabase.from('assets').select('purchase_value').not('purchase_value', 'is', null),
      
      // All assets for detailed export
      supabase.from('assets').select('*').order('created_at', { ascending: false })
    ])

    // Process data similar to analytics endpoint
    const categoryCounts: { [key: string]: number } = {}
    if (assetsByCategory.data) {
      assetsByCategory.data.forEach(asset => {
        if (asset.category) {
          categoryCounts[asset.category] = (categoryCounts[asset.category] || 0) + 1
        }
      })
    }

    const statusCounts: { [key: string]: number } = {}
    if (assetsByStatus.data) {
      assetsByStatus.data.forEach(asset => {
        if (asset.status) {
          statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1
        }
      })
    }

    const locationCounts: { [key: string]: number } = {}
    if (locationStats.data) {
      locationStats.data.forEach(asset => {
        if (asset.location) {
          locationCounts[asset.location] = (locationCounts[asset.location] || 0) + 1
        }
      })
    }

    const totalValue = valueStats.data?.reduce((sum, asset) => {
      return sum + (asset.purchase_value || 0)
    }, 0) || 0

    const qrCoverage = totalAssets.count && qrCodeStats.data 
      ? Math.round((qrCodeStats.data.length / totalAssets.count) * 100)
      : 0

    const analytics = {
      overview: {
        totalAssets: totalAssets.count || 0,
        activeAssets: activeAssets.count || 0,
        assetsCreatedToday: assetsCreatedToday.count || 0,
        assetsCreatedThisWeek: assetsCreatedThisWeek.count || 0,
        assetsCreatedThisMonth: assetsCreatedThisMonth.count || 0,
        totalValue: totalValue,
        qrCoverage: qrCoverage,
        lastUpdated: now.toISOString()
      },
      categories: Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: totalAssets.count ? Math.round((count / totalAssets.count) * 100) : 0
      })),
      status: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalAssets.count ? Math.round((count / totalAssets.count) * 100) : 0
      })),
      locations: Object.entries(locationCounts).map(([location, count]) => ({
        location,
        count,
        percentage: totalAssets.count ? Math.round((count / totalAssets.count) * 100) : 0
      })),
      recentActivity: recentActivity.data || [],
      userActivity: {
        totalUsers: userActivity.data?.length || 0,
        activeUsers: userActivity.data?.filter(u => u.last_sign_in_at).length || 0,
        newUsersThisMonth: userActivity.data?.filter(u => 
          new Date(u.created_at) >= monthAgo
        ).length || 0
      },
      assets: allAssets.data || []
    }

    let exportData: any
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertToCSV(analytics, reportType)
        contentType = 'text/csv'
        filename = `assetpro-analytics-${reportType}-${now.toISOString().split('T')[0]}.csv`
        break
      
      case 'json':
        exportData = JSON.stringify(analytics, null, 2)
        contentType = 'application/json'
        filename = `assetpro-analytics-${reportType}-${now.toISOString().split('T')[0]}.json`
        break
      
      case 'pdf':
        const { default: jsPDF } = await import('jspdf')
        const doc = new jsPDF()
        doc.text("Asset Report", 10, 10)
        let y = 20
        data.forEach((asset: any, i: number) => {
          doc.text(`${i + 1}. ${asset.name} | ${asset.category} | ${asset.status} | $${asset.purchase_value} | ${asset.created_at}`, 10, y)
          y += 10
        })
        const pdf = doc.output("arraybuffer")
        return new NextResponse(Buffer.from(pdf), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=asset-report.pdf"
          }
        })
      
      case 'xlsx':
        const ExcelJS = (await import('exceljs')).default
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet("Assets")
        sheet.addRow(["Name", "Category", "Status", "Value", "Created At"])
        data.forEach((asset: any) => {
          sheet.addRow([asset.name, asset.category, asset.status, asset.purchase_value, asset.created_at])
        })
        const buffer = await workbook.xlsx.writeBuffer()
        return new NextResponse(Buffer.from(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=asset-report.xlsx"
          }
        })
      
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json({ error: 'Failed to export analytics data' }, { status: 500 })
  }
}

function convertToCSV(data: any, reportType: string): string {
  let csvContent = ''
  
  switch (reportType) {
    case 'overview':
      csvContent = 'Metric,Value\n'
      csvContent += `Total Assets,${data.overview.totalAssets}\n`
      csvContent += `Active Assets,${data.overview.activeAssets}\n`
      csvContent += `Assets Created Today,${data.overview.assetsCreatedToday}\n`
      csvContent += `Assets Created This Week,${data.overview.assetsCreatedThisWeek}\n`
      csvContent += `Assets Created This Month,${data.overview.assetsCreatedThisMonth}\n`
      csvContent += `Total Value,${data.overview.totalValue}\n`
      csvContent += `QR Coverage,${data.overview.qrCoverage}%\n`
      break
    
    case 'categories':
      csvContent = 'Category,Count,Percentage\n'
      data.categories.forEach((cat: any) => {
        csvContent += `${cat.category},${cat.count},${cat.percentage}%\n`
      })
      break
    
    case 'status':
      csvContent = 'Status,Count,Percentage\n'
      data.status.forEach((status: any) => {
        csvContent += `${status.status},${status.count},${status.percentage}%\n`
      })
      break
    
    case 'locations':
      csvContent = 'Location,Count,Percentage\n'
      data.locations.forEach((loc: any) => {
        csvContent += `${loc.location},${loc.count},${loc.percentage}%\n`
      })
      break
    
    case 'assets':
      csvContent = 'ID,Name,Category,Status,Location,Purchase Value,Created At,Updated At\n'
      data.assets.forEach((asset: any) => {
        csvContent += `${asset.id},${asset.name || ''},${asset.category || ''},${asset.status || ''},${asset.location || ''},${asset.purchase_value || ''},${asset.created_at || ''},${asset.updated_at || ''}\n`
      })
      break
    
    case 'activity':
      csvContent = 'Asset Name,Status,Last Updated\n'
      data.recentActivity.forEach((activity: any) => {
        csvContent += `${activity.name || ''},${activity.status || ''},${activity.updated_at || ''}\n`
      })
      break
    
    case 'users':
      csvContent = 'Metric,Value\n'
      csvContent += `Total Users,${data.userActivity.totalUsers}\n`
      csvContent += `Active Users,${data.userActivity.activeUsers}\n`
      csvContent += `New Users This Month,${data.userActivity.newUsersThisMonth}\n`
      break
    
    case 'all':
      csvContent = 'Report Type,Data\n'
      csvContent += `Overview,${JSON.stringify(data.overview)}\n`
      csvContent += `Categories,${JSON.stringify(data.categories)}\n`
      csvContent += `Status,${JSON.stringify(data.status)}\n`
      csvContent += `Locations,${JSON.stringify(data.locations)}\n`
      csvContent += `User Activity,${JSON.stringify(data.userActivity)}\n`
      break
    
    default:
      csvContent = 'No data available for this report type\n'
  }
  
  return csvContent
} 