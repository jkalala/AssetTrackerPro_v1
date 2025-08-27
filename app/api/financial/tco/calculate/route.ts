import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { TCOCalculationRequest } from '@/lib/types/financial';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: TCOCalculationRequest = await request.json();
    
    // Validate required fields
    if (!body.assetId || !body.analysisPeriodYears || !body.purchasePrice) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId, analysisPeriodYears, purchasePrice' },
        { status: 400 }
      );
    }

    const financialService = new FinancialAnalyticsService();
    const result = await financialService.calculateTCO(body);

    // Save TCO analysis to database
    const { data: savedTCO, error: saveError } = await supabase
      .from('tco_analysis')
      .insert({
        tenant_id: user.user_metadata?.tenant_id,
        asset_id: result.assetId,
        analysis_period_years: result.analysisPeriodYears,
        analysis_date: result.analysisDate.toISOString().split('T')[0],
        purchase_price: result.purchasePrice,
        installation_cost: result.installationCost,
        training_cost: result.trainingCost,
        initial_setup_cost: result.initialSetupCost,
        maintenance_cost_annual: result.maintenanceCostAnnual,
        energy_cost_annual: result.energyCostAnnual,
        insurance_cost_annual: result.insuranceCostAnnual,
        storage_cost_annual: result.storageCostAnnual,
        labor_cost_annual: result.laborCostAnnual,
        disposal_cost: result.disposalCost,
        salvage_value: result.salvageValue,
        total_acquisition_cost: result.totalAcquisitionCost,
        total_operating_cost: result.totalOperatingCost,
        total_end_of_life_cost: result.totalEndOfLifeCost,
        total_cost_of_ownership: result.totalCostOfOwnership,
        tco_per_year: result.tcoPerYear,
        tco_per_month: result.tcoPerMonth,
        created_by: user.id
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving TCO analysis:', saveError);
      return NextResponse.json(
        { error: 'Failed to save TCO analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json(savedTCO);
  } catch (error) {
    console.error('Error calculating TCO:', error);
    return NextResponse.json(
      { error: 'Failed to calculate TCO' },
      { status: 500 }
    );
  }
}