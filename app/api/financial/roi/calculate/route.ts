import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { ROICalculationRequest } from '@/lib/types/financial';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ROICalculationRequest = await request.json();
    
    // Validate required fields
    if (!body.assetId || !body.analysisPeriodStart || !body.analysisPeriodEnd || !body.initialInvestment) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId, analysisPeriodStart, analysisPeriodEnd, initialInvestment' },
        { status: 400 }
      );
    }

    const financialService = new FinancialAnalyticsService();
    const result = await financialService.calculateROI(body);

    // Save ROI analysis to database
    const { data: savedROI, error: saveError } = await supabase
      .from('roi_analysis')
      .insert({
        tenant_id: user.user_metadata?.tenant_id,
        asset_id: result.assetId,
        analysis_period_start: result.analysisPeriodStart.toISOString().split('T')[0],
        analysis_period_end: result.analysisPeriodEnd.toISOString().split('T')[0],
        initial_investment: result.initialInvestment,
        additional_investments: result.additionalInvestments,
        total_investment: result.totalInvestment,
        revenue_generated: result.revenueGenerated,
        cost_savings: result.costSavings,
        productivity_gains: result.productivityGains,
        total_returns: result.totalReturns,
        net_return: result.netReturn,
        roi_percentage: result.roiPercentage,
        payback_period_months: result.paybackPeriodMonths,
        utilization_percentage: result.utilizationPercentage,
        downtime_hours: result.downtimeHours,
        maintenance_hours: result.maintenanceHours,
        created_by: user.id
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving ROI analysis:', saveError);
      return NextResponse.json(
        { error: 'Failed to save ROI analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json(savedROI);
  } catch (error) {
    console.error('Error calculating ROI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}