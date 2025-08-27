'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { BudgetVarianceAnalysisRequest, BudgetVariance, Budget } from '@/lib/types/financial';

export function BudgetVarianceAnalyzer() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [formData, setFormData] = useState<Partial<BudgetVarianceAnalysisRequest>>({
    budgetId: '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    periodEnd: new Date() // Today
  });
  const [results, setResults] = useState<BudgetVariance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    }
  };

  const handleInputChange = (field: keyof BudgetVarianceAnalysisRequest, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const analyzeBudgetVariance = async () => {
    if (!formData.budgetId || !formData.periodStart || !formData.periodEnd) {
      setError('Please select a budget and analysis period');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: BudgetVarianceAnalysisRequest = {
        budgetId: formData.budgetId,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        lineItemId: formData.lineItemId
      };

      const response = await fetch('/api/financial/budget/variance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze budget variance');
      }

      const varianceResults = await response.json();
      setResults(varianceResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze budget variance');
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

  const getVarianceColor = (varianceType: string) => {
    switch (varianceType) {
      case 'favorable':
        return 'text-green-600 bg-green-50';
      case 'unfavorable':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getVarianceIcon = (varianceType: string) => {
    switch (varianceType) {
      case 'favorable':
        return <TrendingDown className="h-4 w-4" />;
      case 'unfavorable':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const selectedBudget = budgets.find(b => b.id === formData.budgetId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Budget Variance Analyzer
        </CardTitle>
        <CardDescription>
          Analyze budget performance and identify variances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="budget-select">Budget *</Label>
            <Select
              value={formData.budgetId}
              onValueChange={(value) => handleInputChange('budgetId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a budget" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.name} ({budget.budgetYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line-item">Line Item (Optional)</Label>
            <Input
              id="line-item"
              placeholder="Specific line item ID"
              value={formData.lineItemId || ''}
              onChange={(e) => handleInputChange('lineItemId', e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-start">Analysis Period Start *</Label>
            <Input
              id="period-start"
              type="date"
              value={formData.periodStart?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('periodStart', new Date(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-end">Analysis Period End *</Label>
            <Input
              id="period-end"
              type="date"
              value={formData.periodEnd?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('periodEnd', new Date(e.target.value))}
            />
          </div>
        </div>

        {selectedBudget && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Selected Budget Overview</h4>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total Budget:</span>
                <span className="ml-2 font-medium">{formatCurrency(selectedBudget.totalBudget)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Spent:</span>
                <span className="ml-2 font-medium">{formatCurrency(selectedBudget.spentAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(selectedBudget.totalBudget - selectedBudget.spentAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={analyzeBudgetVariance} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Analyzing...' : 'Analyze Budget Variance'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Calculator className="h-5 w-5" />
              Variance Analysis Results
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Variances</p>
                <p className="text-2xl font-bold">{results.length}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Favorable Variances</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.varianceType === 'favorable').length}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Unfavorable Variances</p>
                <p className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.varianceType === 'unfavorable').length}
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h4 className="font-semibold">Detailed Variance Analysis</h4>
              {results.map((variance, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getVarianceColor(variance.varianceType)}
                      >
                        {getVarianceIcon(variance.varianceType)}
                        <span className="ml-1 capitalize">{variance.varianceType}</span>
                      </Badge>
                      {variance.budgetLineItemId && (
                        <span className="text-sm text-muted-foreground">
                          Line Item: {variance.budgetLineItemId}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formData.periodStart?.toLocaleDateString()} - {formData.periodEnd?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budgeted Amount</p>
                      <p className="font-semibold">{formatCurrency(variance.budgetedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Amount</p>
                      <p className="font-semibold">{formatCurrency(variance.actualAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variance Amount</p>
                      <p className={`font-semibold ${
                        variance.varianceAmount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {variance.varianceAmount > 0 ? '+' : ''}{formatCurrency(variance.varianceAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variance %</p>
                      <p className={`font-semibold ${
                        variance.variancePercentage > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {variance.variancePercentage > 0 ? '+' : ''}{formatPercentage(variance.variancePercentage)}
                      </p>
                    </div>
                  </div>

                  {(variance.varianceReason || variance.correctiveAction) && (
                    <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                      {variance.varianceReason && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Variance Reason</p>
                          <p className="text-sm">{variance.varianceReason}</p>
                        </div>
                      )}
                      {variance.correctiveAction && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Corrective Action</p>
                          <p className="text-sm">{variance.correctiveAction}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary Analysis */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-sm mb-2">Analysis Summary</h5>
              <div className="text-sm text-muted-foreground space-y-1">
                {results.filter(r => r.varianceType === 'unfavorable').length > 0 && (
                  <p className="text-red-600">
                    • {results.filter(r => r.varianceType === 'unfavorable').length} unfavorable variance(s) require attention
                  </p>
                )}
                {results.filter(r => r.varianceType === 'favorable').length > 0 && (
                  <p className="text-green-600">
                    • {results.filter(r => r.varianceType === 'favorable').length} favorable variance(s) indicate cost savings
                  </p>
                )}
                {results.filter(r => Math.abs(r.variancePercentage) > 10).length > 0 && (
                  <p className="text-amber-600">
                    • {results.filter(r => Math.abs(r.variancePercentage) > 10).length} variance(s) exceed 10% threshold
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}