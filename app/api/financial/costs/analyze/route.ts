import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { FinancialReportFilters } from '@/lib/types/financial';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.dateRange || !body.dateRange.start || !body.dateRange.end) {
      return NextResponse.json(
        { error: 'Missing required fields: dateRange.start, dateRange.end' },
        { status: 400 }
      );
    }

    const filters: FinancialReportFilters = {
      dateRange: {
        start: new Date(body.dateRange.start),
        end: new Date(body.dateRange.end)
      },
      assetIds: body.assetIds,
      assetCategoryIds: body.assetCategoryIds,
      costCategories: body.costCategories,
      departmentIds: body.departmentIds,
      budgetIds: body.budgetIds
    };

    const financialService = new FinancialAnalyticsService();
    const costAnalysis = await financialService.analyzeCosts(tenantId, filters);

    return NextResponse.json(costAnalysis);
  } catch (error) {
    console.error('Error analyzing costs:', error);
    return NextResponse.json(
      { error: 'Failed to analyze costs' },
      { status: 500 }
    );
  }
}