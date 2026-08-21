'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '../../../../components/RoleGuard';
import { Navbar } from '../../../../components/Navbar';
import { Sidebar, SidebarAction } from '../../../../components/Sidebar';
import { ProductPickerModal } from '../../../../components/ProductPickerModal';
import { useBcvRates, useProducts, useCategories, useSuppliers, useCreatePurchase } from '../../../../hooks/useApi';
import { Product, TaxType } from '../../../../types/product';
import {
  FileSpreadsheet,
  Building2,
  Barcode,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Calculator,
  Receipt,
  Search,
  Package,
} from 'lucide-react';

interface ItemRow {
  productId?: string;
  sku: string;
  name: string;
  barcode?: string;
  categoryId?: string;
  unit: string;
  receivedUnit: string;
  unitsPerPackage: number;
  isPackaged: boolean;
  quantity: number | '';
  costUnitUSD: number | '';
  salePriceUSD: number | '';
  taxType: TaxType;
}

const PACKAGING_UNITS = ['PZA', 'CAJA', 'BULTO', 'FARDO', 'DISPLAY', 'DOCENA', 'PACK', 'KG', 'LT', 'MTR'];

function NewPurchaseInvoiceContent() {
  const router = useRouter();

  // React Query Hooks with exponential backoff & randomized jitter
  const { data: bcvRates } = useBcvRates();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const createPurchaseMutation = useCreatePurchase();

  const bcvUsd = bcvRates?.usd || 775.3356;
  const bcvEur = bcvRates?.eur || 897.8231;

  // Supplier Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [rifType, setRifType] = useState<'J' | 'V' | 'E' | 'G'>('J');
  const [rifNumber, setRifNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');

  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Invoice Items
  const [items, setItems] = useState<ItemRow[]>([
    {
      sku: '',
      name: '',
      unit: 'PZA',
      receivedUnit: 'PZA',
      unitsPerPackage: 1,
      isPackaged: false,
      quantity: 10,
      costUnitUSD: 2.1,
      salePriceUSD: 2.95,
      taxType: 'GENERAL_16',
    },
  ]);

  // Product Picker Modal State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeRowIndexForPicker, setActiveRowIndexForPicker] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    if (!supId) {
      setRifNumber('');
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setSupplierAddress('');
      return;
    }
    const found = suppliers.find((s) => s.id === supId);
    if (found) {
      setRifType(found.rifType as any);
      setRifNumber(found.rifNumber);
      setSupplierName(found.name);
      setSupplierPhone(found.phone || '');
      setSupplierEmail(found.email || '');
      setSupplierAddress(found.address || '');
    }
  };

  const openPickerForRow = (rowIndex: number) => {
    setActiveRowIndexForPicker(rowIndex);
    setIsPickerOpen(true);
  };

  const handleProductPicked = (prod: Product) => {
    if (activeRowIndexForPicker === null) return;
    const index = activeRowIndexForPicker;
    const hasPkg = Boolean(prod.packagingUnit && prod.unitsPerPackage && prod.unitsPerPackage > 1);

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      barcode: prod.barcode || '',
      categoryId: prod.categoryId || '',
      unit: prod.unit,
      receivedUnit: hasPkg ? prod.packagingUnit! : prod.unit,
      unitsPerPackage: prod.unitsPerPackage || 1,
      isPackaged: hasPkg,
      costUnitUSD: hasPkg ? prod.costPriceUSD * (prod.unitsPerPackage || 1) : prod.costPriceUSD,
      salePriceUSD: prod.salePriceUSD,
      taxType: prod.taxType,
    };
    setItems(updated);
  };

  const handleManualProductPicked = (manualData: {
    sku: string;
    name: string;
    unit: string;
    costPriceUSD: number;
    salePriceUSD: number;
  }) => {
    if (activeRowIndexForPicker === null) return;
    const index = activeRowIndexForPicker;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: undefined,
      sku: manualData.sku,
      name: manualData.name,
      unit: manualData.unit,
      receivedUnit: manualData.unit,
      unitsPerPackage: 1,
      isPackaged: false,
      costUnitUSD: manualData.costPriceUSD,
      salePriceUSD: manualData.salePriceUSD,
    };
    setItems(updated);
  };

  const addRow = () => {
    const newIdx = items.length;
    setItems([
      ...items,
      {
        sku: '',
        name: '',
        unit: 'PZA',
        receivedUnit: 'PZA',
        unitsPerPackage: 1,
        isPackaged: false,
        quantity: 1,
        costUnitUSD: 1.0,
        salePriceUSD: 1.4,
        taxType: 'GENERAL_16',
      },
    ]);
    openPickerForRow(newIdx);
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'receivedUnit') {
      const isPkg = value !== 'PZA' && value !== 'KG' && value !== 'LT' && value !== 'MTR';
      updated[index].isPackaged = isPkg;
    }

    setItems(updated);
  };

  // Financial Calculations & Real-Time Profit/Loss Analysis
  let totalCostUSD = 0;
  let totalTaxUSD = 0;
  let projectedGrossSalesUSD = 0;
  let hasAnyLoss = false;

  const analyzedRows = items.map((row) => {
    const qty = typeof row.quantity === 'number' ? row.quantity : 0;
    const cost = typeof row.costUnitUSD === 'number' ? row.costUnitUSD : 0;
    const sale = typeof row.salePriceUSD === 'number' ? row.salePriceUSD : 0;

    const isPkg = row.isPackaged && row.unitsPerPackage > 1;
    const factor = isPkg ? row.unitsPerPackage : 1;
    const totalPhysicalUnits = qty * factor;

    // Derived unit cost vs unit sale price
    const unitCost = isPkg && factor > 0 ? cost / factor : cost;
    const unitSale = sale;

    const rowSubtotalCostUSD = qty * cost;
    let taxRate = 0;
    if (row.taxType === 'GENERAL_16') taxRate = 0.16;
    else if (row.taxType === 'REDUCIDO_8') taxRate = 0.08;

    const rowTaxUSD = rowSubtotalCostUSD * taxRate;
    const rowTotalCostUSD = rowSubtotalCostUSD + rowTaxUSD;

    // Profit / Loss calculation
    const unitProfitUSD = unitSale - unitCost;
    const marginPercent = unitCost > 0 ? (unitProfitUSD / unitCost) * 100 : 100;
    const rowProjectedSalesUSD = totalPhysicalUnits * unitSale;
    const rowProjectedProfitUSD = rowProjectedSalesUSD - rowSubtotalCostUSD;
    const isLoss = unitProfitUSD < 0;

    if (isLoss) hasAnyLoss = true;

    totalCostUSD += rowSubtotalCostUSD;
    totalTaxUSD += rowTaxUSD;
    projectedGrossSalesUSD += rowProjectedSalesUSD;

    return {
      ...row,
      qty,
      cost,
      sale,
      isPkg,
      factor,
      totalPhysicalUnits,
      unitCost,
      unitSale,
      rowSubtotalCostUSD,
      rowTaxUSD,
      rowTotalCostUSD,
      unitProfitUSD,
      marginPercent,
      rowProjectedSalesUSD,
      rowProjectedProfitUSD,
      isLoss,
    };
  });

  const totalInvoiceUSD = totalCostUSD + totalTaxUSD;
  const totalInvoiceVES = totalInvoiceUSD * bcvUsd;
  const totalInvoiceEUR = bcvEur > 0 ? totalInvoiceVES / bcvEur : 0;

  const totalProjectedProfitUSD = projectedGrossSalesUSD - totalCostUSD;
  const overallMarginPercent = totalCostUSD > 0 ? (totalProjectedProfitUSD / totalCostUSD) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rifNumber.trim()) {
      setErrorMsg('El RIF del proveedor es obligatorio');
      return;
    }
    if (!supplierName.trim()) {
      setErrorMsg('La Razón Social del proveedor es obligatoria');
      return;
    }
    if (!invoiceNumber.trim()) {
      setErrorMsg('El N° de Factura física del proveedor es obligatorio');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Debe agregar al menos un producto');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.sku.trim()) {
        setErrorMsg(`Renglón ${i + 1}: El código SKU es obligatorio`);
        return;
      }
      if (!row.name.trim()) {
        setErrorMsg(`Renglón ${i + 1}: El nombre del producto es obligatorio`);
        return;
      }
      if (typeof row.quantity !== 'number' || row.quantity <= 0) {
        setErrorMsg(`Renglón ${i + 1}: La cantidad debe ser mayor a 0`);
        return;
      }
      if (typeof row.costUnitUSD !== 'number' || row.costUnitUSD < 0) {
        setErrorMsg(`Renglón ${i + 1}: El costo unitario debe ser válido`);
        return;
      }
    }

    setErrorMsg(null);

    const payload = {
      supplierId: selectedSupplierId || undefined,
      supplierRifType: rifType,
      supplierRifNumber: rifNumber.trim(),
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim() || undefined,
      supplierEmail: supplierEmail.trim() || undefined,
      supplierAddress: supplierAddress.trim() || undefined,
      invoiceNumber: invoiceNumber.trim().toUpperCase(),
      controlNumber: controlNumber.trim() || undefined,
      invoiceDate,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        productId: it.productId || undefined,
        sku: it.sku.trim().toUpperCase(),
        barcode: it.barcode?.trim() || undefined,
        name: it.name.trim(),
        categoryId: it.categoryId || undefined,
        unit: it.unit || 'PZA',
        receivedUnit: it.receivedUnit || 'PZA',
        unitsPerPackage: it.unitsPerPackage || 1,
        isPackaged: it.isPackaged,
        quantity: Number(it.quantity),
        costUnitUSD: Number(it.costUnitUSD),
        salePriceUSD: typeof it.salePriceUSD === 'number' ? it.salePriceUSD : undefined,
        taxType: it.taxType,
      })),
    };

    createPurchaseMutation.mutate(payload, {
      onSuccess: () => {
        router.push('/adminnegocio');
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al procesar la factura de compra');
      },
    });
  };

  const handleSidebarAction = (action: SidebarAction) => {
    if (action === 'catalog') {
      router.push('/adminnegocio');
    } else if (action === 'openInventory' || action === 'openStockModal') {
      router.push('/adminnegocio/inventario');
    } else if (action === 'openNewProduct') {
      router.push('/adminnegocio/productos/nuevo');
    } else if (action === 'openProfitLoss') {
      router.push('/adminnegocio/rentabilidad');
    } else if (action === 'openHrPayroll') {
      router.push('/adminnegocio/rrhh');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar onAction={handleSidebarAction} activeItem="openPurchaseModal" bcvUsd={bcvUsd} />

        {/* MAIN PURCHASE INVOICE HUB */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <button
                onClick={() => router.push('/adminnegocio')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Catálogo y Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Ingreso por Factura de Compra (Proveedores & Empaques)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alimentación de inventario con análisis en tiempo real de **Ganancias y Pérdidas** por renglón y crédito fiscal SENIAT.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/adminnegocio')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
              >
                Descartar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={createPurchaseMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{createPurchaseMutation.isPending ? 'Procesando...' : 'Procesar e Ingresar a Inventario'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {hasAnyLoss && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                ⚠️ <strong>Atención:</strong> Uno o más productos tienen un <strong>Precio de Venta inferior al Costo de Adquisición</strong>. Revise las alertas en rojo en la tabla.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: PROVEEDOR Y FACTURA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Proveedor Emisor (6 Cols) */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 1. Proveedor Emisor
                  </h3>

                  {suppliers.length > 0 && (
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => handleSupplierSelect(e.target.value)}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">-- Proveedor Frecuente --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.rifType}-{s.rifNumber} • {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tipo RIF
                    </label>
                    <select
                      value={rifType}
                      onChange={(e) => setRifType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="J">J - Jurídico</option>
                      <option value="V">V - Venezolano</option>
                      <option value="E">E - Extranjero</option>
                      <option value="G">G - Gubernamental</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Número de RIF <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123456789"
                      value={rifNumber}
                      onChange={(e) => setRifNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Razón Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Distribuidora Polar / Colgate C.A."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
                    <input
                      type="text"
                      placeholder="0212-0000000"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo</label>
                    <input
                      type="email"
                      placeholder="ventas@proveedor.com"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Datos de la Factura (6 Cols) */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 2. Comprobante Fiscal del Proveedor
                  </h3>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    BCV: {bcvUsd.toFixed(2)} Bs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      N° de Factura <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="FAC-009842"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      N° de Control SENIAT
                    </label>
                    <input
                      type="text"
                      placeholder="00-001234"
                      value={controlNumber}
                      onChange={(e) => setControlNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Emisión de Factura
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Notas de Recepción / Guía de Transporte
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Lote, condiciones de entrega, chófer o guía SADA..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: RENGLONES CON ANÁLISIS DE GANANCIA / PÉRDIDA */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-purple-600" /> 3. Renglones de la Factura & Análisis de Rentabilidad ({items.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buscador de productos optimizado para catálogos masivos con análisis en tiempo real de margen comercial
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Producto a Factura</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-56">Producto Seleccionado</th>
                      <th className="p-3 w-28">SKU</th>
                      <th className="p-3">Nombre & Conversión</th>
                      <th className="p-3 w-32">Empaque / Presentación</th>
                      <th className="p-3 w-20">Cant.</th>
                      <th className="p-3 w-24">Costo ($)</th>
                      <th className="p-3 w-20">IVA</th>
                      <th className="p-3 w-24">P. Venta ($)</th>
                      <th className="p-3 w-48">Rentabilidad & Margen</th>
                      <th className="p-3 w-24 text-right">Subtotal ($)</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                    {analyzedRows.map((row, index) => (
                      <tr key={index} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${row.isLoss ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                        {/* Selector con Buscador Rápido (ProductPicker) */}
                        <td className="p-2.5">
                          {row.name ? (
                            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <div className="truncate pr-1">
                                <span className="font-bold text-[11px] text-slate-900 dark:text-white block truncate">
                                  {row.name}
                                </span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                                  {row.sku}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => openPickerForRow(index)}
                                title="Cambiar producto"
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0"
                              >
                                <Search className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPickerForRow(index)}
                              className="w-full py-2 px-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Buscar / Crear</span>
                            </button>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            placeholder="SKU-001"
                            value={row.sku}
                            onChange={(e) => updateRow(index, 'sku', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Nombre & Packaging conversion */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            placeholder="Nombre del producto"
                            value={row.name}
                            onChange={(e) => updateRow(index, 'name', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                          />
                          {row.isPkg && (
                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block mt-1 font-bold">
                              📦 {row.qty} {row.receivedUnit} (x{row.unitsPerPackage}) ➜ Ingresarán {row.totalPhysicalUnits} {row.unit} a ${row.unitCost.toFixed(2)} c/u
                            </span>
                          )}
                        </td>

                        {/* Presentación / Empaque */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <select
                              value={row.receivedUnit}
                              onChange={(e) => updateRow(index, 'receivedUnit', e.target.value)}
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                            >
                              {PACKAGING_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>

                            {row.isPackaged && (
                              <input
                                type="number"
                                min="2"
                                title="Unidades por empaque"
                                placeholder="x6"
                                value={row.unitsPerPackage}
                                onChange={(e) => updateRow(index, 'unitsPerPackage', parseInt(e.target.value) || 1)}
                                className="w-12 bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700 rounded-lg p-1 text-center font-mono font-bold text-xs text-purple-700 dark:text-purple-300"
                              />
                            )}
                          </div>
                        </td>

                        {/* Cantidad recibida */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            required
                            value={row.quantity}
                            onChange={(e) =>
                              updateRow(
                                index,
                                'quantity',
                                e.target.value === '' ? '' : parseFloat(e.target.value),
                              )
                            }
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Costo de compra */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={row.costUnitUSD}
                            onChange={(e) =>
                              updateRow(
                                index,
                                'costUnitUSD',
                                e.target.value === '' ? '' : parseFloat(e.target.value),
                              )
                            }
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white text-right focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* IVA */}
                        <td className="p-2.5">
                          <select
                            value={row.taxType}
                            onChange={(e) => updateRow(index, 'taxType', e.target.value as TaxType)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="GENERAL_16">16%</option>
                            <option value="REDUCIDO_8">8%</option>
                            <option value="EXENTO_0">0%</option>
                          </select>
                        </td>

                        {/* Precio de venta sugerido */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={row.salePriceUSD}
                            onChange={(e) =>
                              updateRow(
                                index,
                                'salePriceUSD',
                                e.target.value === '' ? '' : parseFloat(e.target.value),
                              )
                            }
                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs font-mono font-bold text-right focus:outline-none ${
                              row.isLoss
                                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50'
                                : 'border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400'
                            }`}
                          />
                        </td>

                        {/* ANÁLISIS DE GANANCIA / PÉRDIDA EN TIEMPO REAL */}
                        <td className="p-2.5">
                          {row.isLoss ? (
                            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[10px] space-y-0.5">
                              <div className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300">
                                <TrendingDown className="w-3 h-3 text-rose-600" />
                                <span>PÉRDIDA: {row.marginPercent.toFixed(1)}%</span>
                              </div>
                              <span className="text-rose-600 dark:text-rose-400 block font-mono">
                                -${Math.abs(row.unitProfitUSD).toFixed(2)}/u ({row.rowProjectedProfitUSD < 0 ? `-$${Math.abs(row.rowProjectedProfitUSD).toFixed(2)} lote` : ''})
                              </span>
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] space-y-0.5">
                              <div className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                                <span>+{row.marginPercent.toFixed(1)}% Margen</span>
                              </div>
                              <span className="text-emerald-700 dark:text-emerald-300 block font-mono">
                                +${row.unitProfitUSD.toFixed(2)}/u (+${row.rowProjectedProfitUSD.toFixed(2)} lote)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Subtotal fila */}
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${row.rowSubtotalCostUSD.toFixed(2)}
                        </td>

                        {/* Eliminar fila */}
                        <td className="p-2.5 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN 3: PROYECCIÓN FINANCIERA Y TOTALES FISCALES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Proyección de Utilidad y Retorno (6 Cols) */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" /> Proyección Comercial de la Compra
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Venta Bruta Proyectada:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                      ${projectedGrossSalesUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ≈ {(projectedGrossSalesUSD * bcvUsd).toLocaleString('es-VE')} VES
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Utilidad Bruta Proyectada:</span>
                    <span
                      className={`font-mono font-extrabold text-base ${
                        totalProjectedProfitUSD >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      {totalProjectedProfitUSD >= 0 ? `+$${totalProjectedProfitUSD.toFixed(2)}` : `-$${Math.abs(totalProjectedProfitUSD).toFixed(2)}`} USD
                    </span>
                    <span className="text-[10px] font-mono block font-bold text-slate-500">
                      {overallMarginPercent.toFixed(1)}% Margen Global
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Tasa Oficial BCV Aplicada:</span>
                    <span className="font-mono">{bcvUsd.toFixed(2)} Bs / USD</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Equivalente en Euros (€ BCV):</span>
                    <span className="font-mono">€{totalInvoiceEUR.toFixed(2)} EUR</span>
                  </div>
                </div>
              </div>

              {/* Totales Fiscales Factura (6 Cols) */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Liquidación Fiscal SENIAT
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal Base Imponible:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ${totalCostUSD.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Crédito Fiscal IVA Total:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ${totalTaxUSD.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">TOTAL FACTURA ($ USD):</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xl">
                        ${totalInvoiceUSD.toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">TOTAL FACTURA (VES BCV):</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                        {totalInvoiceVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Searchable Product Picker Modal */}
          <ProductPickerModal
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelectProduct={handleProductPicked}
            onSelectNewManual={handleManualProductPicked}
            products={products}
            categories={categories}
          />
        </main>
      </div>
    </div>
  );
}

export default function NewPurchaseInvoicePage() {
  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando módulo de compra...</div>}>
        <NewPurchaseInvoiceContent />
      </Suspense>
    </RoleGuard>
  );
}
