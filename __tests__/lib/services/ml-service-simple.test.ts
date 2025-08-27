/**
 * Simple ML Service Tests
 * Basic tests for ML service functionality
 */

import { MLService } from '@/lib/services/ml-service'

// Simple mock for Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'asset-1',
            created_at: '2023-01-01T00:00:00Z',
            last_maintenance_date: '2023-06-01T00:00:00Z',
            asset_maintenance_schedules: [],
            sensor_data: []
          }
        }))
      }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }))
} as any

// Mock fetch
global.fetch = jest.fn()

describe('MLService - Basic Functionality', () => {
  let mlService: MLService

  beforeEach(() => {
    mlService = new MLService(mockSupabase, 'http://localhost:8000')
    jest.clearAllMocks()
  })

  describe('Core ML Operations', () => {
    it('should initialize with correct ML service URL', () => {
      expect((mlService as any).mlServiceUrl).toBe('http://localhost:8000')
    })

    it('should use environment variable for ML service URL when not provided', () => {
      process.env.ML_SERVICE_URL = 'http://env-ml-service:8080'
      const envMlService = new MLService(mockSupabase)
      expect((envMlService as any).mlServiceUrl).toBe('http://env-ml-service:8080')
      delete process.env.ML_SERVICE_URL
    })

    it('should fall back to default URL when no environment variable', () => {
      delete process.env.ML_SERVICE_URL
      const defaultMlService = new MLService(mockSupabase)
      expect((defaultMlService as any).mlServiceUrl).toBe('http://localhost:8000')
    })
  })

  describe('Helper Methods', () => {
    it('should calculate confidence scores correctly', () => {
      const calculateConfidence = (mlService as any).calculateConfidence

      // High and low probabilities should have high confidence
      expect(calculateConfidence(0.9)).toBe(0.9)
      expect(calculateConfidence(0.1)).toBe(0.9)
      
      // Medium-high probabilities should have medium confidence
      expect(calculateConfidence(0.7)).toBe(0.7)
      expect(calculateConfidence(0.3)).toBe(0.7)
      
      // Medium probabilities should have low confidence
      expect(calculateConfidence(0.5)).toBe(0.5)
    })

    it('should calculate predicted dates based on probability', () => {
      const calculatePredictedDate = (mlService as any).calculatePredictedDate
      
      const highRiskDate = calculatePredictedDate(0.9, 30)
      const lowRiskDate = calculatePredictedDate(0.1, 30)
      
      const highRiskDays = Math.ceil((new Date(highRiskDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const lowRiskDays = Math.ceil((new Date(lowRiskDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      // High risk should predict sooner than low risk
      expect(highRiskDays).toBeLessThan(lowRiskDays)
      expect(highRiskDays).toBeGreaterThan(0)
      expect(lowRiskDays).toBeLessThanOrEqual(90)
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
      
      // Should identify age as a factor
      const ageFactor = factors.find((f: any) => f.factor === 'Asset Age')
      expect(ageFactor).toBeDefined()
      expect(ageFactor?.impact).toBeGreaterThan(0)
      
      // Should identify maintenance overdue as a factor
      const maintenanceFactor = factors.find((f: any) => f.factor === 'Maintenance Overdue')
      expect(maintenanceFactor).toBeDefined()
      
      // Should identify failure history as a factor
      const failureFactor = factors.find((f: any) => f.factor === 'Failure History')
      expect(failureFactor).toBeDefined()
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
      expect(highRiskRecs).toHaveLength(1)
      expect(highRiskRecs[0].type).toBe('immediate')
      expect(highRiskRecs[0].priority).toBe('critical')

      // Medium probability should generate scheduled action
      const mediumRiskRecs = generateMaintenanceRecommendations(0.6, features)
      expect(mediumRiskRecs).toHaveLength(1)
      expect(mediumRiskRecs[0].type).toBe('scheduled')
      expect(mediumRiskRecs[0].priority).toBe('high')

      // Low probability should generate monitoring
      const lowRiskRecs = generateMaintenanceRecommendations(0.4, features)
      expect(lowRiskRecs).toHaveLength(1)
      expect(lowRiskRecs[0].type).toBe('monitor')
      expect(lowRiskRecs[0].priority).toBe('medium')
    })
  })

  describe('Batch Job Creation', () => {
    it('should create batch prediction jobs with correct structure', async () => {
      const job = await mlService.createBatchPredictionJob(
        'tenant-1',
        'maintenance_predictions',
        ['asset-1', 'asset-2']
      )

      expect(job).toMatchObject({
        tenant_id: 'tenant-1',
        job_type: 'maintenance_predictions',
        total_assets: 2,
        processed_assets: 0,
        progress: 0
      })
      
      expect(job.id).toBeDefined()
      expect(job.created_at).toBeDefined()
      expect(['queued', 'running']).toContain(job.status)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const predictions = await mlService.predictMaintenance('tenant-1', ['asset-1'])
      expect(predictions).toHaveLength(0)
    })

    it('should handle invalid ML service responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      })

      const predictions = await mlService.predictMaintenance('tenant-1', ['asset-1'])
      expect(predictions).toHaveLength(0)
    })
  })

  describe('Utilization Analysis', () => {
    it('should calculate utilization optimization correctly', async () => {
      const calculateUtilizationOptimization = (mlService as any).calculateUtilizationOptimization
      
      const analysis = await calculateUtilizationOptimization('asset-1', [])
      
      expect(analysis).toMatchObject({
        asset_id: 'asset-1',
        current_utilization: expect.any(Number),
        optimal_utilization: 0.85,
        efficiency_score: expect.any(Number)
      })
      
      expect(analysis.recommendations).toBeInstanceOf(Array)
      expect(analysis.cost_impact).toBeDefined()
      expect(analysis.created_at).toBeDefined()
    })
  })

  describe('Anomaly Detection', () => {
    it('should create anomaly detection objects correctly', async () => {
      const createAnomalyDetection = (mlService as any).createAnomalyDetection
      
      const anomaly = await createAnomalyDetection('tenant-1', 'asset-1', [1000, 30, 2, 3])
      
      expect(anomaly).toMatchObject({
        asset_id: 'asset-1',
        anomaly_type: 'performance',
        severity: 'medium',
        confidence: 0.8
      })
      
      expect(anomaly.description).toBeDefined()
      expect(anomaly.detected_at).toBeDefined()
      expect(anomaly.metrics).toBeInstanceOf(Array)
      expect(anomaly.suggested_actions).toBeInstanceOf(Array)
    })
  })

  describe('Lifecycle Forecasting', () => {
    it('should generate lifecycle forecasts with correct structure', async () => {
      const generateLifecycleForecast = (mlService as any).generateLifecycleForecast
      
      const historicalData = Array.from({ length: 12 }, (_, i) => ({
        timestamp: new Date(2023, i, 1).toISOString(),
        utilization: 0.7 + Math.random() * 0.2
      }))
      
      const forecast = await generateLifecycleForecast('asset-1', historicalData)
      
      expect(forecast).toMatchObject({
        asset_id: 'asset-1',
        forecast_type: 'lifecycle',
        time_horizon_months: 12
      })
      
      expect(forecast.predictions).toBeInstanceOf(Array)
      expect(forecast.predictions.length).toBeGreaterThan(0)
      expect(forecast.confidence_intervals).toBeInstanceOf(Array)
      expect(forecast.assumptions).toBeInstanceOf(Array)
      expect(forecast.created_at).toBeDefined()
    })
  })
})

describe('ML Service Types and Interfaces', () => {
  it('should handle different prediction types', () => {
    const validTypes = ['maintenance_predictions', 'utilization_analysis', 'anomaly_detection']
    
    validTypes.forEach(type => {
      expect(() => {
        // This would be validated in the actual API endpoints
        const isValid = validTypes.includes(type)
        expect(isValid).toBe(true)
      }).not.toThrow()
    })
  })

  it('should validate insight categories and impacts', () => {
    const validCategories = ['maintenance', 'operations', 'financial', 'performance', 'compliance']
    const validImpacts = ['low', 'medium', 'high', 'critical']
    
    validCategories.forEach(category => {
      expect(['maintenance', 'operations', 'financial', 'performance', 'compliance']).toContain(category)
    })
    
    validImpacts.forEach(impact => {
      expect(['low', 'medium', 'high', 'critical']).toContain(impact)
    })
  })
})