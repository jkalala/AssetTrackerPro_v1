/**
 * Machine Learning and Predictive Analytics Types
 * Types for ML models, predictions, and analytics
 */

// =====================================================
// PREDICTIVE MAINTENANCE TYPES
// =====================================================

export interface MaintenancePrediction {
  asset_id: string
  prediction_type: 'failure_risk' | 'maintenance_due' | 'replacement_needed'
  probability: number
  confidence: number
  predicted_date?: string
  factors: PredictionFactor[]
  recommendations: MaintenanceRecommendation[]
  created_at: string
}

export interface PredictionFactor {
  factor: string
  impact: number
  description: string
}

export interface MaintenanceRecommendation {
  type: 'immediate' | 'scheduled' | 'monitor'
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string
  estimated_cost?: number
  estimated_downtime?: number
}

export interface AssetFeatures {
  asset_id: string
  usage_hours: number
  last_maintenance_days: number
  failure_count: number
  age_years: number
  temperature_avg?: number
  vibration_avg?: number
  pressure_avg?: number
  custom_metrics?: Record<string, number>
}

// =====================================================
// UTILIZATION OPTIMIZATION TYPES
// =====================================================

export interface UtilizationAnalysis {
  asset_id: string
  current_utilization: number
  optimal_utilization: number
  efficiency_score: number
  recommendations: UtilizationRecommendation[]
  cost_impact: CostImpact
  created_at: string
}

export interface UtilizationRecommendation {
  type: 'relocate' | 'redistribute' | 'schedule_change' | 'capacity_adjustment'
  description: string
  expected_improvement: number
  implementation_effort: 'low' | 'medium' | 'high'
  estimated_savings: number
}

export interface CostImpact {
  current_cost_per_hour: number
  optimized_cost_per_hour: number
  annual_savings: number
  payback_period_months?: number
}

// =====================================================
// ANOMALY DETECTION TYPES
// =====================================================

export interface AnomalyDetection {
  asset_id: string
  anomaly_type: 'performance' | 'usage' | 'sensor' | 'behavioral'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  detected_at: string
  metrics: AnomalyMetric[]
  suggested_actions: string[]
}

export interface AnomalyMetric {
  metric_name: string
  current_value: number
  expected_value: number
  deviation_percentage: number
  threshold_exceeded: boolean
}

// =====================================================
// FORECASTING TYPES
// =====================================================

export interface AssetForecast {
  asset_id: string
  forecast_type: 'lifecycle' | 'replacement' | 'maintenance_cost' | 'utilization'
  time_horizon_months: number
  predictions: ForecastPoint[]
  confidence_intervals: ConfidenceInterval[]
  assumptions: string[]
  created_at: string
}

export interface ForecastPoint {
  date: string
  predicted_value: number
  metric: string
  unit: string
}

export interface ConfidenceInterval {
  date: string
  lower_bound: number
  upper_bound: number
  confidence_level: number
}

// =====================================================
// ML MODEL TYPES
// =====================================================

export interface MLModel {
  id: string
  tenant_id: string
  name: string
  type: ModelType
  version: string
  status: ModelStatus
  accuracy: number
  training_data_size: number
  features: string[]
  hyperparameters: Record<string, any>
  created_at: string
  last_trained_at: string
  last_used_at?: string
}

export type ModelType = 
  | 'predictive_maintenance'
  | 'utilization_optimization'
  | 'anomaly_detection'
  | 'lifecycle_forecasting'
  | 'cost_prediction'

export type ModelStatus = 
  | 'training'
  | 'ready'
  | 'error'
  | 'deprecated'

export interface ModelTrainingRequest {
  tenant_id: string
  model_type: ModelType
  training_config: TrainingConfig
  data_filters?: Record<string, any>
}

export interface TrainingConfig {
  algorithm: string
  hyperparameters: Record<string, any>
  validation_split: number
  cross_validation_folds?: number
  feature_selection?: string[]
}

export interface ModelPerformance {
  model_id: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  confusion_matrix?: number[][]
  feature_importance?: FeatureImportance[]
  validation_date: string
}

export interface FeatureImportance {
  feature: string
  importance: number
  rank: number
}

// =====================================================
// PREDICTION REQUEST/RESPONSE TYPES
// =====================================================

export interface PredictionRequest {
  model_type: ModelType
  asset_ids: string[]
  features?: Record<string, any>
  options?: PredictionOptions
}

export interface PredictionOptions {
  include_confidence: boolean
  include_factors: boolean
  include_recommendations: boolean
  time_horizon_days?: number
}

export interface PredictionResponse {
  predictions: Prediction[]
  model_info: {
    model_id: string
    version: string
    accuracy: number
  }
  processing_time_ms: number
  created_at: string
}

export interface Prediction {
  asset_id: string
  prediction_type: string
  value: number | string | boolean
  confidence: number
  factors?: PredictionFactor[]
  recommendations?: string[]
  metadata?: Record<string, any>
}

// =====================================================
// ANALYTICS INSIGHTS TYPES
// =====================================================

export interface MLInsight {
  id: string
  tenant_id: string
  type: InsightType
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  category: InsightCategory
  data: Record<string, any>
  actions: InsightAction[]
  created_at: string
  expires_at?: string
}

export type InsightType = 
  | 'maintenance_alert'
  | 'utilization_opportunity'
  | 'cost_optimization'
  | 'performance_degradation'
  | 'lifecycle_milestone'

export type InsightCategory = 
  | 'maintenance'
  | 'operations'
  | 'financial'
  | 'performance'
  | 'compliance'

export interface InsightAction {
  type: 'schedule_maintenance' | 'relocate_asset' | 'update_schedule' | 'investigate'
  description: string
  estimated_impact: string
  priority: number
}

// =====================================================
// BATCH PROCESSING TYPES
// =====================================================

export interface BatchPredictionJob {
  id: string
  tenant_id: string
  job_type: 'maintenance_predictions' | 'utilization_analysis' | 'anomaly_detection'
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  total_assets: number
  processed_assets: number
  results_summary?: BatchJobSummary
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface BatchJobSummary {
  total_predictions: number
  high_risk_assets: number
  recommendations_generated: number
  anomalies_detected: number
  cost_savings_identified: number
}