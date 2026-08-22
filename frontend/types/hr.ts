export interface JobPosition {
  id: string;
  tenantId: string;
  name: string;
  department?: string | null;
  requiresUserAccount: boolean;
  salaryCurrency?: 'USD' | 'VES';
  defaultSalaryUSD: number;
  defaultSalaryVES?: number | null;
  description?: string | null;
  createdAt: string;
  _count?: {
    employees: number;
  };
}

export interface Employee {
  id: string;
  tenantId: string;
  storeId?: string | null;
  store?: { id: string; name: string } | null;
  positionId: string;
  position: JobPosition;
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
  idDocType: 'V' | 'E' | 'J' | 'P';
  idDocNumber: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hireDate: string;
  paymentFrequency: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  salaryCurrency?: 'USD' | 'VES';
  baseSalaryUSD: number;
  baseSalaryVES?: number | null;
  paymentMethod: 'CASH_USD' | 'PAGO_MOVIL' | 'TRANSFER_VES';
  bankName?: string | null;
  bankAccount?: string | null;
  pagoMovilPhone?: string | null;
  pagoMovilRif?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  notes?: string | null;
  _count?: {
    incidents: number;
    salaryAdvances: number;
    payrollReceipts: number;
  };
}

export interface EmployeeIncident {
  id: string;
  tenantId: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    idDocType: string;
    idDocNumber: string;
    position?: JobPosition;
  };
  date: string;
  type: 'FALTA_INJUSTIFICADA' | 'FALTA_JUSTIFICADA' | 'RETRASO' | 'INFRACCION_DISCIPLINARIA' | 'BONO_MERITO' | 'HORAS_EXTRAS';
  amountUSD: number;
  deductFromPayroll: boolean;
  notes: string;
  createdAt: string;
}

export interface SalaryAdvance {
  id: string;
  tenantId: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    idDocType: string;
    idDocNumber: string;
    position?: JobPosition;
  };
  date: string;
  amountUSD: number;
  amountVES: number;
  exchangeRate: number;
  status: 'PENDING' | 'PAID_OUT' | 'DEDUCTED';
  reason?: string | null;
  receiptNumber?: string | null;
  createdAt: string;
}

export interface PayrollCalculation {
  employeeId: string;
  employeeName: string;
  idDoc: string;
  position: string;
  paymentFrequency: string;
  basePeriodSalaryUSD: number;
  bonusUSD: number;
  deductionsUSD: number;
  advancesUSD: number;
  netSalaryUSD: number;
  netSalaryVES: number;
  exchangeRateUSD: number;
}

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
  frequency: string;
  exchangeRate: number;
  totalGrossUSD: number;
  totalDeductionsUSD: number;
  totalNetUSD: number;
  status: string;
  createdAt: string;
  receipts?: PayrollReceipt[];
}

export interface PayrollReceipt {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    idDocType: string;
    idDocNumber: string;
    position?: JobPosition;
  };
  baseSalaryUSD: number;
  bonusAmountUSD: number;
  deductionsUSD: number;
  advancesUSD: number;
  netSalaryUSD: number;
  netSalaryVES: number;
  exchangeRate: number;
  status: string;
  notes?: string | null;
  createdAt: string;
}
