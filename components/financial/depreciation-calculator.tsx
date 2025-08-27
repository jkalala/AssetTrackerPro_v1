'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingDown } from 'lucide-react';
import { DepreciationCalculationRequest, DepreciationCalculationResult, DepreciationMethod } from '@/lib/types/financial';

export function DepreciationCalculator() {
  const [formData, setFormData] = useState<Partial<DepreciationCalculationRequest>>({
    method: 'straight_line',
    purchasePrice: 0,
    salvageValue: 0,
    usefulLifeYears: 5,
    startDate: new Date()
  });
  const [result, setResult] = useState<DepreciationCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DepreciationCalculationRequest, value: string | number | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateDepreciation = async () => {
    if (!formData.purchasePrice || !formData.method || !formData.startDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'temp-id', // This would be actual asset ID in real usage
        method: formData.method as DepreciationMethod,
        purchasePrice: formData.purchasePrice,
        salvageValue: formData.salvageValue || 0,
        usefulLifeYears: formData.usefulLifeYears,
        usefulLifeUnits: formData.usefulLifeUnits,
        startDate: formData.startDate,
        endDate: formData.endDate,
        unitsProduced: formData.unitsProduced
      };

      const response = await fetch('/api/financial/depreciation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate depreciation');
      }

      const calculationResult = await response.json();
      setResult(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate depreciation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Depreciation Calculator
        </CardTitle>
        <CardDescription>
          Calculate asset depreciation using various methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purchase-price">Purchase Price *</Label>
            <Input
              id="purchase-price"
              type="number"
              placeholder="Enter purchase price"
              value={formData.purchasePrice || ''}
              onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salvage-value">Salvage Value</Label>
            <Input
              id="salvage-value"
              type="number"
              placeholder="Enter salvage value"
              value={formData.salvageValue || ''}
              onChange={(e) => handleInputChange('salvageValue', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="depreciation-method">Depreciation Method *</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => handleInputChange('method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_line">Straight Line</SelectItem>
                <SelectItem value="declining_balance">Declining Balance</SelectItem>
                <SelectItem value="double_declining_balance">Double Declining Balance</SelectItem>
                <SelectItem value="sum_of_years_digits">Sum of Years Digits</SelectItem>
                <SelectItem value="units_of_production">Units of Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="useful-life">Useful Life (Years)</Label>
            <Input
              id="useful-life"
              type="number"
              placeholder="Enter useful life"
              value={formData.usefulLifeYears || ''}
              onChange={(e) => handleInputChange('usefulLifeYears', parseInt(e.target.value) || 0)}
            />
          </div>

          {formData.method === 'units_of_production' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="useful-life-units">Useful Life (Units)</Label>
                <Input
                  id="useful-life-units"
                  type="number"
                  placeholder="Enter total units"
                  value={formData.usefulLifeUnits || ''}
                  onChange={(e) => handleInputChange('usefulLifeUnits', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="units-produced">Units Produced</Label>
                <Input
                  id="units-produced"
                  type="number"
                  placeholder="Enter units produced"
                  value={formData.unitsProduced || ''}
                  onChange={(e) => handleInputChange('unitsProduced', parseInt(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date *</Label>
            <Input
              id="start-date"
              type="date"
              value={formData.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date (Optional)</Label>
            <Input
              id="end-date"
              type="date"
              value={formData.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={calculateDepreciation} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Calculating...' : 'Calculate Depreciation'}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <TrendingDown className="h-5 w-5" />
              Depreciation Results
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Depreciation</p>
                <p className="text-xl font-bold">{formatCurrency(result.totalDepreciation)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Book Value</p>
                <p className="text-xl font-bold">{formatCurrency(result.currentBookValue)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Accumulated Depreciation</p>
                <p className="text-xl font-bold">{formatCurrency(result.accumulatedDepreciation)}</p>
              </div>
            </div>

            {result.schedule.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Depreciation Schedule (First 12 Periods)</h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Period</th>
                        <th className="text-right p-2">Depreciation</th>
                        <th className="text-right p-2">Accumulated</th>
                        <th className="text-right p-2">Book Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.slice(0, 12).map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            {formatDate(entry.periodStartDate)} - {formatDate(entry.periodEndDate)}
                          </td>
                          <td className="text-right p-2">
                            {formatCurrency(entry.depreciationAmount)}
                          </td>
                          <td className="text-right p-2">
                            {formatCurrency(entry.accumulatedDepreciation)}
                          </td>
                          <td className="text-right p-2">
                            {formatCurrency(entry.bookValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.schedule.length > 12 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing first 12 periods of {result.schedule.length} total periods
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}