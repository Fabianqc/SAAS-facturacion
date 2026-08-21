'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Package,
  Plus,
  Boxes,
  Barcode,
  Check,
  Tag,
  DollarSign,
} from 'lucide-react';
import { Product, Category } from '../types/product';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectNewManual: (manualData: { sku: string; name: string; unit: string; costPriceUSD: number; salePriceUSD: number }) => void;
  products: Product[];
  categories: Category[];
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectNewManual,
  products,
  categories,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Manual Quick Creator State
  const [manualSku, setManualSku] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualUnit, setManualUnit] = useState('PZA');
  const [manualCost, setManualCost] = useState<number | ''>(1.0);
  const [manualSale, setManualSale] = useState<number | ''>(1.4);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.includes(term));

      const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const handleCreateManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim() || !manualName.trim()) return;

    onSelectNewManual({
      sku: manualSku.trim().toUpperCase(),
      name: manualName.trim(),
      unit: manualUnit,
      costPriceUSD: typeof manualCost === 'number' ? manualCost : 0,
      salePriceUSD: typeof manualSale === 'number' ? manualSale : 0,
    });
    setIsCreatingManual(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isCreatingManual ? 'Crear Nuevo Producto en Caliente' : 'Seleccionar Producto del Catálogo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCreatingManual
                  ? 'Completa los datos básicos para agregarlo a la factura e inventario'
                  : `Búsqueda rápida entre ${products.length} productos disponibles`}
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

        {!isCreatingManual ? (
          <>
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar por SKU, nombre, código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-44 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  setManualSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
                  setManualName(searchTerm);
                  setIsCreatingManual(true);
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo</span>
              </button>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-semibold">No se encontraron productos con "{searchTerm}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setManualSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
                      setManualName(searchTerm);
                      setIsCreatingManual(true);
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    ¿Deseas crearlo como producto nuevo?
                  </button>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const hasPkg = Boolean(p.packagingUnit && p.unitsPerPackage && p.unitsPerPackage > 1);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="p-3.5 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 group-hover:underline">
                            {p.sku}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          {p.categoryName && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                              {p.categoryName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Unidad: <strong className="font-mono">{p.unit}</strong></span>
                          {hasPkg && (
                            <span className="text-purple-600 dark:text-purple-400 font-semibold font-mono">
                              📦 {p.packagingUnit} (x{p.unitsPerPackage} {p.unit})
                            </span>
                          )}
                          <span>Stock: <strong className="font-mono">{p.currentStock}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5">
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 block">
                          ${p.costPriceUSD.toFixed(2)} Costo
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          P. Venta: ${p.salePriceUSD.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Quick Manual Product Creator */
          <form onSubmit={handleCreateManualSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Código SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Unidad de Venta
                </label>
                <select
                  value={manualUnit}
                  onChange={(e) => setManualUnit(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="PZA">PZA - Pieza / Unidad</option>
                  <option value="KG">KG - Kilogramos</option>
                  <option value="LT">LT - Litros</option>
                  <option value="MTR">MTR - Metros</option>
                  <option value="CAJA">CAJA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nombre del Producto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Jabón Líquido Antibacterial 500ml"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Costo de Compra ($ USD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={manualCost}
                  onChange={(e) => setManualCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Precio de Venta Sugerido ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualSale}
                  onChange={(e) => setManualSale(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingManual(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Volver a la Lista
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Agregar a la Factura
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
