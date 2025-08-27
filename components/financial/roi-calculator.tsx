'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp } from 'lucide-react';
import { ROICalculationRequest, ROIAnalysis } from '@/lib/types/financial';

export function ROICalculator() {
  const [formData, setFormData] = useState<Partial<ROICalculationRequest>>({
    initialInvestment: 0,
    additionalInvestments: 0,
    revenueGenerated: 0,
    costSavings: 0,
    productivityGains: 0,
    utilizationPercentage: 0,
    downtimeHours: 0,
    maintenanceHours: 0
  });
  const [result, setResult] = useState<ROIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof ROICalculationRequest, value: string | number | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateROI = async () => {
    if (!formData.initialInvestment || !formData.analysisPeriodStart || !formData.analysisPeriodEnd) {
      setError('Please fill in initial investment and analysis period');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: ROICalculationRequest = {
        assetId: 'temp-asset-id', // This would be actual asset ID in real usage
        analysisPeriodStart: formData.analysisPeriodStart,
        analysisPeriodEnd: formData.analysisPeriodEnd,
        initialInvestment: formData.initialInvestment,
        additionalInvestments: formData.additionalInvestments,
        revenueGenerated: formData.revenueGenerated,
        costSavings: formData.costSavings,
        productivityGains: formData.productivityGains,
        utilizationPercentage: formData.utilizationPercentage,
        downtimeHours: formData.downtimeHours,
        maintenanceHours: formData.maintenanceHours
      };

      const response = await fetch('/api/financial/roi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate ROI');
      }

      const roiResult = await response.json();
      setResult(roiResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate ROI');
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

  const getROIColor = (roi: number) => {
    if (roi > 20) return 'text-green-600';
    if (roi > 10) return 'text-blue-600';
    if (roi > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Return on Investment (ROI)
        </CardTitle>
        <CardDescription>
          Calculate the return on investment for an asset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Analysis Period */}
          <div className="space-y-2">
            <Label htmlFor="period-start">Analysis Period Start *</Label>
            <Input
              id="period-start"
              type="date"
              value={formData.analysisPeriodStart?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('analysisPeriodStart', new Date(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-end">Analysis Period End *</Label>
            <Input
              id="period-end"
              type="date"
              value={formData.analysisPeriodEnd?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('analysisPeriodEnd', new Date(e.target.value))}
            />
          </div>

          {/* Investment Costs */}
          <div className="space-y-2">
            <Label htmlFor="initial-investment">Initial Investment *</Label>
            <Input
              id="initial-investment"
              type="number"
              placeholder="Enter initial investment"
              value={formData.initialInvestment || ''}
              onChange={(e) => handleInputChange('initialInvestment', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-investments">Additional Investments</Label>
            <Input
              id="additional-investments"
              type="number"
              placeholder="Enter additional investments"
              value={formData.additionalInvestments || ''}
              onChange={(e) => handleInputChange('additionalInvestments', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Returns/Benefits */}
          <div className="space-y-2">
            <Label htmlFor="revenue-generated">Revenue Generated</Label>
            <Input
              id="revenue-generated"
              type="number"
              placeholder="Enter revenue generated"
              value={formData.revenueGenerated || ''}
              onChange={(e) => handleInputChange('revenueGenerated', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost-savings">Cost Savings</Label>
            <Input
              id="cost-savings"
              type="number"
              placeholder="Enter cost savings"
              value={formData.costSavings || ''}
              onChange={(e) => handleInputChange('costSavings', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productivity-gains">Productivity Gains</Label>
            <Input
              id="productivity-gains"
              type="number"
              placeholder="Enter productivity gains"
              value={formData.productivityGains || ''}
              onChange={(e) => handleInputChange('productivityGains', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Utilization Metrics */}
          <div className="space-y-2">
            <Label htmlFor="utilization">Utilization Percentage</Label>
            <Input
              id="utilization"
              type="number"
              placeholder="Enter utilization %"
              min="0"
              max="100"
              value={formData.utilizationPercentage || ''}
              onChange={(e) => handleInputChange('utilizationPercentage', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="downtime">Downtime Hours</Label>
            <Input
              id="downtime"
              type="number"
              placeholder="Enter downtime hours"
              value={formData.downtimeHours || ''}
              onChange={(e) => handleInputChange('downtimeHours', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance">Maintenance Hours</Label>
            <Input
              id="maintenance"
              type="number"
              placeholder="Enter maintenance hours"
              value={formData.maintenanceHours || ''}
              onChange={(e) => handleInputChange('maintenanceHours', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={calculateROI} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Calculating...' : 'Calculate ROI'}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5" />
              ROI Analysis Results
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">ROI Percentage</p>
                <p className={`text-2xl font-bold ${getROIColor(result.roiPercentage)}`}>
                  {formatPercentage(result.roiPercentage)}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Net Return</p>
                <p className={`text-xl font-bold ${result.netReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(result.netReturn)}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Investment</p>
                <p className="text-xl font-bold">{formatCurrency(result.totalInvestment)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-xl font-bold">{formatCurrency(result.totalReturns)}</p>
              </div>
            </div>

            {result.paybackPeriodMonths && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Payback Period</p>
                <p className="text-xl font-bold text-blue-600">
                  {result.paybackPeriodMonths} months
                  {result.paybackPeriodMonths > 12 && (
                    <span className="text-sm font-normal">
                      {' '}({(result.paybackPeriodMonths / 12).toFixed(1)} years)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-semibold">Investment & Returns Breakdown</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Investment Costs</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Initial Investment:</span>
                      <span>{formatCurrency(result.initialInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Investments:</span>
                      <span>{formatCurrency(result.additionalInvestments)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total Investment:</span>
                      <span>{formatCurrency(result.totalInvestment)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Returns & Benefits</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Revenue Generated:</span>
                      <span>{formatCurrency(result.revenueGenerated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Savings:</span>
                      <span>{formatCurrency(result.costSavings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productivity Gains:</span>
                      <span>{formatCurrency(result.productivityGains)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total Returns:</span>
                      <span>{formatCurrency(result.totalReturns)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(result.utilizationPercentage || result.downtimeHours || result.maintenanceHours) && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Utilization Metrics</h5>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    {result.utilizationPercentage && (
                      <div className="text-center p-3 bg-muted rounded">
                        <p className="text-muted-foreground">Utilization</p>
                        <p className="font-semibold">{formatPercentage(result.utilizationPercentage)}</p>
                      </div>
                    )}
                    {result.downtimeHours > 0 && (
                      <div className="text-center p-3 bg-muted rounded">
                        <p className="text-muted-foreground">Downtime</p>
                        <p className="font-semibold">{result.downtimeHours} hours</p>
                      </div>
                    )}
                    {result.maintenanceHours > 0 && (
                      <div className="text-center p-3 bg-muted rounded">
                        <p className="text-muted-foreground">Maintenance</p>
                        <p className="font-semibold">{result.maintenanceHours} hours</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-sm mb-2">ROI Interpretation</h5>
                <div className="text-sm text-muted-foreground">
                  {result.roiPercentage > 20 && (
                    <p className="text-green-600">Excellent ROI - This investment is highly profitable.</p>
                  )}
                  {result.roiPercentage > 10 && result.roiPercentage <= 20 && (
                    <p className="text-blue-600">Good ROI - This investment shows solid returns.</p>
                  )}
                  {result.roiPercentage > 0 && result.roiPercentage <= 10 && (
                    <p className="text-yellow-600">Moderate ROI - Consider if this meets your investment criteria.</p>
                  )}
                  {result.roiPercentage <= 0 && (
                    <p className="text-red-600">Negative ROI - This investment is not profitable in the current analysis period.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}