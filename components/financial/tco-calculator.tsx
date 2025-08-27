'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, DollarSign } from 'lucide-react';
import { TCOCalculationRequest, TCOAnalysis } from '@/lib/types/financial';

export function TCOCalculator() {
  const [formData, setFormData] = useState<Partial<TCOCalculationRequest>>({
    analysisPeriodYears: 5,
    purchasePrice: 0,
    installationCost: 0,
    trainingCost: 0,
    initialSetupCost: 0,
    maintenanceCostAnnual: 0,
    energyCostAnnual: 0,
    insuranceCostAnnual: 0,
    storageCostAnnual: 0,
    laborCostAnnual: 0,
    disposalCost: 0,
    salvageValue: 0
  });
  const [result, setResult] = useState<TCOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof TCOCalculationRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateTCO = async () => {
    if (!formData.purchasePrice || !formData.analysisPeriodYears) {
      setError('Please fill in purchase price and analysis period');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: TCOCalculationRequest = {
        assetId: 'temp-asset-id', // This would be actual asset ID in real usage
        analysisPeriodYears: formData.analysisPeriodYears,
        purchasePrice: formData.purchasePrice,
        installationCost: formData.installationCost,
        trainingCost: formData.trainingCost,
        initialSetupCost: formData.initialSetupCost,
        maintenanceCostAnnual: formData.maintenanceCostAnnual,
        energyCostAnnual: formData.energyCostAnnual,
        insuranceCostAnnual: formData.insuranceCostAnnual,
        storageCostAnnual: formData.storageCostAnnual,
        laborCostAnnual: formData.laborCostAnnual,
        disposalCost: formData.disposalCost,
        salvageValue: formData.salvageValue
      };

      const response = await fetch('/api/financial/tco/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate TCO');
      }

      const tcoResult = await response.json();
      setResult(tcoResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate TCO');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Total Cost of Ownership (TCO)
        </CardTitle>
        <CardDescription>
          Calculate the complete cost of owning an asset over its lifetime
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label htmlFor="analysis-period">Analysis Period (Years) *</Label>
            <Input
              id="analysis-period"
              type="number"
              placeholder="Enter analysis period"
              value={formData.analysisPeriodYears || ''}
              onChange={(e) => handleInputChange('analysisPeriodYears', parseInt(e.target.value) || 0)}
            />
          </div>

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

          {/* Acquisition Costs */}
          <div className="space-y-2">
            <Label htmlFor="installation-cost">Installation Cost</Label>
            <Input
              id="installation-cost"
              type="number"
              placeholder="Enter installation cost"
              value={formData.installationCost || ''}
              onChange={(e) => handleInputChange('installationCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-cost">Training Cost</Label>
            <Input
              id="training-cost"
              type="number"
              placeholder="Enter training cost"
              value={formData.trainingCost || ''}
              onChange={(e) => handleInputChange('trainingCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-cost">Initial Setup Cost</Label>
            <Input
              id="setup-cost"
              type="number"
              placeholder="Enter setup cost"
              value={formData.initialSetupCost || ''}
              onChange={(e) => handleInputChange('initialSetupCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Annual Operating Costs */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-cost">Annual Maintenance Cost</Label>
            <Input
              id="maintenance-cost"
              type="number"
              placeholder="Enter annual maintenance cost"
              value={formData.maintenanceCostAnnual || ''}
              onChange={(e) => handleInputChange('maintenanceCostAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="energy-cost">Annual Energy Cost</Label>
            <Input
              id="energy-cost"
              type="number"
              placeholder="Enter annual energy cost"
              value={formData.energyCostAnnual || ''}
              onChange={(e) => handleInputChange('energyCostAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insurance-cost">Annual Insurance Cost</Label>
            <Input
              id="insurance-cost"
              type="number"
              placeholder="Enter annual insurance cost"
              value={formData.insuranceCostAnnual || ''}
              onChange={(e) => handleInputChange('insuranceCostAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage-cost">Annual Storage Cost</Label>
            <Input
              id="storage-cost"
              type="number"
              placeholder="Enter annual storage cost"
              value={formData.storageCostAnnual || ''}
              onChange={(e) => handleInputChange('storageCostAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labor-cost">Annual Labor Cost</Label>
            <Input
              id="labor-cost"
              type="number"
              placeholder="Enter annual labor cost"
              value={formData.laborCostAnnual || ''}
              onChange={(e) => handleInputChange('laborCostAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* End-of-Life Costs */}
          <div className="space-y-2">
            <Label htmlFor="disposal-cost">Disposal Cost</Label>
            <Input
              id="disposal-cost"
              type="number"
              placeholder="Enter disposal cost"
              value={formData.disposalCost || ''}
              onChange={(e) => handleInputChange('disposalCost', parseFloat(e.target.value) || 0)}
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
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={calculateTCO} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Calculating...' : 'Calculate TCO'}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5" />
              TCO Analysis Results
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total TCO</p>
                <p className="text-xl font-bold">{formatCurrency(result.totalCostOfOwnership)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">TCO per Year</p>
                <p className="text-xl font-bold">{formatCurrency(result.tcoPerYear)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">TCO per Month</p>
                <p className="text-xl font-bold">{formatCurrency(result.tcoPerMonth)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Analysis Period</p>
                <p className="text-xl font-bold">{result.analysisPeriodYears} years</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Cost Breakdown</h4>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Acquisition Costs</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Purchase Price:</span>
                      <span>{formatCurrency(result.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Installation:</span>
                      <span>{formatCurrency(result.installationCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Training:</span>
                      <span>{formatCurrency(result.trainingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setup:</span>
                      <span>{formatCurrency(result.initialSetupCost)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>{formatCurrency(result.totalAcquisitionCost)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Operating Costs ({result.analysisPeriodYears} years)</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Maintenance:</span>
                      <span>{formatCurrency(result.maintenanceCostAnnual * result.analysisPeriodYears)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Energy:</span>
                      <span>{formatCurrency(result.energyCostAnnual * result.analysisPeriodYears)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span>{formatCurrency(result.insuranceCostAnnual * result.analysisPeriodYears)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{formatCurrency(result.storageCostAnnual * result.analysisPeriodYears)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor:</span>
                      <span>{formatCurrency(result.laborCostAnnual * result.analysisPeriodYears)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>{formatCurrency(result.totalOperatingCost)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">End-of-Life Costs</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Disposal:</span>
                      <span>{formatCurrency(result.disposalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Salvage Value:</span>
                      <span className="text-green-600">-{formatCurrency(result.salvageValue)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Net:</span>
                      <span>{formatCurrency(result.totalEndOfLifeCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}