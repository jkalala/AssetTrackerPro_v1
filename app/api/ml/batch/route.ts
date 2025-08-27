/**
 * ML Batch Processing API
 * Handles batch ML operations for multiple assets
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
      const { tenant_id, job_type, asset_ids } = body

      if (!tenant_id || !job_type) {
        return NextResponse.json(
          { error: 'Missing required fields: tenant_id, job_type' },
          { status: 400 }
        )
      }

      const validJobTypes = ['maintenance_predictions', 'utilization_analysis', 'anomaly_detection']
      if (!validJobTypes.includes(job_type)) {
        return NextResponse.json(
          { error: `Invalid job_type. Must be one of: ${validJobTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // Create batch job
      const job = await mlService.createBatchPredictionJob(tenant_id, job_type, asset_ids)

      return NextResponse.json({
        success: true,
        job,
        message: 'Batch job created and processing started'
      })

    } catch (error) {
      console.error('Batch job creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create batch job' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenant_id')
      const jobId = searchParams.get('job_id')
      const status = searchParams.get('status')

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Missing tenant_id parameter' },
          { status: 400 }
        )
      }

      if (jobId) {
        // Get specific job
        const { data: job, error } = await supabase
          .from('ml_batch_jobs')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('id', jobId)
          .single()

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          job
        })
      } else {
        // Get all jobs for tenant
        let query = supabase
          .from('ml_batch_jobs')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (status) {
          query = query.eq('status', status)
        }

        const { data: jobs, error } = await query

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          jobs: jobs || [],
          total: jobs?.length || 0
        })
      }

    } catch (error) {
      console.error('Failed to fetch batch jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch batch jobs' },
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