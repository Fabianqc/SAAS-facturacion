export type TaxType = 'GENERAL_16' | 'REDUCIDO_8' | 'EXENTO_0';
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
export type ProductUnitType = 'COUNT' | 'WEIGHT' | 'VOLUME' | 'LENGTH' | 'SERVICE';

export interface Category {
  id: string;
  name: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName?: string;
  category?: Category;
  costPriceUSD: number;
  salePriceUSD: number;
  currencyOrigin?: 'USD' | 'VES';
  costPriceVES?: number;
  salePriceVES: number;
  salePriceEUR: number;
  profitUSD: number;
  marginPercent: number;
  taxType: TaxType;
  taxPercent: number;
  unit: string;
  unitType?: ProductUnitType;
  packagingUnit?: string | null;
  unitsPerPackage?: number;
  packageBarcode?: string | null;
  allowDecimals?: boolean;
  brand?: string | null;
  location?: string | null;
  minStock: number;
  currentStock: number;
  isLowStock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  userId: string;
  type: MovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  store?: {
    name: string;
  };
}
