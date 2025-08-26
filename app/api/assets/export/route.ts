/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    // Fetch assets for this user
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('created_by', user.id)
    if (assetsError) {
      return new NextResponse('Failed to fetch assets', { status: 500 })
    }
    // Convert to CSV
    const fields = assets && assets.length > 0 ? Object.keys(assets[0]) : []
    const csvRows = [fields.join(','), ...assets.map(asset => fields.map(f => JSON.stringify(asset[f] ?? '')).join(','))]
    const csv = csvRows.join('\r\n')
    // Return as file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="assets-export.csv"',
      },
    })
  } catch (err) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 