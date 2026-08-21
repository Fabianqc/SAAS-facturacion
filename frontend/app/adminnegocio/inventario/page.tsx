'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '../../../components/RoleGuard';
import { Navbar } from '../../../components/Navbar';
import { Sidebar, SidebarAction } from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { Product, Category, StockMovement, MovementType } from '../../../types/product';
import {
  Boxes,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  History,
  Search,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Plus,
  ArrowLeft,
  Barcode,
  Store as StoreIcon,
  Calendar,
  User,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
  code: string;
  address?: string | null;
}

interface ExtendedStockMovement extends StockMovement {
  product?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    packagingUnit?: string | null;
    unitsPerPackage?: number | null;
  };
}

const ADJUSTMENT_CONCEPTS = [
  { id: 'CONTEO_FISICO', label: '📋 Ajuste por Conteo Físico / Inventario Cíclico', defaultType: 'ADJUSTMENT' },
  { id: 'MERMA_VENCIMIENTO', label: '⚠️ Merma por Vencimiento / Caducidad', defaultType: 'OUT' },
  { id: 'MERMA_DANO', label: '❌ Merma por Daño en Almacén / Empaque Roto', defaultType: 'OUT' },
  { id: 'CONSUMO_INTERNO', label: '🏢 Consumo Interno / Uso Operativo', defaultType: 'OUT' },
  { id: 'ENTRADA_EXTRAORDINARIA', label: '📥 Entrada Extraordinaria / Sobrante Justificado', defaultType: 'IN' },
  { id: 'DEVOLUCION_CLIENTE', label: '🔄 Devolución de Cliente', defaultType: 'IN' },
];

function InventoryPageContent() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [bcvUsd, setBcvUsd] = useState<number>(775.3356);
  const [bcvEur, setBcvEur] = useState<number>(897.8231);

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [movements, setMovements] = useState<ExtendedStockMovement[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'stocks' | 'kardex' | 'adjust'>('stocks');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Filters
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'OPTIMAL'>('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  // Adjustment Form State
  const [adjProductId, setAdjProductId] = useState<string>('');
  const [adjStoreId, setAdjStoreId] = useState<string>('');
  const [adjType, setAdjType] = useState<MovementType>('ADJUSTMENT');
  const [adjConcept, setAdjConcept] = useState<string>('CONTEO_FISICO');
  const [adjQuantity, setAdjQuantity] = useState<number | ''>(1);
  const [adjReason, setAdjReason] = useState<string>('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState<boolean>(false);
  const [adjError, setAdjError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. BCV Rates
      const bcvRes = await fetch('http://localhost:3001/api/bcv/current');
      if (bcvRes.ok) {
        const bcvData = await bcvRes.json();
        if (bcvData.usd) setBcvUsd(bcvData.usd);
        if (bcvData.eur) setBcvEur(bcvData.eur);
      }

      // 2. Products
      const prodRes = await fetch('http://localhost:3001/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
        if (prodData.length > 0 && !adjProductId) {
          setAdjProductId(prodData[0].id);
        }
      }

      // 3. Categories
      const catRes = await fetch('http://localhost:3001/api/products/categories/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // 4. Stores / Warehouses
      const storeRes = await fetch('http://localhost:3001/api/products/stores/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStores(storeData);
        if (storeData.length > 0 && !adjStoreId) {
          setAdjStoreId(storeData[0].id);
        }
      }

      // 5. Movements / Kardex
      const movRes = await fetch('http://localhost:3001/api/products/movements/all?limit=150', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (movRes.ok) {
        const movData = await movRes.json();
        setMovements(movData);
      }
    } catch (e) {
      console.error('Error cargando inventario:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Inventory Metrics & KPIs
  const totalUnits = useMemo(() => products.reduce((acc, p) => acc + p.currentStock, 0), [products]);
  const totalValuationUSD = useMemo(
    () => products.reduce((acc, p) => acc + p.costPriceUSD * p.currentStock, 0),
    [products],
  );
  const totalValuationVES = totalValuationUSD * bcvUsd;
  const lowStockCount = useMemo(() => products.filter((p) => p.isLowStock).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.currentStock === 0).length, [products]);

  // Filtered Products for Stocks Tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));

      const matchCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      let matchStock = true;
      if (stockLevelFilter === 'LOW') matchStock = p.isLowStock && p.currentStock > 0;
      if (stockLevelFilter === 'OUT') matchStock = p.currentStock === 0;
      if (stockLevelFilter === 'OPTIMAL') matchStock = !p.isLowStock && p.currentStock > 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, stockLevelFilter]);

  // Filtered Movements for Kardex Tab
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const prod = m.product;
      const matchSearch =
        searchTerm === '' ||
        (prod && (prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || prod.sku.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStore = selectedStoreId === 'ALL' || m.storeId === selectedStoreId;
      const matchType = movementTypeFilter === 'ALL' || m.type === movementTypeFilter;

      return matchSearch && matchStore && matchType;
    });
  }, [movements, searchTerm, selectedStoreId, movementTypeFilter]);

  // Handle Quick Adjustment Submission
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) {
      setAdjError('Seleccione un producto para ajustar');
      return;
    }
    if (typeof adjQuantity !== 'number' || adjQuantity <= 0) {
      setAdjError('La cantidad debe ser mayor a 0');
      return;
    }

    setIsSubmittingAdj(true);
    setAdjError(null);

    const selectedConceptObj = ADJUSTMENT_CONCEPTS.find((c) => c.id === adjConcept);
    const conceptLabel = selectedConceptObj ? selectedConceptObj.label : 'Ajuste de Stock';
    const finalReason = adjReason.trim() ? `${conceptLabel}: ${adjReason.trim()}` : conceptLabel;

    try {
      const res = await fetch(`http://localhost:3001/api/products/${adjProductId}/stock-movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: adjStoreId || stores[0]?.id,
          type: adjType,
          quantity: adjQuantity,
          reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar el movimiento');
      }

      setSyncNotice(`✅ Ajuste registrado exitosamente. Stock actualizado en Kardex.`);
      setTimeout(() => setSyncNotice(null), 5000);
      setAdjReason('');
      setAdjQuantity(1);
      fetchData();
      setActiveTab('kardex');
    } catch (err: any) {
      setAdjError(err.message || 'Error de conexión');
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  const handleConceptChange = (conceptId: string) => {
    setAdjConcept(conceptId);
    const found = ADJUSTMENT_CONCEPTS.find((c) => c.id === conceptId);
    if (found) {
      setAdjType(found.defaultType as MovementType);
    }
  };

  const handleSidebarAction = (action: SidebarAction) => {
    if (action === 'catalog') {
      router.push('/adminnegocio');
    } else if (action === 'openInventory' || action === 'openStockModal') {
      setActiveTab('stocks');
    } else if (action === 'openNewProduct') {
      router.push('/adminnegocio/productos/nuevo');
    } else if (action === 'openPurchaseModal') {
      router.push('/adminnegocio/compras/nueva');
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
        <Sidebar onAction={handleSidebarAction} activeItem="openStockModal" bcvUsd={bcvUsd} />

        {/* MAIN INVENTORY HUB */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Boxes className="w-3.5 h-3.5" />
                <span>Centro Especializado de Inventarios</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Control de Almacén, Existencias & Kardex
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Trazabilidad completa de entradas, salidas, mermas por vencimiento, conteos físicos y valoración bi-moneda.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push('/adminnegocio/productos/nuevo')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sliders className="w-4 h-4" />
                <span>Ajustar Stock / Merma</span>
              </button>
            </div>
          </div>

          {syncNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {/* Metric KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Unidades en Existencia</span>
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {totalUnits.toLocaleString('es-VE')} Unidades
              </span>
              <p className="text-xs text-slate-400 font-medium">{products.length} Artículos en Catálogo</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Valoración Total (Costo)</span>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ${totalValuationUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
              <p className="text-xs text-slate-400 font-mono">
                {totalValuationVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES (BCV {bcvUsd.toFixed(2)})
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Alertas de Reposición</span>
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{lowStockCount} Bajos</span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold font-mono">({outOfStockCount} Agotados)</span>
              </div>
              <p className="text-xs text-slate-400">Requieren orden de compra</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Almacenes & Sucursales</span>
                <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {stores.length || 1} Ubicación
              </span>
              <p className="text-xs text-slate-400 font-medium">
                {stores[0]?.name || 'Sucursal Las Mercedes'}
              </p>
            </div>
          </div>

          {/* TAB NAVIGATION BAR */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('stocks')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'stocks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Existencias por Almacén ({filteredProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('kardex')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'kardex'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Bitácora Kardex de Movimientos ({movements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('adjust')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'adjust'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Ajuste Rápido de Stock & Mermas</span>
            </button>
          </div>

          {/* TAB 1: EXISTENCIAS POR ALMACÉN */}
          {activeTab === 'stocks' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Existencias de Productos</h3>
                  <p className="text-xs text-slate-500">Consulta de unidades físicas, costos valorados y alertas de reposición</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search input */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar SKU, producto, código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Category filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Todas las Categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {/* Stock Level filter */}
                  <select
                    value={stockLevelFilter}
                    onChange={(e) => setStockLevelFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Todos los Niveles</option>
                    <option value="OPTIMAL">🟢 Nivel Óptimo</option>
                    <option value="LOW">⚠️ Stock Bajo</option>
                    <option value="OUT">❌ Agotados (0)</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Cargando existencias...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No se encontraron productos con los filtros seleccionados.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">SKU / Código</th>
                        <th className="p-3.5">Producto & Categoría</th>
                        <th className="p-3.5">Presentación</th>
                        <th className="p-3.5">Costo Unit. ($)</th>
                        <th className="p-3.5">Stock Físico</th>
                        <th className="p-3.5">Valoración ($ / Bs)</th>
                        <th className="p-3.5">Estado Stock</th>
                        <th className="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {filteredProducts.map((p) => {
                        const valuationUSD = p.costPriceUSD * p.currentStock;
                        const valuationVES = valuationUSD * bcvUsd;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white block">{p.sku}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.barcode || 'Sin código'}</span>
                            </td>

                            <td className="p-3.5">
                              <span className="font-semibold text-slate-900 dark:text-white block">{p.name}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block mt-0.5">
                                {p.categoryName || 'Sin Categoría'}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="font-mono font-semibold">{p.unit}</span>
                              {p.unitsPerPackage && p.unitsPerPackage > 1 && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
                                  1 {p.packagingUnit || 'CAJA'} = {p.unitsPerPackage} {p.unit}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                              ${p.costPriceUSD.toFixed(2)}
                            </td>

                            <td className="p-3.5">
                              <span className={`font-mono font-bold text-sm ${p.currentStock === 0 ? 'text-rose-600' : p.isLowStock ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                                {p.currentStock} {p.unit}
                              </span>
                              <span className="text-[10px] text-slate-400 block">Mín: {p.minStock}</span>
                            </td>

                            <td className="p-3.5">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                ${valuationUSD.toFixed(2)} USD
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {valuationVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                              </span>
                            </td>

                            <td className="p-3.5">
                              {p.currentStock === 0 ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-[10px] border border-rose-200 dark:border-rose-800">
                                  Agotado
                                </span>
                              ) : p.isLowStock ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
                                  Stock Bajo
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                  Óptimo
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setAdjProductId(p.id);
                                  setActiveTab('adjust');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                              >
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BITÁCORA KARDEX DE MOVIMIENTOS */}
          {activeTab === 'kardex' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Bitácora Kardex de Movimientos</h3>
                  <p className="text-xs text-slate-500">Historial inmutable de compras, ventas, mermas y ajustes de inventario</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar producto, motivo, SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Store Filter */}
                  {stores.length > 0 && (
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="ALL">Todas las Sucursales</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Movement Type Filter */}
                  <select
                    value={movementTypeFilter}
                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-semibold"
                  >
                    <option value="ALL">Todos los Movimientos</option>
                    <option value="IN">📥 Entradas (Compras / Ingresos)</option>
                    <option value="OUT">📤 Salidas (Ventas / Mermas)</option>
                    <option value="ADJUSTMENT">⚖️ Ajustes de Inventario</option>
                    <option value="TRANSFER">🔄 Transferencias</option>
                  </select>
                </div>
              </div>

              {filteredMovements.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No hay movimientos registrados con los filtros seleccionados.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Fecha & Hora</th>
                        <th className="p-3.5">Tipo</th>
                        <th className="p-3.5">Producto</th>
                        <th className="p-3.5">Almacén</th>
                        <th className="p-3.5">Stock Anterior</th>
                        <th className="p-3.5">Movimiento</th>
                        <th className="p-3.5">Stock Resultante</th>
                        <th className="p-3.5">Concepto / Motivo Auditado</th>
                        <th className="p-3.5">Usuario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {filteredMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString('es-VE')}
                          </td>

                          <td className="p-3.5">
                            {m.type === 'IN' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                ENTRADA
                              </span>
                            )}
                            {m.type === 'OUT' && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-[10px] border border-rose-200 dark:border-rose-800">
                                SALIDA / MERMA
                              </span>
                            )}
                            {m.type === 'ADJUSTMENT' && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
                                AJUSTE
                              </span>
                            )}
                            {m.type === 'TRANSFER' && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                                TRANSFERENCIA
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {m.product?.name || 'Producto'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {m.product?.sku}</span>
                          </td>

                          <td className="p-3.5 text-slate-500">
                            {m.store?.name || 'Sucursal'}
                          </td>

                          <td className="p-3.5 font-mono text-slate-500">{m.previousQty}</td>

                          <td className="p-3.5">
                            <span className={`font-mono font-bold ${m.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`} {m.product?.unit || 'PZA'}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {m.newQty}
                          </td>

                          <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs">
                            {m.reason || 'Sin motivo especificado'}
                          </td>

                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {m.user ? `${m.user.firstName} ${m.user.lastName || ''}` : 'Sistema'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AJUSTE RÁPIDO & MERMAS */}
          {activeTab === 'adjust' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-600" /> Registro de Ajuste Físico & Mermas
                </h3>
                <p className="text-xs text-slate-500">
                  Modifica las existencias justificando el concepto operativo para auditoría fiscal
                </p>
              </div>

              {adjError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adjError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAdjustment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Producto a Ajustar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={adjProductId}
                    onChange={(e) => setAdjProductId(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-purple-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name} (Stock Actual: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Concepto del Movimiento
                    </label>
                    <select
                      value={adjConcept}
                      onChange={(e) => handleConceptChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-purple-500"
                    >
                      {ADJUSTMENT_CONCEPTS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Operación
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setAdjType('IN')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          adjType === 'IN'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        + Entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjType('OUT')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          adjType === 'OUT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        - Salida / Merma
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjType('ADJUSTMENT')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          adjType === 'ADJUSTMENT'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        ⚖️ Fijar Conteo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cantidad ({adjType === 'ADJUSTMENT' ? 'Nuevo Stock Total' : 'Unidades a modificar'}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={adjQuantity}
                      onChange={(e) =>
                        setAdjQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Almacén / Sucursal
                    </label>
                    <select
                      value={adjStoreId}
                      onChange={(e) => setAdjStoreId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Justificación / Detalle de Auditoría
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Lote #98 vencido en fecha 15/08, retirado de anaquel..."
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('stocks')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingAdj}
                    className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>{isSubmittingAdj ? 'Guardando...' : 'Aplicar Ajuste al Kardex'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando inventario...</div>}>
        <InventoryPageContent />
      </Suspense>
    </RoleGuard>
  );
}
