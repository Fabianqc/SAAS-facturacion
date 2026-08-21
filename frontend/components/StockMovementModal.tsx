'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Sliders, History, Save, AlertCircle } from 'lucide-react';
import { Product, StockMovement, MovementType } from '../types/product';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: Product | null;
  storeId?: string;
  storeName?: string;
  token: string;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  product,
  storeId,
  storeName,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'history'>('adjust');
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<StockMovement[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!product) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`http://localhost:3001/api/products/${product.id}/movements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      setType('IN');
      setQuantity(1);
      setReason('');
      setErrorMsg(null);
      fetchHistory();
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentQty = product.currentStock;
  const numQty = typeof quantity === 'number' ? quantity : 0;
  let newEstimatedStock = currentQty;

  if (type === 'IN') newEstimatedStock = currentQty + numQty;
  else if (type === 'OUT') newEstimatedStock = Math.max(0, currentQty - numQty);
  else if (type === 'ADJUSTMENT') newEstimatedStock = numQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0 && type !== 'ADJUSTMENT') {
      setErrorMsg('La cantidad debe ser mayor a 0');
      return;
    }
    if (type === 'OUT' && numQty > currentQty) {
      setErrorMsg(`Stock insuficiente: No puedes retirar ${numQty} unidades cuando solo hay ${currentQty} en existencia`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`http://localhost:3001/api/products/${product.id}/stock-movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: storeId || 'default',
          type,
          quantity: numQty,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar el movimiento');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl relative text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {product.sku}
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{product.name}</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sucursal: <span className="font-semibold text-slate-700 dark:text-slate-200">{storeName || 'Sucursal Principal'}</span> • Stock Actual: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentQty} {product.unit}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'adjust' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Kardex / Historial ({history.length})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: FORM */}
        {activeTab === 'adjust' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Tipo de Movimiento
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setType('IN')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === 'IN'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Entrada (IN)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Compra o reposición</p>
                </button>

                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === 'OUT'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Salida (OUT)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Merma o daño</p>
                </button>

                <button
                  type="button"
                  onClick={() => setType('ADJUSTMENT')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === 'ADJUSTMENT'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Ajuste Físico</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Conteo directo</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {type === 'ADJUSTMENT' ? 'Nueva Existencia Total' : 'Cantidad a Procesar'} ({product.unit})
                </label>
                <input
                  type="number"
                  min={type === 'ADJUSTMENT' ? '0' : '1'}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Stock Resultante:</span>
                  <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {newEstimatedStock} {product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Variación:</span>
                  <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {type === 'IN' && `+${numQty}`}
                    {type === 'OUT' && `-${numQty}`}
                    {type === 'ADJUSTMENT' && `${newEstimatedStock - currentQty >= 0 ? '+' : ''}${newEstimatedStock - currentQty}`}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Motivo / Justificación
              </label>
              <input
                type="text"
                placeholder="Ej: Factura Prov N° 45892 / Conteo físico mensual"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Procesando...' : 'Confirmar Movimiento'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: KARDEX */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando movimientos...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No hay movimientos registrados para este producto.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Antes → Después</th>
                      <th className="p-3">Motivo</th>
                      <th className="p-3">Responsable</th>
                      <th className="p-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                    {history.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          {m.type === 'IN' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                              ENTRADA
                            </span>
                          )}
                          {m.type === 'OUT' && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-[10px] border border-rose-200 dark:border-rose-800">
                              SALIDA
                            </span>
                          )}
                          {m.type === 'ADJUSTMENT' && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
                              AJUSTE
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : m.quantity}
                        </td>
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                          {m.previousQty} → <strong className="text-slate-900 dark:text-white">{m.newQty}</strong>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={m.reason || ''}>
                          {m.reason || '-'}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">
                          {m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Sistema'}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {new Date(m.createdAt).toLocaleString('es-VE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
