// Financial Analytics and Cost Management Types

export type DepreciationMethod = 
  | 'straight_line'
  | 'declining_balance'
  | 'double_declining_balance'
  | 'sum_of_years_digits'
  | 'units_of_production';

export type CostCategory = 
  | 'acquisition'
  | 'maintenance'
  | 'operational'
  | 'insurance'
  | 'storage'
  | 'disposal'
  | 'other';

export type BudgetStatus = 
  | 'draft'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled';

export type VarianceType = 
  | 'favorable'
  | 'unfavorable'
  | 'neutral';

export interface AssetFinancialData {
  id: string;
  tenantId: string;
  assetId: string;
  
  // Purchase Information
  purchasePrice: number;
  purchaseDate?: Date;
  vendorId?: string;
  purchaseOrderNumber?: string;
  
  // Depreciation Configuration
  depreciationMethod: DepreciationMethod;
  usefulLifeYears?: number;
  usefulLifeUnits?: number;
  salvageValue: number;
  depreciationStartDate?: Date;
  
  // Current Values
  currentBookValue?: number;
  currentMarketValue?: number;
  lastValuationDate?: Date;
  
  // Warranty and Insurance
  warrantyCost: number;
  warrantyExpiryDate?: Date;
  insuranceCostAnnual: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DepreciationScheduleEntry {
  id: string;
  tenantId: string;
  assetFinancialId: string;
  
  periodStartDate: Date;
  periodEndDate: Date;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  bookValue: number;
  
  // For units of production method
  unitsProduced?: number;
  
  createdAt: Date;
}

export interface AssetCost {
  id: string;
  tenantId: string;
  assetId: string;
  
  costCategory: CostCategory;
  costAmount: number;
  costDate: Date;
  description?: string;
  
  // Reference Information
  vendorId?: string;
  invoiceNumber?: string;
  workOrderId?: string;
  
  // Approval Information
  approvedBy?: string;
  approvedAt?: Date;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  tenantId: string;
  
  name: string;
  description?: string;
  budgetYear: number;
  status: BudgetStatus;
  
  // Budget Amounts
  totalBudget: number;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  
  // Department/Category Filters
  departmentId?: string;
  assetCategoryId?: string;
  costCategories?: CostCategory[];
  
  // Approval Information
  approvedBy?: string;
  approvedAt?: Date;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetLineItem {
  id: string;
  tenantId: string;
  budgetId: string;
  
  lineItemName: string;
  description?: string;
  costCategory: CostCategory;
  
  // Budget Amounts
  budgetedAmount: number;
  spentAmount: number;
  committedAmount: number;
  
  // Asset Filters
  assetIds?: string[];
  assetCategoryId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetVariance {
  id: string;
  tenantId: string;
  budgetId: string;
  budgetLineItemId?: string;
  
  analysisDate: Date;
  periodStart: Date;
  periodEnd: Date;
  
  // Variance Calculations
  budgetedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  varianceType: VarianceType;
  
  // Analysis
  varianceReason?: string;
  correctiveAction?: string;
  
  createdBy: string;
  createdAt: Date;
}

export interface ROIAnalysis {
  id: string;
  tenantId: string;
  assetId: string;
  
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  
  // Investment Costs
  initialInvestment: number;
  additionalInvestments: number;
  totalInvestment: number;
  
  // Returns/Benefits
  revenueGenerated: number;
  costSavings: number;
  productivityGains: number;
  totalReturns: number;
  
  // ROI Calculations
  netReturn: number;
  roiPercentage: number;
  paybackPeriodMonths?: number;
  
  // Utilization Metrics
  utilizationPercentage?: number;
  downtimeHours: number;
  maintenanceHours: number;
  
  createdBy: string;
  createdAt: Date;
}

export interface TCOAnalysis {
  id: string;
  tenantId: string;
  assetId: string;
  
  analysisPeriodYears: number;
  analysisDate: Date;
  
  // Acquisition Costs
  purchasePrice: number;
  installationCost: number;
  trainingCost: number;
  initialSetupCost: number;
  
  // Operating Costs (Annual)
  maintenanceCostAnnual: number;
  energyCostAnnual: number;
  insuranceCostAnnual: number;
  storageCostAnnual: number;
  laborCostAnnual: number;
  
  // End-of-Life Costs
  disposalCost: number;
  salvageValue: number;
  
  // TCO Calculations
  totalAcquisitionCost: number;
  totalOperatingCost: number;
  totalEndOfLifeCost: number;
  totalCostOfOwnership: number;
  
  // Per-period calculations
  tcoPerYear: number;
  tcoPerMonth: number;
  
  createdBy: string;
  createdAt: Date;
}

export interface FinancialAlert {
  id: string;
  tenantId: string;
  
  alertName: string;
  alertType: string;
  
  // Alert Conditions
  thresholdValue?: number;
  thresholdPercentage?: number;
  comparisonOperator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  
  // Scope
  budgetId?: string;
  assetIds?: string[];
  assetCategoryId?: string;
  
  // Notification Settings
  notificationChannels: string[];
  notificationRecipients: string[];
  
  // Status
  isActive: boolean;
  lastTriggeredAt?: Date;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialAlertHistory {
  id: string;
  tenantId: string;
  alertId: string;
  
  triggeredAt: Date;
  alertValue?: number;
  thresholdValue?: number;
  
  // Context
  assetId?: string;
  budgetId?: string;
  
  // Notification Status
  notificationsSent: Record<string, unknown>;
  
  createdAt: Date;
}

// Request/Response Types
export interface DepreciationCalculationRequest {
  assetFinancialId: string;
  method: DepreciationMethod;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears?: number;
  usefulLifeUnits?: number;
  startDate: Date;
  endDate?: Date;
  unitsProduced?: number; // For units of production method
}

export interface DepreciationCalculationResult {
  schedule: DepreciationScheduleEntry[];
  totalDepreciation: number;
  currentBookValue: number;
  accumulatedDepreciation: number;
}

export interface TCOCalculationRequest {
  assetId: string;
  analysisPeriodYears: number;
  purchasePrice: number;
  installationCost?: number;
  trainingCost?: number;
  initialSetupCost?: number;
  maintenanceCostAnnual?: number;
  energyCostAnnual?: number;
  insuranceCostAnnual?: number;
  storageCostAnnual?: number;
  laborCostAnnual?: number;
  disposalCost?: number;
  salvageValue?: number;
}

export interface ROICalculationRequest {
  assetId: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  initialInvestment: number;
  additionalInvestments?: number;
  revenueGenerated?: number;
  costSavings?: number;
  productivityGains?: number;
  utilizationPercentage?: number;
  downtimeHours?: number;
  maintenanceHours?: number;
}

export interface BudgetVarianceAnalysisRequest {
  budgetId: string;
  periodStart: Date;
  periodEnd: Date;
  lineItemId?: string;
}

export interface FinancialDashboardData {
  totalAssetValue: number;
  totalDepreciation: number;
  totalMaintenanceCosts: number;
  budgetUtilization: number;
  averageROI: number;
  topCostCategories: Array<{
    category: CostCategory;
    amount: number;
    percentage: number;
  }>;
  budgetVariances: BudgetVariance[];
  upcomingDepreciationMilestones: Array<{
    assetId: string;
    assetName: string;
    milestone: string;
    date: Date;
    amount: number;
  }>;
}

export interface FinancialReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  assetIds?: string[];
  assetCategoryIds?: string[];
  costCategories?: CostCategory[];
  departmentIds?: string[];
  budgetIds?: string[];
}

export interface CostAnalysisResult {
  totalCosts: number;
  costsByCategory: Record<CostCategory, number>;
  costsByMonth: Array<{
    month: string;
    amount: number;
  }>;
  topAssetsByCost: Array<{
    assetId: string;
    assetName: string;
    totalCost: number;
  }>;
}

export interface DepreciationSummary {
  totalOriginalValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  depreciationByMethod: Record<DepreciationMethod, number>;
  monthlyDepreciation: Array<{
    month: string;
    amount: number;
  }>;
}