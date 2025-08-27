'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';
import { CostAnalysisResult } from '@/lib/types/financial';

interface CostAnalysisChartProps {
  data: CostAnalysisResult;
}

export function CostAnalysisChart({ data }: CostAnalysisChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate percentages for pie chart visualization
  const categoryData = Object.entries(data.costsByCategory).map(([category, amount]) => ({
    category: formatCategoryName(category),
    amount,
    percentage: (amount / data.totalCosts) * 100
  })).sort((a, b) => b.amount - a.amount);

  // Get colors for categories
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500'
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Cost by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Costs by Category
          </CardTitle>
          <CardDescription>
            Breakdown of total costs by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visual representation */}
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              {(() => {
                let leftPosition = 0;
                return categoryData.map((item, index) => {
                  const width = item.percentage;
                  const left = leftPosition;
                  leftPosition += width;
                  return (
                    <div
                      key={item.category}
                      className={`absolute h-full ${colors[index % colors.length]}`}
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
              {categoryData.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm font-medium">{item.category}</span>
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

            <div className="pt-2 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total Costs:</span>
                <span>{formatCurrency(data.totalCosts)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cost Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Cost Trend
          </CardTitle>
          <CardDescription>
            Cost trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart visualization */}
            <div className="space-y-2">
              {data.costsByMonth.map((monthData) => {
                const maxAmount = Math.max(...data.costsByMonth.map(m => m.amount));
                const percentage = (monthData.amount / maxAmount) * 100;
                
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
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {data.costsByMonth.length > 0 && (
              <div className="pt-2 border-t text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Average Monthly:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      data.costsByMonth.reduce((sum, m) => sum + m.amount, 0) / data.costsByMonth.length
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Highest Month:</span>
                  <span className="font-medium">
                    {formatCurrency(Math.max(...data.costsByMonth.map(m => m.amount)))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Assets by Cost */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Assets by Cost
          </CardTitle>
          <CardDescription>
            Assets with the highest total costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topAssetsByCost.slice(0, 10).map((asset, index) => {
              const maxCost = data.topAssetsByCost[0]?.totalCost || 1;
              const percentage = (asset.totalCost / maxCost) * 100;
              
              const rank = index + 1;
              return (
                <div key={asset.assetId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{rank}
                      </span>
                      <span className="font-medium">{asset.assetName}</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(asset.totalCost)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {data.topAssetsByCost.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No asset cost data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}