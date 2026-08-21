'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Search,
  Receipt,
  Eye,
} from 'lucide-react';
import { PurchaseInvoice } from '../types/purchase';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  bcvUsd: number;
}

export const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({
  isOpen,
  onClose,
  token,
  bcvUsd,
}) => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  const fetchPurchases = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error('Error fetching purchases:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedInvoice(null);
      fetchPurchases();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(term) ||
      (inv.controlNumber && inv.controlNumber.toLowerCase().includes(term)) ||
      inv.supplier.name.toLowerCase().includes(term) ||
      inv.supplier.rifNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-5xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-xl relative my-8 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Facturas de Compra & Proveedores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoría histórica de compras, costos registrados y trazabilidad fiscal.
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

        {/* Búsqueda */}
        {!selectedInvoice && (
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por N° factura, proveedor o RIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {filteredInvoices.length} Comprobantes
            </span>
          </div>
        )}

        {/* VISTA DETALLE */}
        {selectedInvoice ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-all"
              >
                ← Volver al listado de facturas
              </button>

              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                RECIBIDA
              </span>
            </div>

            {/* Cabecera */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Proveedor:</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedInvoice.supplier.rifType}-{selectedInvoice.supplier.rifNumber}
                </p>
                <p className="text-slate-600 dark:text-slate-300">{selectedInvoice.supplier.name}</p>
                {selectedInvoice.supplier.phone && (
                  <p className="text-[10px] text-slate-400">Tel: {selectedInvoice.supplier.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Datos del Comprobante:</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  Factura: {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Control: {selectedInvoice.controlNumber || '-'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Fecha: {new Date(selectedInvoice.invoiceDate).toLocaleDateString('es-VE')}
                </p>
              </div>

              <div className="space-y-1 md:text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Total Factura:</span>
                <p className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${Number(selectedInvoice.totalUSD).toFixed(2)} USD
                </p>
                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  {Number(selectedInvoice.totalVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Tasa BCV: {Number(selectedInvoice.exchangeRate).toFixed(2)} Bs
                </span>
              </div>
            </div>

            {/* Renglones */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Productos Recibidos ({selectedInvoice.items?.length || 0})
              </h4>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Costo Unit. ($)</th>
                      <th className="p-3">IVA</th>
                      <th className="p-3 text-right">Total Renglón ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{item.sku}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{item.productName}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">+{item.quantity}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          ${Number(item.costUnitUSD).toFixed(2)}
                        </td>
                        <td className="p-3 text-[10px]">
                          {item.taxType === 'EXENTO_0' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">EXENTO</span>
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">IVA {item.taxRate}%</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-right">
                          ${Number(item.totalUSD).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-300">Notas:</strong> {selectedInvoice.notes}
              </div>
            )}
          </div>
        ) : (
          /* TABLA LISTADO */
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando facturas de compra...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No hay facturas de compra registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">N° Factura / Control</th>
                      <th className="p-3.5">Proveedor</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Renglones</th>
                      <th className="p-3.5">Tasa BCV</th>
                      <th className="p-3.5">Total ($ / Bs)</th>
                      <th className="p-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white block">{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400">
                            Ctrl: {inv.controlNumber || '-'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">{inv.supplier.name}</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                            {inv.supplier.rifType}-{inv.supplier.rifNumber}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(inv.invoiceDate).toLocaleDateString('es-VE')}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                            {inv.items?.length || 0} ítems
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 text-xs">
                          {Number(inv.exchangeRate).toFixed(2)} Bs
                        </td>

                        <td className="p-3.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block text-xs">
                            ${Number(inv.totalUSD).toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {Number(inv.totalVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 ml-auto transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
