'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react'
import { MLInsight, MaintenancePrediction, BatchPredictionJob } from '@/lib/types/ml'

interface MLDashboardProps {
  tenantId: string
}

export function MLDashboard({ tenantId }: MLDashboardProps) {
  const [insights, setInsights] = useState<MLInsight[]>([])
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([])
  const [batchJobs, setBatchJobs] = useState<BatchPredictionJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadMLData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load insights
      const insightsResponse = await fetch(`/api/ml/insights?tenant_id=${tenantId}`)
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData.insights || [])
      }

      // Load recent predictions
      const predictionsResponse = await fetch(`/api/ml/predictions?tenant_id=${tenantId}&prediction_type=maintenance&limit=10`)
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json()
        setPredictions(predictionsData.predictions || [])
      }

      // Load batch jobs
      const batchResponse = await fetch(`/api/ml/batch?tenant_id=${tenantId}`)
      if (batchResponse.ok) {
        const batchData = await batchResponse.json()
        setBatchJobs(batchData.jobs || [])
      }

    } catch (err) {
      setError('Failed to load ML data')
      console.error('ML dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadMLData()
  }, [loadMLData])

  const generateInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ml/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      })

      if (response.ok) {
        await loadMLData()
      } else {
        setError('Failed to generate insights')
      }
    } catch (err) {
      setError('Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  const runBatchPrediction = async (jobType: string) => {
    try {
      const response = await fetch('/api/ml/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          job_type: jobType
        })
      })

      if (response.ok) {
        await loadMLData()
      } else {
        setError(`Failed to start ${jobType} job`)
      }
    } catch (err) {
      setError(`Failed to start ${jobType} job`)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'maintenance_alert': return <AlertTriangle className="h-4 w-4" />
      case 'utilization_opportunity': return <Target className="h-4 w-4" />
      case 'cost_optimization': return <DollarSign className="h-4 w-4" />
      case 'performance_degradation': return <TrendingUp className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  if (loading && insights.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading ML analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML & Predictive Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights for asset management optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateInsights} disabled={loading}>
            <Brain className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
          <Button onClick={loadMLData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              {insights.filter(i => i.impact === 'critical' || i.impact === 'high').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Predictions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions.length}</div>
            <p className="text-xs text-muted-foreground">
              {predictions.filter(p => p.probability > 0.7).length} high risk assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {batchJobs.filter(j => j.status === 'running').length} currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="batch">Batch Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Insights</CardTitle>
                <CardDescription>Latest AI-generated recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.slice(0, 5).map((insight) => (
                    <div key={insight.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{insight.title}</p>
                          <Badge variant={getImpactColor(insight.impact) as any}>
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No insights available. Click "Generate Insights" to analyze your assets.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Batch Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Operations</CardTitle>
                <CardDescription>Run ML analysis on multiple assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => runBatchPrediction('maintenance_predictions')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Run Maintenance Predictions
                  </Button>
                  <Button
                    onClick={() => runBatchPrediction('utilization_analysis')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Analyze Utilization
                  </Button>
                  <Button
                    onClick={() => runBatchPrediction('anomaly_detection')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Detect Anomalies
                  </Button>
                </div>

                {/* Recent Jobs */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Recent Jobs</h4>
                  <div className="space-y-2">
                    {batchJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{job.job_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.processed_assets}/{job.total_assets} assets
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                          {job.status === 'running' && (
                            <Progress value={job.progress} className="w-16 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getImpactColor(insight.impact) as any}>
                        {insight.impact}
                      </Badge>
                      <Badge variant="outline">{insight.category}</Badge>
                    </div>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {insight.actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                      <ul className="space-y-1">
                        {insight.actions.map((action, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {action.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {insights.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No insights available</p>
                  <Button onClick={generateInsights} className="mt-4">
                    Generate Insights
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {predictions.map((prediction) => (
              <Card key={`${prediction.asset_id}-${prediction.created_at}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Asset {prediction.asset_id}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={prediction.probability > 0.7 ? 'destructive' : 'default'}>
                        {Math.round(prediction.probability * 100)}% risk
                      </Badge>
                      <Badge variant="outline">{prediction.prediction_type}</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Confidence: {Math.round(prediction.confidence * 100)}%
                    {prediction.predicted_date && (
                      <span className="ml-2">
                        • Predicted: {new Date(prediction.predicted_date).toLocaleDateString()}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prediction.factors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
                      <div className="space-y-1">
                        {prediction.factors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{factor.factor}</span>
                            <div className="flex items-center">
                              <Progress value={factor.impact * 100} className="w-16 mr-2" />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(factor.impact * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                      <div className="space-y-2">
                        {prediction.recommendations.map((rec, index) => (
                          <div key={index} className="p-2 border rounded text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{rec.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {rec.priority}
                              </Badge>
                            </div>
                            {rec.estimated_cost && (
                              <p className="text-xs text-muted-foreground">
                                Est. cost: ${rec.estimated_cost} • Downtime: {rec.estimated_downtime}h
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {predictions.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No predictions available</p>
                  <Button onClick={() => runBatchPrediction('maintenance_predictions')} className="mt-4">
                    Run Maintenance Predictions
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="grid gap-4">
            {batchJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                    <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created: {new Date(job.created_at).toLocaleString()}
                    {job.completed_at && (
                      <span className="ml-2">
                        • Completed: {new Date(job.completed_at).toLocaleString()}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {job.processed_assets}/{job.total_assets} assets
                      </span>
                    </div>
                    <Progress value={job.progress} />

                    {job.error_message && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{job.error_message}</AlertDescription>
                      </Alert>
                    )}

                    {job.results_summary && Object.keys(job.results_summary).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Results Summary:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(job.results_summary).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">
                                {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                              </span>
                              <span>{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {batchJobs.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No batch jobs found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start a batch operation from the Overview tab
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}