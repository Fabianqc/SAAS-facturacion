'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Plus,
  Trash2,
  Building2,
  Barcode,
  Save,
  AlertCircle,
  Boxes,
} from 'lucide-react';
import { Product, Category, TaxType } from '../types/product';
import { Supplier } from '../types/purchase';

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  bcvUsd: number;
  bcvEur: number;
  token: string;
}

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

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  products,
  categories,
  suppliers,
  bcvUsd,
  bcvEur,
  token,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [rifType, setRifType] = useState<'J' | 'V' | 'E' | 'G'>('J');
  const [rifNumber, setRifNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ItemRow[]>([
    {
      sku: '',
      name: '',
      unit: 'PZA',
      receivedUnit: 'PZA',
      unitsPerPackage: 1,
      isPackaged: false,
      quantity: 10,
      costUnitUSD: 1.0,
      salePriceUSD: 1.4,
      taxType: 'GENERAL_16',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSupplierId('');
      setRifType('J');
      setRifNumber('');
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setInvoiceNumber('');
      setControlNumber('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setItems([
        {
          sku: '',
          name: '',
          unit: 'PZA',
          receivedUnit: 'PZA',
          unitsPerPackage: 1,
          isPackaged: false,
          quantity: 10,
          costUnitUSD: 1.0,
          salePriceUSD: 1.4,
          taxType: 'GENERAL_16',
        },
      ]);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    if (!supId) {
      setRifNumber('');
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
      return;
    }
    const found = suppliers.find((s) => s.id === supId);
    if (found) {
      setRifType(found.rifType as any);
      setRifNumber(found.rifNumber);
      setSupplierName(found.name);
      setSupplierPhone(found.phone || '');
      setSupplierEmail(found.email || '');
    }
  };

  const addRow = () => {
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
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId' && value) {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        const hasPkg = Boolean(prod.packagingUnit && prod.unitsPerPackage && prod.unitsPerPackage > 1);
        updated[index].sku = prod.sku;
        updated[index].name = prod.name;
        updated[index].barcode = prod.barcode || '';
        updated[index].categoryId = prod.categoryId || '';
        updated[index].unit = prod.unit;
        updated[index].receivedUnit = hasPkg ? prod.packagingUnit! : prod.unit;
        updated[index].unitsPerPackage = prod.unitsPerPackage || 1;
        updated[index].isPackaged = hasPkg;
        updated[index].costUnitUSD = hasPkg ? prod.costPriceUSD * (prod.unitsPerPackage || 1) : prod.costPriceUSD;
        updated[index].salePriceUSD = prod.salePriceUSD;
        updated[index].taxType = prod.taxType;
      }
    }

    if (field === 'receivedUnit') {
      const isPkg = value !== 'PZA' && value !== 'KG' && value !== 'LT' && value !== 'MTR';
      updated[index].isPackaged = isPkg;
    }

    setItems(updated);
  };

  let subtotalUSD = 0;
  let taxTotalUSD = 0;

  items.forEach((item) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0;
    const cost = typeof item.costUnitUSD === 'number' ? item.costUnitUSD : 0;
    const lineSub = qty * cost;

    let taxRate = 0;
    if (item.taxType === 'GENERAL_16') taxRate = 0.16;
    else if (item.taxType === 'REDUCIDO_8') taxRate = 0.08;

    const lineTax = lineSub * taxRate;

    subtotalUSD += lineSub;
    taxTotalUSD += lineTax;
  });

  const totalUSD = subtotalUSD + taxTotalUSD;
  const totalVES = totalUSD * bcvUsd;
  const totalEUR = bcvEur > 0 ? totalVES / bcvEur : 0;

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

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        supplierId: selectedSupplierId || undefined,
        supplierRifType: rifType,
        supplierRifNumber: rifNumber.trim(),
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim() || undefined,
        supplierEmail: supplierEmail.trim() || undefined,
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

      const res = await fetch('http://localhost:3001/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al procesar la factura de compra');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-6xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-xl relative my-8 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ingreso por Factura de Compra (Proveedores & Empaques)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra la factura del proveedor en Cajas/Bultos o Unidades sueltas con desglose automático al inventario.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: PROVEEDOR Y FACTURA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            {/* Datos del Proveedor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Proveedor Emisor
                </h4>

                {suppliers.length > 0 && (
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
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

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tipo RIF
                  </label>
                  <select
                    value={rifType}
                    onChange={(e) => setRifType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                  placeholder="Distribuidora Central C.A."
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="0212-0000000"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo</label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Datos de la Factura */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Factura de Proveedor
                </h4>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Tasa BCV: {bcvUsd.toFixed(2)} Bs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Notas de Recepción
                </label>
                <textarea
                  rows={2}
                  placeholder="Lote, condiciones de entrega o guía de transporte..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: RENGLONES */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Renglones a Ingresar ({items.length})
              </h4>

              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Renglón</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5 w-44">Producto Existente</th>
                    <th className="p-2.5 w-24">SKU</th>
                    <th className="p-2.5">Nombre</th>
                    <th className="p-2.5 w-28">Presentación / Empaque</th>
                    <th className="p-2.5 w-20">Cant.</th>
                    <th className="p-2.5 w-24">Costo ($)</th>
                    <th className="p-2.5 w-20">IVA</th>
                    <th className="p-2.5 w-24">P. Venta ($)</th>
                    <th className="p-2.5 w-24 text-right">Subtotal ($)</th>
                    <th className="p-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  {items.map((row, index) => {
                    const rowQty = typeof row.quantity === 'number' ? row.quantity : 0;
                    const rowCost = typeof row.costUnitUSD === 'number' ? row.costUnitUSD : 0;
                    const rowTotal = rowQty * rowCost;
                    const isPkg = row.isPackaged && row.unitsPerPackage > 1;
                    const totalUnits = isPkg ? rowQty * row.unitsPerPackage : rowQty;
                    const derivedUnitCost = isPkg && row.unitsPerPackage > 0 ? (rowCost / row.unitsPerPackage).toFixed(2) : rowCost.toFixed(2);

                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {/* Selector de producto existente */}
                        <td className="p-2">
                          <select
                            value={row.productId || ''}
                            onChange={(e) => updateRow(index, 'productId', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="">-- Nuevo / Manual --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.sku} - {p.name} {p.unitsPerPackage && p.unitsPerPackage > 1 ? `(${p.packagingUnit || 'CAJA'} x${p.unitsPerPackage})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* SKU */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="SKU-001"
                            value={row.sku}
                            onChange={(e) => updateRow(index, 'sku', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none"
                          />
                        </td>

                        {/* Nombre & conversion badge */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="Nombre del producto"
                            value={row.name}
                            onChange={(e) => updateRow(index, 'name', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          {isPkg && (
                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block mt-0.5 font-bold">
                              📦 {rowQty} {row.receivedUnit} (x{row.unitsPerPackage}) ➜ Ingresarán {totalUnits} {row.unit} a ${derivedUnitCost} c/u
                            </span>
                          )}
                        </td>

                        {/* Presentación / Empaque */}
                        <td className="p-2">
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
                        <td className="p-2">
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
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                          />
                        </td>

                        {/* Costo de compra */}
                        <td className="p-2">
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
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white text-right focus:outline-none"
                          />
                        </td>

                        {/* IVA */}
                        <td className="p-2">
                          <select
                            value={row.taxType}
                            onChange={(e) => updateRow(index, 'taxType', e.target.value as TaxType)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="GENERAL_16">16%</option>
                            <option value="REDUCIDO_8">8%</option>
                            <option value="EXENTO_0">0%</option>
                          </select>
                        </td>

                        {/* Precio de venta sugerido */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Auto"
                            value={row.salePriceUSD}
                            onChange={(e) =>
                              updateRow(
                                index,
                                'salePriceUSD',
                                e.target.value === '' ? '' : parseFloat(e.target.value),
                              )
                            }
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 text-right focus:outline-none"
                          />
                        </td>

                        {/* Subtotal fila */}
                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${rowTotal.toFixed(2)}
                        </td>

                        {/* Eliminar fila */}
                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
                              className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 3: TOTALES FISCALES Y MULTI-MONEDA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                Impacto Fiscal SENIAT & Monedas
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Esta compra alimentará el libro de compras fiscales con crédito fiscal deducible a tasa oficial del BCV.
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tasa de Cambio Oficial:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{bcvUsd.toFixed(2)} Bs / USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total en Euros (€ BCV):</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">€{totalEUR.toFixed(2)} EUR</span>
                </div>
              </div>
            </div>

            {/* Cuadro de Totales */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Base Imponible:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${subtotalUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Crédito Fiscal IVA Total:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${taxTotalUSD.toFixed(2)} USD</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">TOTAL FACTURA ($ USD):</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                    ${totalUSD.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">TOTAL FACTURA (VES BCV):</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Procesando e Ingresando...' : 'Procesar Factura de Compra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
