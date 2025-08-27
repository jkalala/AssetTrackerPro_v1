import { Metadata } from 'next';
import { FinancialDashboard } from '@/components/financial/financial-dashboard';

export const metadata: Metadata = {
  title: 'Financial Analytics | AssetTracker Pro',
  description: 'Comprehensive financial analytics and cost management for your assets',
};

export default function FinancialAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive financial analysis, cost management, and ROI tracking for your assets
          </p>
        </div>
      </div>

      <FinancialDashboard />
    </div>
  );
}