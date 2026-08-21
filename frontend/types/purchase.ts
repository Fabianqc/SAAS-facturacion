import { TaxType } from './product';

export interface Supplier {
  id: string;
  rifType: 'V' | 'J' | 'E' | 'G' | 'P';
  rifNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  _count?: {
    purchaseInvoices: number;
  };
}

export interface PurchaseInvoiceItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  receivedUnit?: string | null;
  packageQuantity?: number | null;
  unitsPerPackage?: number;
  costUnitUSD: number;
  costUnitVES: number;
  taxType: TaxType;
  taxRate: number;
  taxAmountUSD: number;
  taxAmountVES: number;
  totalUSD: number;
  totalVES: number;
}

export interface PurchaseInvoice {
  id: string;
  tenantId: string;
  storeId: string;
  supplierId: string;
  supplier: Supplier;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  invoiceNumber: string;
  controlNumber?: string | null;
  invoiceDate: string;
  exchangeRate: number;
  subtotalUSD: number;
  subtotalVES: number;
  taxTotalUSD: number;
  taxTotalVES: number;
  totalUSD: number;
  totalVES: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  items: PurchaseInvoiceItem[];
}
