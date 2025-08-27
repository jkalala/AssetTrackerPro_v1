import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { FinancialReportFilters, CostCategory } from '@/lib/types/financial';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
    }

    // Parse query parameters for filters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const assetIds = url.searchParams.get('assetIds')?.split(',');
    const assetCategoryIds = url.searchParams.get('assetCategoryIds')?.split(',');
    const costCategories = url.searchParams.get('costCategories')?.split(',');
    const departmentIds = url.searchParams.get('departmentIds')?.split(',');
    const budgetIds = url.searchParams.get('budgetIds')?.split(',');

    let filters: FinancialReportFilters | undefined;
    if (startDate && endDate) {
      filters = {
        dateRange: {
          start: new Date(startDate),
          end: new Date(endDate)
        },
        assetIds,
        assetCategoryIds,
        costCategories: costCategories as CostCategory[],
        departmentIds,
        budgetIds
      };
    }

    const financialService = new FinancialAnalyticsService();
    const dashboardData = await financialService.getFinancialDashboardData(tenantId, filters);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching financial dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial dashboard data' },
      { status: 500 }
    );
  }
}