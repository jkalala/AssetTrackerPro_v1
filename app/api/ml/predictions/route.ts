/**
 * ML Predictions API
 * Handles predictive maintenance and analytics requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { MLService } from '@/lib/services/ml-service'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'

async function handler(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const mlService = new MLService(supabase)

  if (request.method === 'POST') {
    try {
      const body = await request.json()
      const { prediction_type, asset_ids, tenant_id, options = {} } = body

      if (!prediction_type || !asset_ids || !tenant_id) {
        return NextResponse.json(
          { error: 'Missing required fields: prediction_type, asset_ids, tenant_id' },
          { status: 400 }
        )
      }

      let results

      switch (prediction_type) {
        case 'maintenance':
          results = await mlService.predictMaintenance(tenant_id, asset_ids)
          break

        case 'utilization':
          results = await mlService.analyzeUtilization(tenant_id, asset_ids)
          break

        case 'anomaly':
          results = await mlService.detectAnomalies(tenant_id, asset_ids)
          break

        case 'lifecycle':
          results = await mlService.forecastAssetLifecycle(tenant_id, asset_ids)
          break

        default:
          return NextResponse.json(
            { error: 'Invalid prediction_type. Must be one of: maintenance, utilization, anomaly, lifecycle' },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        prediction_type,
        results,
        total_assets: asset_ids.length,
        processed_at: new Date().toISOString()
      })

    } catch (error) {
      console.error('ML prediction error:', error)
      return NextResponse.json(
        { error: 'Failed to generate predictions' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenant_id')
      const predictionType = searchParams.get('prediction_type')
      const limit = parseInt(searchParams.get('limit') || '50')

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Missing tenant_id parameter' },
          { status: 400 }
        )
      }

      // Get recent predictions from database
      let query = supabase
        .from('ml_predictions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (predictionType) {
        query = query.eq('prediction_type', predictionType)
      }

      const { data: predictions, error } = await query

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        predictions: predictions || [],
        total: predictions?.length || 0
      })

    } catch (error) {
      console.error('Failed to fetch predictions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export const POST = withRateLimit(withAuth(handler))

export const GET = withRateLimit(withAuth(handler))