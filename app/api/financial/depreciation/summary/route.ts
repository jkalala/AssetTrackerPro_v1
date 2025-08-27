import { NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    const financialService = new FinancialAnalyticsService();
    const depreciationSummary = await financialService.getDepreciationSummary(tenantId);

    return NextResponse.json(depreciationSummary);
  } catch (error) {
    console.error('Error fetching depreciation summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch depreciation summary' },
      { status: 500 }
    );
  }
}