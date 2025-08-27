'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingDown, 
  Wrench, 
  PieChart, 
  TrendingUp,
  AlertTriangle,
  Calculator,
  BarChart3
} from 'lucide-react';
import { FinancialDashboardData, CostAnalysisResult, DepreciationSummary } from '@/lib/types/financial';
import { DepreciationCalculator } from './depreciation-calculator';
import { TCOCalculator } from './tco-calculator';
import { ROICalculator } from './roi-calculator';
import { BudgetVarianceAnalyzer } from './budget-variance-analyzer';
import { CostAnalysisChart } from './cost-analysis-chart';
import { DepreciationChart } from './depreciation-chart';

interface FinancialDashboardProps {
  className?: string;
}

export function FinancialDashboard({ className }: FinancialDashboardProps) {
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData | null>(null);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysisResult | null>(null);
  const [depreciationSummary, setDepreciationSummary] = useState<DepreciationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchCostAnalysis();
    fetchDepreciationSummary();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/financial/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    }
  };

  const fetchCostAnalysis = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12); // Last 12 months

      const response = await fetch('/api/financial/costs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch cost analysis');
      const data = await response.json();
      setCostAnalysis(data);
    } catch (err) {
      console.error('Error fetching cost analysis:', err);
    }
  };

  const fetchDepreciationSummary = async () => {
    try {
      const response = await fetch('/api/financial/depreciation/summary');
      if (!response.ok) throw new Error('Failed to fetch depreciation summary');
      const data = await response.json();
      setDepreciationSummary(data);
    } catch (err) {
      console.error('Error fetching depreciation summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData?.totalAssetValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current book value of all assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Depreciation</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData?.totalDepreciation || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Accumulated depreciation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData?.totalMaintenanceCosts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total maintenance spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(dashboardData?.averageROI || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Budget Utilization
          </CardTitle>
          <CardDescription>
            Current budget spending across all active budgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Utilization</span>
              <span>{formatPercentage(dashboardData?.budgetUtilization || 0)}</span>
            </div>
            <Progress value={dashboardData?.budgetUtilization || 0} className="h-2" />
            {(dashboardData?.budgetUtilization || 0) > 90 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Budget utilization is high
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Cost Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Cost Categories</CardTitle>
          <CardDescription>
            Breakdown of spending by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.topCostCategories.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    {category.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatPercentage(category.percentage)}
                  </span>
                </div>
                <span className="font-medium">
                  {formatCurrency(category.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Analysis Tools */}
      <Tabs defaultValue="calculators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculators" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculators
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculators" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DepreciationCalculator />
            <TCOCalculator />
            <ROICalculator />
            <BudgetVarianceAnalyzer />
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {costAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown of costs over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">Total Costs</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(costAnalysis.totalCosts)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Top Asset</p>
                    <p className="text-lg font-semibold">
                      {costAnalysis.topAssetsByCost[0]?.assetName || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(costAnalysis.topAssetsByCost[0]?.totalCost || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monthly Average</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(costAnalysis.totalCosts / 12)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {depreciationSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Depreciation Summary</CardTitle>
                <CardDescription>
                  Overview of asset depreciation across all methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">Original Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(depreciationSummary.totalOriginalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(depreciationSummary.totalCurrentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Depreciation Rate</p>
                    <p className="text-lg font-semibold">
                      {formatPercentage(
                        ((depreciationSummary.totalOriginalValue - depreciationSummary.totalCurrentValue) / 
                         depreciationSummary.totalOriginalValue) * 100
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {costAnalysis && <CostAnalysisChart data={costAnalysis} />}
          {depreciationSummary && <DepreciationChart data={depreciationSummary} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}