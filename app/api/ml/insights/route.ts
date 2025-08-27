/**
 * ML Insights API
 * Handles ML-generated insights and recommendations
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
      const { tenant_id, regenerate = false } = body

      if (!tenant_id) {
        return NextResponse.json(
          { error: 'Missing required field: tenant_id' },
          { status: 400 }
        )
      }

      // Generate new insights
      const insights = await mlService.generateInsights(tenant_id)

      return NextResponse.json({
        success: true,
        insights,
        total_insights: insights.length,
        generated_at: new Date().toISOString()
      })

    } catch (error) {
      console.error('ML insights generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate insights' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenant_id')
      const category = searchParams.get('category')
      const impact = searchParams.get('impact')
      const limit = parseInt(searchParams.get('limit') || '20')

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Missing tenant_id parameter' },
          { status: 400 }
        )
      }

      // Get insights from database
      let query = supabase
        .from('ml_insights')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      if (impact) {
        query = query.eq('impact', impact)
      }

      const { data: insights, error } = await query

      if (error) {
        throw error
      }

      // Group insights by category for better organization
      const groupedInsights = (insights || []).reduce((acc, insight) => {
        const category = insight.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(insight)
        return acc
      }, {} as Record<string, any[]>)

      return NextResponse.json({
        success: true,
        insights: insights || [],
        grouped_insights: groupedInsights,
        total: insights?.length || 0
      })

    } catch (error) {
      console.error('Failed to fetch insights:', error)
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
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