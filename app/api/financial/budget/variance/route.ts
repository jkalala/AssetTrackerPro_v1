import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { BudgetVarianceAnalysisRequest } from '@/lib/types/financial';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BudgetVarianceAnalysisRequest = await request.json();
    
    // Validate required fields
    if (!body.budgetId || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: budgetId, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const request_with_dates = {
      ...body,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd)
    };

    const financialService = new FinancialAnalyticsService();
    const variances = await financialService.analyzeBudgetVariance(request_with_dates);

    // Save variance analyses to database
    const variancesToSave = variances.map(variance => ({
      tenant_id: user.user_metadata?.tenant_id,
      budget_id: variance.budgetId,
      budget_line_item_id: variance.budgetLineItemId,
      analysis_date: variance.analysisDate.toISOString().split('T')[0],
      period_start: variance.periodStart.toISOString().split('T')[0],
      period_end: variance.periodEnd.toISOString().split('T')[0],
      budgeted_amount: variance.budgetedAmount,
      actual_amount: variance.actualAmount,
      variance_amount: variance.varianceAmount,
      variance_percentage: variance.variancePercentage,
      variance_type: variance.varianceType,
      variance_reason: variance.varianceReason,
      corrective_action: variance.correctiveAction,
      created_by: user.id
    }));

    const { data: savedVariances, error: saveError } = await supabase
      .from('budget_variances')
      .insert(variancesToSave)
      .select();

    if (saveError) {
      console.error('Error saving budget variances:', saveError);
      return NextResponse.json(
        { error: 'Failed to save budget variance analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json(savedVariances);
  } catch (error) {
    console.error('Error analyzing budget variance:', error);
    return NextResponse.json(
      { error: 'Failed to analyze budget variance' },
      { status: 500 }
    );
  }
}