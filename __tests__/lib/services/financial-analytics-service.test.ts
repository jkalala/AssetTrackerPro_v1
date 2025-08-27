import { FinancialAnalyticsService } from '@/lib/services/financial-analytics-service';
import {
  DepreciationCalculationRequest,
  TCOCalculationRequest,
  ROICalculationRequest,
  BudgetVarianceAnalysisRequest,
  DepreciationMethod
} from '@/lib/types/financial';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [],
              error: null
            }))
          })),
          data: [],
          error: null
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            data: [],
            error: null
          }))
        })),
        in: jest.fn(() => ({
          data: [],
          error: null
        })),
        data: [],
        error: null
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}));

describe('FinancialAnalyticsService', () => {
  let service: FinancialAnalyticsService;

  beforeEach(() => {
    service = new FinancialAnalyticsService();
  });

  describe('calculateDepreciation', () => {
    it('should calculate straight line depreciation correctly', async () => {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'test-asset-id',
        method: 'straight_line' as DepreciationMethod,
        purchasePrice: 10000,
        salvageValue: 1000,
        usefulLifeYears: 5,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await service.calculateDepreciation(request);

      expect(result).toBeDefined();
      expect(result.schedule).toHaveLength(12); // 12 months
      expect(result.totalDepreciation).toBeCloseTo(1800, 0); // (10000-1000)/5 = 1800 per year
      expect(result.currentBookValue).toBeCloseTo(8200, 0); // 10000 - 1800
      expect(result.accumulatedDepreciation).toBeCloseTo(1800, 0);
    });

    it('should calculate declining balance depreciation correctly', async () => {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'test-asset-id',
        method: 'declining_balance' as DepreciationMethod,
        purchasePrice: 10000,
        salvageValue: 1000,
        usefulLifeYears: 5,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await service.calculateDepreciation(request);

      expect(result).toBeDefined();
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.totalDepreciation).toBeGreaterThan(0);
      expect(result.currentBookValue).toBeLessThan(10000);
      expect(result.currentBookValue).toBeGreaterThanOrEqual(1000); // Should not go below salvage value
    });

    it('should calculate double declining balance depreciation correctly', async () => {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'test-asset-id',
        method: 'double_declining_balance' as DepreciationMethod,
        purchasePrice: 10000,
        salvageValue: 1000,
        usefulLifeYears: 5,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await service.calculateDepreciation(request);

      expect(result).toBeDefined();
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.totalDepreciation).toBeGreaterThan(0);
      expect(result.currentBookValue).toBeLessThan(10000);
      expect(result.currentBookValue).toBeGreaterThanOrEqual(1000);
    });

    it('should calculate sum of years digits depreciation correctly', async () => {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'test-asset-id',
        method: 'sum_of_years_digits' as DepreciationMethod,
        purchasePrice: 10000,
        salvageValue: 1000,
        usefulLifeYears: 5,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await service.calculateDepreciation(request);

      expect(result).toBeDefined();
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.totalDepreciation).toBeGreaterThan(0);
      expect(result.currentBookValue).toBeLessThan(10000);
    });

    it('should calculate units of production depreciation correctly', async () => {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'test-asset-id',
        method: 'units_of_production' as DepreciationMethod,
        purchasePrice: 10000,
        salvageValue: 1000,
        usefulLifeUnits: 1000,
        unitsProduced: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await service.calculateDepreciation(request);

      expect(result).toBeDefined();
      expect(result.schedule).toHaveLength(1);
      expect(result.totalDepreciation).toBeCloseTo(900, 0); // (10000-1000) * (100/1000) = 900
      expect(result.currentBookValue).toBeCloseTo(9100, 0); // 10000 - 900
    });

    it('should throw error for missing required fields', async () => {
      const request: DepreciationCalculationRequest = {
        assetFinancialId: 'test-asset-id',
        method: 'straight_line' as DepreciationMethod,
        purchasePrice: 0, // Invalid
        salvageValue: 1000,
        usefulLifeYears: 5,
        startDate: new Date('2024-01-01')
      };

      await expect(service.calculateDepreciation(request)).rejects.toThrow();
    });
  });

  describe('calculateTCO', () => {
    it('should calculate TCO correctly', async () => {
      const request: TCOCalculationRequest = {
        assetId: 'test-asset-id',
        analysisPeriodYears: 5,
        purchasePrice: 10000,
        installationCost: 1000,
        trainingCost: 500,
        initialSetupCost: 300,
        maintenanceCostAnnual: 1200,
        energyCostAnnual: 800,
        insuranceCostAnnual: 400,
        storageCostAnnual: 200,
        laborCostAnnual: 2000,
        disposalCost: 500,
        salvageValue: 1000
      };

      const result = await service.calculateTCO(request);

      expect(result).toBeDefined();
      expect(result.totalAcquisitionCost).toBe(11800); // 10000 + 1000 + 500 + 300
      expect(result.totalOperatingCost).toBe(23000); // (1200 + 800 + 400 + 200 + 2000) * 5
      expect(result.totalEndOfLifeCost).toBe(-500); // 500 - 1000
      expect(result.totalCostOfOwnership).toBe(34300); // 11800 + 23000 + (-500)
      expect(result.tcoPerYear).toBe(6860); // 34300 / 5
      expect(result.tcoPerMonth).toBeCloseTo(571.67, 2); // 34300 / (5 * 12)
    });

    it('should handle minimal TCO calculation', async () => {
      const request: TCOCalculationRequest = {
        assetId: 'test-asset-id',
        analysisPeriodYears: 3,
        purchasePrice: 5000
      };

      const result = await service.calculateTCO(request);

      expect(result).toBeDefined();
      expect(result.totalAcquisitionCost).toBe(5000);
      expect(result.totalOperatingCost).toBe(0);
      expect(result.totalEndOfLifeCost).toBe(0);
      expect(result.totalCostOfOwnership).toBe(5000);
      expect(result.tcoPerYear).toBeCloseTo(1666.67, 2);
    });
  });

  describe('calculateROI', () => {
    it('should calculate ROI correctly', async () => {
      const request: ROICalculationRequest = {
        assetId: 'test-asset-id',
        analysisPeriodStart: new Date('2024-01-01'),
        analysisPeriodEnd: new Date('2024-12-31'),
        initialInvestment: 10000,
        additionalInvestments: 2000,
        revenueGenerated: 8000,
        costSavings: 3000,
        productivityGains: 1500,
        utilizationPercentage: 85,
        downtimeHours: 48,
        maintenanceHours: 120
      };

      const result = await service.calculateROI(request);

      expect(result).toBeDefined();
      expect(result.totalInvestment).toBe(12000); // 10000 + 2000
      expect(result.totalReturns).toBe(12500); // 8000 + 3000 + 1500
      expect(result.netReturn).toBe(500); // 12500 - 12000
      expect(result.roiPercentage).toBeCloseTo(4.17, 2); // (500 / 12000) * 100
      expect(result.paybackPeriodMonths).toBe(12); // 12000 / (12500/12)
    });

    it('should calculate negative ROI correctly', async () => {
      const request: ROICalculationRequest = {
        assetId: 'test-asset-id',
        analysisPeriodStart: new Date('2024-01-01'),
        analysisPeriodEnd: new Date('2024-12-31'),
        initialInvestment: 10000,
        revenueGenerated: 5000,
        costSavings: 1000
      };

      const result = await service.calculateROI(request);

      expect(result).toBeDefined();
      expect(result.totalInvestment).toBe(10000);
      expect(result.totalReturns).toBe(6000);
      expect(result.netReturn).toBe(-4000);
      expect(result.roiPercentage).toBe(-40); // (-4000 / 10000) * 100
    });

    it('should handle zero returns', async () => {
      const request: ROICalculationRequest = {
        assetId: 'test-asset-id',
        analysisPeriodStart: new Date('2024-01-01'),
        analysisPeriodEnd: new Date('2024-12-31'),
        initialInvestment: 10000
      };

      const result = await service.calculateROI(request);

      expect(result).toBeDefined();
      expect(result.totalReturns).toBe(0);
      expect(result.netReturn).toBe(-10000);
      expect(result.roiPercentage).toBe(-100);
      expect(result.paybackPeriodMonths).toBeUndefined();
    });
  });

  describe('analyzeBudgetVariance', () => {
    it('should analyze budget variance correctly', async () => {
      // Mock the Supabase responses
      const mockLineItems = [
        {
          id: 'line-item-1',
          tenant_id: 'tenant-1',
          budget_id: 'budget-1',
          cost_category: 'maintenance',
          budgeted_amount: 5000
        }
      ];

      const mockCosts = [
        { cost_amount: 3000 },
        { cost_amount: 1500 }
      ];

      // Mock the service's supabase calls
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  data: mockCosts,
                  error: null
                }))
              })),
              data: mockLineItems,
              error: null
            }))
          }))
        }))
      };

      // Replace the service's supabase instance
      (service as any).supabase = mockSupabase;

      const request: BudgetVarianceAnalysisRequest = {
        budgetId: 'budget-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31')
      };

      const result = await service.analyzeBudgetVariance(request);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].budgetedAmount).toBe(5000);
      expect(result[0].actualAmount).toBe(4500); // 3000 + 1500
      expect(result[0].varianceAmount).toBe(-500); // 4500 - 5000
      expect(result[0].variancePercentage).toBe(-10); // (-500 / 5000) * 100
      expect(result[0].varianceType).toBe('favorable');
    });
  });

  describe('getFinancialDashboardData', () => {
    it('should return dashboard data', async () => {
      const result = await service.getFinancialDashboardData('tenant-1');

      expect(result).toBeDefined();
      expect(result.totalAssetValue).toBeDefined();
      expect(result.totalDepreciation).toBeDefined();
      expect(result.totalMaintenanceCosts).toBeDefined();
      expect(result.budgetUtilization).toBeDefined();
      expect(result.averageROI).toBeDefined();
      expect(result.topCostCategories).toBeDefined();
      expect(Array.isArray(result.topCostCategories)).toBe(true);
    });
  });

  describe('analyzeCosts', () => {
    it('should analyze costs correctly', async () => {
      const filters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      };

      const result = await service.analyzeCosts('tenant-1', filters);

      expect(result).toBeDefined();
      expect(result.totalCosts).toBeDefined();
      expect(result.costsByCategory).toBeDefined();
      expect(result.costsByMonth).toBeDefined();
      expect(result.topAssetsByCost).toBeDefined();
      expect(Array.isArray(result.costsByMonth)).toBe(true);
      expect(Array.isArray(result.topAssetsByCost)).toBe(true);
    });
  });

  describe('getDepreciationSummary', () => {
    it('should return depreciation summary', async () => {
      const result = await service.getDepreciationSummary('tenant-1');

      expect(result).toBeDefined();
      expect(result.totalOriginalValue).toBeDefined();
      expect(result.totalCurrentValue).toBeDefined();
      expect(result.totalDepreciation).toBeDefined();
      expect(result.depreciationByMethod).toBeDefined();
      expect(result.monthlyDepreciation).toBeDefined();
      expect(Array.isArray(result.monthlyDepreciation)).toBe(true);
    });
  });

  describe('checkFinancialAlerts', () => {
    it('should check financial alerts without errors', async () => {
      await expect(service.checkFinancialAlerts('tenant-1')).resolves.not.toThrow();
    });
  });
});