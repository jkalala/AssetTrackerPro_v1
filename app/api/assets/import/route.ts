import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

export const runtime = 'nodejs' // Ensure Node.js runtime for file parsing

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // RBAC permission check
    const authorized = await isAuthorized(user.id, 'create:asset' as Permission)
    if (!authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    const fileName = file.name || ''
    let rows: any[] = []
    let parseErrors: any[] = []
    if (fileName.endsWith('.csv')) {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      rows = parsed.data as any[]
      parseErrors = parsed.errors
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet)
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    if (parseErrors && parseErrors.length > 0) {
      return NextResponse.json({ error: 'CSV parse error', details: parseErrors }, { status: 400 })
    }
    // Insert/update assets
    let successCount = 0
    let errorCount = 0
    let errorRows: any[] = []
    let importedAssetIds: string[] = []
    const REQUIRED_COLUMNS = ["asset_id", "name"]
    for (const row of rows) {
      // Validate required columns
      const missing = REQUIRED_COLUMNS.filter(col => !row[col])
      if (missing.length > 0) {
        errorCount++
        errorRows.push({ row, error: `Missing required fields: ${missing.join(", ")}` })
        continue
      }
      // Optionally: validate data types (e.g., value is a number)
      if (row.value && isNaN(Number(row.value))) {
        errorCount++
        errorRows.push({ row, error: 'Value must be a number' })
        continue
      }
      const { error } = await supabase
        .from('assets')
        .upsert({
          ...row,
          created_by: user.id,
        }, { onConflict: 'asset_id' })
      if (error) {
        errorCount++
        errorRows.push({ row, error: error.message })
      } else {
        successCount++
        importedAssetIds.push(row.asset_id)
      }
    }
    // Log import event
    await supabase.from('asset_imports').insert({
      user_id: user.id,
      file_name: fileName,
      success_count: successCount,
      error_count: errorCount,
      error_rows: errorRows,
      asset_ids: importedAssetIds,
    })
    return NextResponse.json({ success: true, successCount, errorCount, errorRows })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 