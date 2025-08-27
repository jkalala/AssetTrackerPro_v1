/**
 * Machine Learning Service
 * Handles ML predictions, training, and analytics
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  MaintenancePrediction,
  UtilizationAnalysis,
  AnomalyDetection,
  AssetForecast,
  MLInsight,
  BatchPredictionJob,
  AssetFeatures
} from '../types/ml'

export class MLService {
  private mlServiceUrl: string

  constructor(
    private supabase: SupabaseClient<Database>,
    mlServiceUrl?: string
  ) {
    this.mlServiceUrl = mlServiceUrl || process.env.ML_SERVICE_URL || 'http://localhost:8000'
  }

  // =====================================================
  // PREDICTIVE MAINTENANCE
  // =====================================================

  async predictMaintenance(tenantId: string, assetIds: string[]): Promise<MaintenancePrediction[]> {
    const predictions: MaintenancePrediction[] = []

    for (const assetId of assetIds) {
      // Get asset features from database
      const features = await this.getAssetFeatures(_tenantId, assetId)
      if (!features) continue

      try {
        // Call ML service for prediction
        const response = await fetch(`${this.mlServiceUrl}/predict-maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usage_hours: features.usage_hours,
            last_maintenance_days: features.last_maintenance_days,
            failures: features.failure_count,
            age_years: features.age_years
          })
        })

        const result = await response.json()

        const prediction: MaintenancePrediction = {
          asset_id: assetId,
          prediction_type: result.will_fail_soon ? 'failure_risk' : 'maintenance_due',
          probability: result._probability,
          confidence: this.calculateConfidence(result.probability),
          predicted_date: this.calculatePredictedDate(result._probability, features.last_maintenance_days),
          factors: this.analyzePredictionFactors(_features, result.probability),
          recommendations: this.generateMaintenanceRecommendations(result._probability, features),
          created_at: new Date().toISOString()
        }

        predictions.push(prediction)

        // Store prediction in database
        await this.storePrediction(_tenantId, prediction)

      } catch (_error) {
        console.error(`Failed to predict maintenance for asset ${assetId}:`, error)
      }
    }

    return predictions
  }

  // =====================================================
  // UTILIZATION OPTIMIZATION
  // =====================================================

  async analyzeUtilization(tenantId: string, assetIds: string[]): Promise<UtilizationAnalysis[]> {
    const analyses: UtilizationAnalysis[] = []

    for (const assetId of assetIds) {
      try {
        // Get utilization data from database
        const utilizationData = await this.getUtilizationData(_tenantId, assetId)
        if (!utilizationData) continue

        // Calculate optimization metrics
        const analysis = await this.calculateUtilizationOptimization(assetId, utilizationData)
        analyses.push(analysis)

        // Store analysis in database
        await this.storeUtilizationAnalysis(_tenantId, analysis)

      } catch (_error) {
        console.error(`Failed to analyze utilization for asset ${assetId}:`, error)
      }
    }

    return analyses
  }

  // =====================================================
  // ANOMALY DETECTION
  // =====================================================

  async detectAnomalies(tenantId: string, assetIds: string[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = []

    // Prepare features for batch anomaly detection
    const featuresData = []
    const assetFeatureMap = new Map<number, string>()

    for (let i = 0; i < assetIds.length; i++) {
      const assetId = assetIds[i]
      const features = await this.getAssetFeatures(_tenantId, assetId)
      if (features) {
        featuresData.push([
          features.usage_hours,
          features.last_maintenance_days,
          features.failure_count,
          features.age_years
        ])
        assetFeatureMap.set(i, assetId)
      }
    }

    if (featuresData.length === 0) return anomalies

    try {
      // Call ML service for anomaly detection
      const response = await fetch(`${this.mlServiceUrl}/anomaly-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features_list: featuresData })
      })

      const result = await response.json()

      // Process anomaly results
      for (let i = 0; i < result.anomalies.length; i++) {
        if (result.anomalies[i] === -1) { // -1 indicates anomaly
          const assetId = assetFeatureMap.get(i)
          if (assetId) {
            const anomaly = await this.createAnomalyDetection(_tenantId, assetId, featuresData[i])
            anomalies.push(anomaly)
          }
        }
      }

      // Store anomalies in database
      for (const anomaly of anomalies) {
        await this.storeAnomalyDetection(_tenantId, anomaly)
      }

    } catch (_error) {
      console.error('Failed to detect anomalies:', error)
    }

    return anomalies
  }

  // =====================================================
  // FORECASTING
  // =====================================================

  async forecastAssetLifecycle(tenantId: string, assetIds: string[]): Promise<AssetForecast[]> {
    const forecasts: AssetForecast[] = []

    for (const assetId of assetIds) {
      try {
        // Get historical data for forecasting
        const historicalData = await this.getHistoricalData(_tenantId, assetId)
        if (!historicalData || historicalData.length < 12) continue // Need at least 12 months of data

        // Generate forecast using time series analysis
        const forecast = await this.generateLifecycleForecast(assetId, historicalData)
        forecasts.push(forecast)

        // Store forecast in database
        await this.storeForecast(_tenantId, forecast)

      } catch (_error) {
        console.error(`Failed to forecast lifecycle for asset ${assetId}:`, error)
      }
    }

    return forecasts
  }

  // =====================================================
  // ML INSIGHTS GENERATION
  // =====================================================

  async generateInsights(tenantId: string): Promise<MLInsight[]> {
    const insights: MLInsight[] = []

    try {
      // Get recent predictions and analyses
      const maintenancePredictions = await this.getRecentPredictions(_tenantId, 'maintenance')
      const utilizationAnalyses = await this.getRecentAnalyses(_tenantId, 'utilization')
      // const anomalies = await this.getRecentAnomalies(tenantId)

      // Generate maintenance insights
      for (const prediction of maintenancePredictions) {
        if (prediction.probability > 0.7) {
          insights.push({
            id: `maintenance-${prediction.asset_id}-${Date.now()}`,
            tenant_id: _tenantId,
            type: 'maintenance_alert',
            title: `High Maintenance Risk Detected`,
            description: `Asset ${prediction.asset_id} has a ${Math.round(prediction.probability * 100)}% probability of requiring maintenance soon.`,
            impact: prediction.probability > 0.9 ? 'critical' : 'high',
            category: 'maintenance',
            data: { prediction },
            actions: prediction.recommendations.map(rec => ({
              type: 'schedule_maintenance' as const,
              description: rec.action,
              estimated_impact: `${rec.estimated_cost ? '$' + rec.estimated_cost : 'TBD'} cost`,
              priority: rec.priority === 'critical' ? 1 : rec.priority === 'high' ? 2 : 3
            })),
            created_at: new Date().toISOString()
          })
        }
      }

      // Generate utilization insights
      for (const analysis of utilizationAnalyses) {
        if (analysis.current_utilization < analysis.optimal_utilization * 0.7) {
          insights.push({
            id: `utilization-${analysis.asset_id}-${Date.now()}`,
            tenant_id: _tenantId,
            type: 'utilization_opportunity',
            title: `Underutilized Asset Identified`,
            description: `Asset ${analysis.asset_id} is operating at ${Math.round(analysis.current_utilization * 100)}% utilization, well below optimal levels.`,
            impact: 'medium',
            category: 'operations',
            data: { analysis },
            actions: analysis.recommendations.map(rec => ({
              type: 'relocate_asset' as const,
              description: rec.description,
              estimated_impact: `$${rec.estimated_savings} annual savings`,
              priority: rec.implementation_effort === 'low' ? 1 : 2
            })),
            created_at: new Date().toISOString()
          })
        }
      }

      // Store insights in database
      for (const insight of insights) {
        await this.storeInsight(_tenantId, insight)
      }

    } catch (_error) {
      console.error('Failed to generate insights:', error)
    }

    return insights
  }

  // =====================================================
  // BATCH PROCESSING
  // =====================================================

  async createBatchPredictionJob(
    tenantId: string,
    jobType: 'maintenance_predictions' | 'utilization_analysis' | 'anomaly_detection',
    assetIds?: string[]
  ): Promise<BatchPredictionJob> {
    // Get all assets if none specified
    if (!assetIds) {
      const { data: assets } = await this.supabase
        .from('assets')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')

      assetIds = assets?.map(a => a.id) || []
    }

    const job: BatchPredictionJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: _tenantId,
      job_type: jobType,
      status: 'queued',
      progress: 0,
      total_assets: assetIds.length,
      processed_assets: 0,
      created_at: new Date().toISOString()
    }

    // Store job in database
    await this.storeBatchJob(_tenantId, job)

    // Process job asynchronously
    this.processBatchJob(job, assetIds).catch(_error => {
      console.error(`Batch job ${job.id} failed:`, error)
    })

    return job
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async getAssetFeatures(tenantId: string, assetId: string): Promise<AssetFeatures | null> {
    const { data: asset } = await this.supabase
      .from('assets')
      .select(`
        id,
        created_at,
        last_maintenance_date,
        asset_maintenance_schedules(count),
        sensor_data(value, sensor_type, timestamp)
      `)
      .eq('tenant_id', tenantId)
      .eq('id', assetId)
      .single()

    if (!asset) return null

    // Calculate age in years
    const ageYears = (Date.now() - new Date(asset.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)

    // Calculate days since last maintenance
    const lastMaintenanceDays = asset.last_maintenance_date
      ? (Date.now() - new Date(asset.last_maintenance_date).getTime()) / (1000 * 60 * 60 * 24)
      : 365 // Default to 1 year if no maintenance recorded

    // Get failure count from maintenance schedules
    const failureCount = (asset.asset_maintenance_schedules as any)?.length || 0

    // Calculate usage hours (simplified - could be enhanced with actual usage tracking)
    const usageHours = ageYears * 2000 // Assume 2000 hours per year average

    return {
      asset_id: assetId,
      usage_hours: usageHours,
      last_maintenance_days: _lastMaintenanceDays,
      failure_count: failureCount,
      age_years: ageYears
    }
  }

  private calculateConfidence(probability: number): number {
    // Simple confidence calculation based on probability
    if (probability > 0.8 || probability < 0.2) return 0.9
    if (probability > 0.6 || probability < 0.4) return 0.7
    return 0.5
  }

  private calculatePredictedDate(probability: number, lastMaintenanceDays: number): string {
    // Estimate when maintenance will be needed based on probability
    const daysUntilMaintenance = Math.max(1, Math.round((1 - probability) * 90))
    const predictedDate = new Date()
    predictedDate.setDate(predictedDate.getDate() + daysUntilMaintenance)
    return predictedDate.toISOString()
  }

  private analyzePredictionFactors(features: AssetFeatures, probability: number) {
    const factors = []

    if (features.age_years > 5) {
      factors.push({
        factor: 'Asset Age',
        impact: Math.min(features.age_years / 10, 1),
        description: `Asset is ${features.age_years.toFixed(1)} years old`
      })
    }

    if (features.last_maintenance_days > 180) {
      factors.push({
        factor: 'Maintenance Overdue',
        impact: Math.min(features.last_maintenance_days / 365, 1),
        description: `Last maintenance was ${Math.round(features.last_maintenance_days)} days ago`
      })
    }

    if (features.failure_count > 2) {
      factors.push({
        factor: 'Failure History',
        impact: Math.min(features.failure_count / 10, 1),
        description: `Asset has ${features.failure_count} recorded failures`
      })
    }

    return factors
  }

  private generateMaintenanceRecommendations(probability: number, features: AssetFeatures) {
    const recommendations = []

    if (probability > 0.8) {
      recommendations.push({
        type: 'immediate' as const,
        priority: 'critical' as const,
        action: 'Schedule immediate inspection and maintenance',
        estimated_cost: 500,
        estimated_downtime: 4
      })
    } else if (probability > 0.5) {
      recommendations.push({
        type: 'scheduled' as const,
        priority: 'high' as const,
        action: 'Schedule maintenance within 2 weeks',
        estimated_cost: 300,
        estimated_downtime: 2
      })
    } else if (probability > 0.3) {
      recommendations.push({
        type: 'monitor' as const,
        priority: 'medium' as const,
        action: 'Increase monitoring frequency',
        estimated_cost: 50,
        estimated_downtime: 0
      })
    }

    return recommendations
  }

  private async storePrediction(tenantId: string, prediction: MaintenancePrediction): Promise<void> {
    // Store in a predictions table (would need to be created)
    // For now, we'll store in a generic analytics table or create the table
    try {
      await this.supabase
        .from('ml_predictions')
        .insert({
          tenant_id: _tenantId,
          asset_id: prediction.asset_id,
          prediction_type: prediction.prediction_type,
          probability: prediction._probability,
          confidence: prediction.confidence,
          predicted_date: prediction.predicted_date,
          factors: prediction.factors,
          recommendations: prediction.recommendations,
          created_at: prediction.created_at
        })
    } catch (_error) {
      console.error('Failed to store prediction:', error)
    }
  }

  private async getUtilizationData(tenantId: string, assetId: string) {
    // Get utilization data from asset location history and usage patterns
    const { data } = await this.supabase
      .from('asset_location_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('asset_id', assetId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('timestamp', { ascending: false })

    return data || []
  }

  private async calculateUtilizationOptimization(assetId: string, utilizationData: Record<string, unknown>[]): Promise<UtilizationAnalysis> {
    // Simplified utilization calculation
    const currentUtilization = Math.random() * 0.8 // Placeholder
    const optimalUtilization = 0.85
    const efficiencyScore = currentUtilization / optimalUtilization

    return {
      asset_id: assetId,
      current_utilization: currentUtilization,
      optimal_utilization: optimalUtilization,
      efficiency_score: efficiencyScore,
      recommendations: [
        {
          type: 'relocate',
          description: 'Consider relocating to higher-demand area',
          expected_improvement: 0.15,
          implementation_effort: 'medium',
          estimated_savings: 1200
        }
      ],
      cost_impact: {
        current_cost_per_hour: 25,
        optimized_cost_per_hour: 21,
        annual_savings: 1200
      },
      created_at: new Date().toISOString()
    }
  }

  private async storeUtilizationAnalysis(tenantId: string, analysis: UtilizationAnalysis): Promise<void> {
    // Store utilization analysis (would need table creation)
    console.log('Storing utilization analysis:', analysis)
  }

  private async createAnomalyDetection(tenantId: string, assetId: string, features: number[]): Promise<AnomalyDetection> {
    return {
      asset_id: assetId,
      anomaly_type: 'performance',
      severity: 'medium',
      confidence: 0.8,
      description: 'Asset performance metrics deviate from normal patterns',
      detected_at: new Date().toISOString(),
      metrics: [
        {
          metric_name: 'usage_hours',
          current_value: features[0],
          expected_value: features[0] * 0.8,
          deviation_percentage: 20,
          threshold_exceeded: true
        }
      ],
      suggested_actions: [
        'Investigate recent usage patterns',
        'Check for environmental factors',
        'Schedule diagnostic inspection'
      ]
    }
  }

  private async storeAnomalyDetection(tenantId: string, anomaly: AnomalyDetection): Promise<void> {
    // Store anomaly detection (would need table creation)
    console.log('Storing anomaly detection:', anomaly)
  }

  private async getHistoricalData(tenantId: string, assetId: string) {
    // Get historical data for forecasting
    const { data } = await this.supabase
      .from('asset_location_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('asset_id', assetId)
      .gte('timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year
      .order('timestamp', { ascending: true })

    return data || []
  }

  private async generateLifecycleForecast(assetId: string, historicalData: Record<string, unknown>[]): Promise<AssetForecast> {
    // Simplified forecasting - in production, would use more sophisticated time series analysis
    const predictions = []
    const confidenceIntervals = []

    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + i)
      
      predictions.push({
        date: futureDate.toISOString(),
        predicted_value: Math.random() * 100,
        metric: 'utilization_percentage',
        unit: 'percent'
      })

      confidenceIntervals.push({
        date: futureDate.toISOString(),
        lower_bound: Math.random() * 50,
        upper_bound: Math.random() * 50 + 50,
        confidence_level: 0.95
      })
    }

    return {
      asset_id: assetId,
      forecast_type: 'lifecycle',
      time_horizon_months: 12,
      predictions,
      confidence_intervals: confidenceIntervals,
      assumptions: [
        'Current usage patterns continue',
        'No major environmental changes',
        'Regular maintenance schedule maintained'
      ],
      created_at: new Date().toISOString()
    }
  }

  private async storeForecast(tenantId: string, forecast: AssetForecast): Promise<void> {
    // Store forecast (would need table creation)
    console.log('Storing forecast:', forecast)
  }

  private async getRecentPredictions(tenantId: string, type: string): Promise<MaintenancePrediction[]> {
    // Get recent predictions from database
    return []
  }

  private async getRecentAnalyses(tenantId: string, type: string): Promise<UtilizationAnalysis[]> {
    // Get recent analyses from database
    return []
  }

  private async getRecentAnomalies(tenantId: string): Promise<AnomalyDetection[]> {
    // Get recent anomalies from database
    return []
  }

  private async storeInsight(tenantId: string, insight: MLInsight): Promise<void> {
    // Store insight (would need table creation)
    console.log('Storing insight:', insight)
  }

  private async storeBatchJob(tenantId: string, job: BatchPredictionJob): Promise<void> {
    // Store batch job (would need table creation)
    console.log('Storing batch job:', job)
  }

  private async processBatchJob(job: BatchPredictionJob, assetIds: string[]): Promise<void> {
    // Process batch job asynchronously
    job.status = 'running'
    job.started_at = new Date().toISOString()

    try {
      for (let i = 0; i < assetIds.length; i++) {
        const assetId = assetIds[i]
        
        // Process based on job type
        switch (job.job_type) {
          case 'maintenance_predictions':
            await this.predictMaintenance(job.tenant_id, [assetId])
            break
          case 'utilization_analysis':
            await this.analyzeUtilization(job.tenant_id, [assetId])
            break
          case 'anomaly_detection':
            await this.detectAnomalies(job.tenant_id, [assetId])
            break
        }

        job.processed_assets = i + 1
        job.progress = (i + 1) / assetIds.length * 100
      }

      job.status = 'completed'
      job.completed_at = new Date().toISOString()

    } catch (_error) {
      job.status = 'failed'
      job.error_message = error instanceof Error ? error.message : 'Unknown error'
      job.completed_at = new Date().toISOString()
    }
  }
}