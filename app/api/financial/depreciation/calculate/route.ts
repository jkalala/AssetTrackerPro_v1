import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { DepreciationCalculationRequest } from '@/lib/types/financial';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DepreciationCalculationRequest = await request.json();
    
    // Validate required fields
    if (!body.assetFinancialId || !body.method || !body.purchasePrice || !body.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: assetFinancialId, method, purchasePrice, startDate' },
        { status: 400 }
      );
    }

    const financialService = new FinancialAnalyticsService();
    const result = await financialService.calculateDepreciation(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating depreciation:', error);
    return NextResponse.json(
      { error: 'Failed to calculate depreciation' },
      { status: 500 }
    );
  }
}