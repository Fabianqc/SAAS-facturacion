export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FinancialTransaction {
  id: string;
  tenantId: string;
  storeId?: string | null;
  store?: {
    id: string;
    name: string;
  } | null;
  type: TransactionType;
  category: string;
  currencyOrigin: 'USD' | 'VES';
  amountUSD: number;
  amountVES: number;
  exchangeRate: number;
  justification: string;
  voucherNumber?: string | null;
  date: string;
  isActive: boolean;
  createdAt: string;
}

export interface PnLSummary {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  inflows: {
    salesUSD: number;
    salesVES: number;
    salesCount: number;
    salesTaxUSD: number;
    salesTaxVES: number;
    extraIncomesUSD: number;
    extraIncomesVES: number;
    extraIncomesCount: number;
    totalGrossIncomeUSD: number;
    totalGrossIncomeVES: number;
  };
  outflows: {
    purchasesUSD: number;
    purchasesVES: number;
    purchasesCount: number;
    purchasesTaxUSD: number;
    purchasesTaxVES: number;
    payrollUSD: number;
    payrollVES: number;
    payrollReceiptsCount: number;
    operatingExpensesUSD: number;
    operatingExpensesVES: number;
    operatingExpensesCount: number;
    mermasUSD: number;
    mermasVES: number;
    mermasCount: number;
    totalOperatingCostsUSD: number;
    totalOperatingCostsVES: number;
  };
  results: {
    grossProfitUSD: number;
    grossProfitVES: number;
    netOperatingProfitUSD: number;
    netOperatingProfitVES: number;
    operatingMarginPercent: number;
    isProfitable: boolean;
  };
  expensesByCategory: Array<{
    category: string;
    amountUSD: number;
    amountVES: number;
    count: number;
  }>;
}
