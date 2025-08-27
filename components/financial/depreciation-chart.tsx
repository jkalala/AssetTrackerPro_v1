'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, BarChart3 } from 'lucide-react';
import { DepreciationSummary } from '@/lib/types/financial';

interface DepreciationChartProps {
  data: DepreciationSummary;
}

export function DepreciationChart({ data }: DepreciationChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatMethodName = (method: string) => {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate depreciation rate
  const depreciationRate = data.totalOriginalValue > 0 
    ? ((data.totalOriginalValue - data.totalCurrentValue) / data.totalOriginalValue) * 100 
    : 0;

  // Prepare depreciation by method data
  const methodData = Object.entries(data.depreciationByMethod).map(([method, amount]) => ({
    method: formatMethodName(method),
    amount,
    percentage: data.totalDepreciation > 0 ? (amount / data.totalDepreciation) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  // Colors for different methods
  const methodColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500'
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Asset Value Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Asset Value Overview
          </CardTitle>
          <CardDescription>
            Current vs original asset values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Value comparison bars */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Original Value</span>
                  <span className="font-semibold">{formatCurrency(data.totalOriginalValue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Current Value</span>
                  <span className="font-semibold">{formatCurrency(data.totalCurrentValue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${data.totalOriginalValue > 0 ? (data.totalCurrentValue / data.totalOriginalValue) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Depreciation</span>
                  <span className="font-semibold text-red-600">{formatCurrency(data.totalDepreciation)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${data.totalOriginalValue > 0 ? (data.totalDepreciation / data.totalOriginalValue) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Summary metrics */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Depreciation Rate:</span>
                <span className="text-sm font-semibold">{depreciationRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Value Retained:</span>
                <span className="text-sm font-semibold">{(100 - depreciationRate).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depreciation by Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Depreciation by Method
          </CardTitle>
          <CardDescription>
            Breakdown by depreciation method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {methodData.length > 0 ? (
              <>
                {/* Visual representation */}
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  {(() => {
                    let leftPosition = 0;
                    return methodData.map((item, index) => {
                      const width = item.percentage;
                      const left = leftPosition;
                      leftPosition += width;
                      return (
                        <div
                          key={item.method}
                          className={`absolute h-full ${methodColors[index % methodColors.length]}`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`
                          }}
                        />
                      );
                    });
                  })()}
                </div>

                {/* Legend and values */}
                <div className="space-y-2">
                  {methodData.map((item, index) => (
                    <div key={item.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${methodColors[index % methodColors.length]}`} />
                        <span className="text-sm font-medium">{item.method}</span>
                        <span className="text-sm text-muted-foreground">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No depreciation method data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Depreciation Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Monthly Depreciation Trend
          </CardTitle>
          <CardDescription>
            Depreciation amounts over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthlyDepreciation.length > 0 ? (
              <>
                <div className="space-y-2">
                  {data.monthlyDepreciation.slice(-12).map((monthData) => {
                    const maxAmount = Math.max(...data.monthlyDepreciation.map(m => m.amount));
                    const percentage = maxAmount > 0 ? (monthData.amount / maxAmount) * 100 : 0;
                    
                    return (
                      <div key={monthData.month} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {new Date(monthData.month + '-01').toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short'
                            })}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(monthData.amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t text-sm text-muted-foreground">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="flex justify-between">
                      <span>Average Monthly:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          data.monthlyDepreciation.reduce((sum, m) => sum + m.amount, 0) / data.monthlyDepreciation.length
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Highest Month:</span>
                      <span className="font-medium">
                        {formatCurrency(Math.max(...data.monthlyDepreciation.map(m => m.amount)))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Periods:</span>
                      <span className="font-medium">{data.monthlyDepreciation.length}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No monthly depreciation data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}