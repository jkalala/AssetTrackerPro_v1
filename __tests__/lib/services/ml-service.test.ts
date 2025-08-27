/**
 * ML Service Tests
 * Tests for machine learning and predictive analytics functionality
 */

import { MLService } from '@/lib/services/ml-service'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'asset-1',
            created_at: '2023-01-01T00:00:00Z',
            last_maintenance_date: '2023-06-01T00:00:00Z'
          }
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: []
          }))
        }))
      }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }))
} as any

// Mock fetch for ML service calls
global.fetch = jest.fn()

describe('MLService', () => {
  let mlService: MLService

  beforeEach(() => {
    mlService = new MLService(mockSupabase, 'http://localhost:8000')
    jest.clearAllMocks()
  })

  describe('predictMaintenance', () => {
    it('should generate maintenance predictions for assets', async () => {
      // Mock ML service response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          will_fail_soon: true,
          probability: 0.85
        })
      })

      const predictions = await mlService.predictMaintenance('tenant-1', ['asset-1'])

      expect(predictions).toHaveLength(1)
      expect(predictions[0]).toMatchObject({
        asset_id: 'asset-1',
        prediction_type: 'failure_risk',
        probability: 0.85
      })
      expect(predictions[0].confidence).toBeGreaterThan(0)
      expect(predictions[0].factors).toBeDefined()
      expect(predictions[0].recommendations).toBeDefined()
    })

    it('should handle ML service errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ML service unavailable'))

      const predictions = await mlService.predictMaintenance('tenant-1', ['asset-1'])

      expect(predictions).toHaveLength(0)
    })
  })

  describe('analyzeUtilization', () => {
    it('should generate utilization analysis for assets', async () => {
      // Mock utilization data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [
                  { timestamp: '2023-01-01T00:00:00Z', location: 'Location A' },
                  { timestamp: '2023-01-02T00:00:00Z', location: 'Location B' }
                ]
              }))
            }))
          }))
        }))
      })

      const analyses = await mlService.analyzeUtilization('tenant-1', ['asset-1'])

      expect(analyses).toHaveLength(1)
      expect(analyses[0]).toMatchObject({
        asset_id: 'asset-1',
        current_utilization: expect.any(Number),
        optimal_utilization: 0.85,
        efficiency_score: expect.any(Number)
      })
      expect(analyses[0].recommendations).toBeDefined()
      expect(analyses[0].cost_impact).toBeDefined()
    })
  })

  describe('detectAnomalies', () => {
    it('should detect anomalies in asset behavior', async () => {
      // Mock ML service response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          anomalies: [-1, 1, -1] // -1 indicates anomaly
        })
      })

      const anomalies = await mlService.detectAnomalies('tenant-1', ['asset-1', 'asset-2', 'asset-3'])

      expect(anomalies).toHaveLength(2) // Two anomalies detected
      expect(anomalies[0]).toMatchObject({
        asset_id: expect.any(String),
        anomaly_type: 'performance',
        severity: 'medium',
        confidence: 0.8
      })
      expect(anomalies[0].metrics).toBeDefined()
      expect(anomalies[0].suggested_actions).toBeDefined()
    })
  })

  describe('forecastAssetLifecycle', () => {
    it('should generate lifecycle forecasts for assets', async () => {
      // Mock historical data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: Array.from({ length: 15 }, (_, i) => ({
                  timestamp: new Date(2023, i, 1).toISOString(),
                  utilization: 0.7 + Math.random() * 0.2
                }))
              }))
            }))
          }))
        }))
      })

      const forecasts = await mlService.forecastAssetLifecycle('tenant-1', ['asset-1'])

      expect(forecasts).toHaveLength(1)
      expect(forecasts[0]).toMatchObject({
        asset_id: 'asset-1',
        forecast_type: 'lifecycle',
        time_horizon_months: 12
      })
      expect(forecasts[0].predictions).toBeDefined()
      expect(forecasts[0].confidence_intervals).toBeDefined()
      expect(forecasts[0].assumptions).toBeDefined()
    })

    it('should skip assets with insufficient historical data', async () => {
      // Mock insufficient historical data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [
                  { timestamp: '2023-01-01T00:00:00Z', utilization: 0.7 }
                ] // Only 1 month of data
              }))
            }))
          }))
        }))
      })

      const forecasts = await mlService.forecastAssetLifecycle('tenant-1', ['asset-1'])

      expect(forecasts).toHaveLength(0)
    })
  })

  describe('generateInsights', () => {
    it('should generate ML insights from predictions and analyses', async () => {
      // Mock recent predictions and analyses
      const mockPredictions = [
        {
          asset_id: 'asset-1',
          probability: 0.85,
          recommendations: [
            { action: 'Schedule maintenance', priority: 'high', estimated_cost: 500 }
          ]
        }
      ]

      const mockAnalyses = [
        {
          asset_id: 'asset-2',
          current_utilization: 0.5,
          optimal_utilization: 0.85,
          recommendations: [
            { description: 'Relocate asset', estimated_savings: 1200, implementation_effort: 'medium' }
          ]
        }
      ]

      // Mock the private methods that would return this data
      jest.spyOn(mlService as any, 'getRecentPredictions').mockResolvedValue(mockPredictions)
      jest.spyOn(mlService as any, 'getRecentAnalyses').mockResolvedValue(mockAnalyses)
      jest.spyOn(mlService as any, 'getRecentAnomalies').mockResolvedValue([])

      const insights = await mlService.generateInsights('tenant-1')

      expect(insights).toHaveLength(2)
      expect(insights[0]).toMatchObject({
        type: 'maintenance_alert',
        title: 'High Maintenance Risk Detected',
        impact: 'high',
        category: 'maintenance'
      })
      expect(insights[1]).toMatchObject({
        type: 'utilization_opportunity',
        title: 'Underutilized Asset Identified',
        impact: 'medium',
        category: 'operations'
      })
    })
  })

  describe('createBatchPredictionJob', () => {
    it('should create and process batch prediction jobs', async () => {
      const job = await mlService.createBatchPredictionJob(
        'tenant-1',
        'maintenance_predictions',
        ['asset-1', 'asset-2']
      )

      expect(job).toMatchObject({
        tenant_id: 'tenant-1',
        job_type: 'maintenance_predictions',
        status: 'queued',
        total_assets: 2,
        processed_assets: 0,
        progress: 0
      })
      expect(job.id).toBeDefined()
      expect(job.created_at).toBeDefined()
    })

    it('should get all assets if none specified', async () => {
      // Mock assets query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [
                { id: 'asset-1' },
                { id: 'asset-2' },
                { id: 'asset-3' }
              ]
            }))
          }))
        }))
      })

      const job = await mlService.createBatchPredictionJob(
        'tenant-1',
        'utilization_analysis'
      )

      expect(job.total_assets).toBe(3)
    })
  })

  describe('private helper methods', () => {
    it('should calculate confidence scores correctly', () => {
      const calculateConfidence = (mlService as any).calculateConfidence

      expect(calculateConfidence(0.9)).toBe(0.9) // High probability = high confidence
      expect(calculateConfidence(0.1)).toBe(0.9) // Low probability = high confidence
      expect(calculateConfidence(0.7)).toBe(0.7) // Medium-high probability = medium confidence
      expect(calculateConfidence(0.5)).toBe(0.5) // Medium probability = low confidence
    })

    it('should calculate predicted dates based on probability', () => {
      const calculatePredictedDate = (mlService as any).calculatePredictedDate
      const result = calculatePredictedDate(0.8, 30)
      
      const predictedDate = new Date(result)
      const now = new Date()
      const daysDiff = Math.ceil((predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBeGreaterThan(0)
      expect(daysDiff).toBeLessThan(90) // Should be within 90 days
    })

    it('should analyze prediction factors correctly', () => {
      const analyzePredictionFactors = (mlService as any).analyzePredictionFactors
      
      const features = {
        asset_id: 'asset-1',
        usage_hours: 10000,
        last_maintenance_days: 200,
        failure_count: 3,
        age_years: 6
      }

      const factors = analyzePredictionFactors(features, 0.8)

      expect(factors).toBeInstanceOf(Array)
      expect(factors.length).toBeGreaterThan(0)
      expect(factors[0]).toHaveProperty('factor')
      expect(factors[0]).toHaveProperty('impact')
      expect(factors[0]).toHaveProperty('description')
    })

    it('should generate appropriate maintenance recommendations', () => {
      const generateMaintenanceRecommendations = (mlService as any).generateMaintenanceRecommendations
      
      const features = {
        asset_id: 'asset-1',
        usage_hours: 8000,
        last_maintenance_days: 100,
        failure_count: 2,
        age_years: 4
      }

      // High probability should generate immediate action
      const highRiskRecs = generateMaintenanceRecommendations(0.9, features)
      expect(highRiskRecs[0].type).toBe('immediate')
      expect(highRiskRecs[0].priority).toBe('critical')

      // Medium probability should generate scheduled action
      const mediumRiskRecs = generateMaintenanceRecommendations(0.6, features)
      expect(mediumRiskRecs[0].type).toBe('scheduled')
      expect(mediumRiskRecs[0].priority).toBe('high')

      // Low probability should generate monitoring
      const lowRiskRecs = generateMaintenanceRecommendations(0.3, features)
      expect(lowRiskRecs[0].type).toBe('monitor')
      expect(lowRiskRecs[0].priority).toBe('medium')
    })
  })
})

describe('MLService Integration', () => {
  it('should handle ML service unavailability gracefully', async () => {
    const mlService = new MLService(mockSupabase, 'http://invalid-url:9999')
    
    const predictions = await mlService.predictMaintenance('tenant-1', ['asset-1'])
    expect(predictions).toHaveLength(0)
    
    const anomalies = await mlService.detectAnomalies('tenant-1', ['asset-1'])
    expect(anomalies).toHaveLength(0)
  })

  it('should use environment variable for ML service URL', () => {
    process.env.ML_SERVICE_URL = 'http://custom-ml-service:8080'
    const mlService = new MLService(mockSupabase)
    
    expect((mlService as any).mlServiceUrl).toBe('http://custom-ml-service:8080')
    
    delete process.env.ML_SERVICE_URL
  })
})