'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '../../../components/RoleGuard';
import { Navbar } from '../../../components/Navbar';
import { Sidebar, SidebarAction } from '../../../components/Sidebar';
import { useBcvRates, useProducts, useCategories, usePurchases, useMovements } from '../../../hooks/useApi';
import { Product, Category } from '../../../types/product';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Package,
  Search,
  ArrowLeft,
  ArrowRight,
  Filter,
  Calculator,
  Receipt,
  FileSpreadsheet,
  Layers,
  Edit,
  Sparkles,
  Percent,
} from 'lucide-react';

function ProfitAndLossPageContent() {
  const router = useRouter();

  // React Query Hooks
  const { data: bcvRates } = useBcvRates();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: purchases = [] } = usePurchases();
  const { data: movements = [] } = useMovements({ limit: 200 });

  const bcvUsd = bcvRates?.usd || 775.3356;
  const bcvEur = bcvRates?.eur || 897.8231;

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'statement'>('products');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [marginStatusFilter, setMarginStatusFilter] = useState<'ALL' | 'LOSS' | 'LOW' | 'NORMAL' | 'HIGH'>('ALL');

  // Interactive Target Margin Simulator
  const [simulatorTargetMargin, setSimulatorTargetMargin] = useState<number | null>(null);

  // Products P&L Analysis Engine
  const analyzedProducts = useMemo(() => {
    return products.map((p) => {
      const cost = p.costPriceUSD;
      const sale = p.salePriceUSD;
      const profitUSD = sale - cost;
      const marginPercent = cost > 0 ? (profitUSD / cost) * 100 : 100;
      const stock = p.currentStock;

      const totalValuationCostUSD = cost * stock;
      const totalPotentialSalesUSD = sale * stock;
      const totalPotentialProfitUSD = profitUSD * stock;

      // Simulated Target Price if user activates target margin
      let simulatedPriceUSD = sale;
      if (simulatorTargetMargin !== null) {
        simulatedPriceUSD = parseFloat((cost * (1 + simulatorTargetMargin / 100)).toFixed(2));
      }

      let status: 'LOSS' | 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL';
      if (profitUSD < 0) status = 'LOSS';
      else if (marginPercent < 15) status = 'LOW';
      else if (marginPercent > 35) status = 'HIGH';

      return {
        ...p,
        cost,
        sale,
        profitUSD,
        marginPercent,
        stock,
        totalValuationCostUSD,
        totalPotentialSalesUSD,
        totalPotentialProfitUSD,
        simulatedPriceUSD,
        status,
      };
    });
  }, [products, simulatorTargetMargin]);

  // Global Financial KPIs
  const globalMetrics = useMemo(() => {
    let totalInventoryCostUSD = 0;
    let totalPotentialSalesUSD = 0;
    let lossProductsCount = 0;
    let lowMarginProductsCount = 0;

    analyzedProducts.forEach((p) => {
      totalInventoryCostUSD += p.totalValuationCostUSD;
      totalPotentialSalesUSD += p.totalPotentialSalesUSD;
      if (p.status === 'LOSS') lossProductsCount++;
      if (p.status === 'LOW') lowMarginProductsCount++;
    });

    const totalPotentialProfitUSD = totalPotentialSalesUSD - totalInventoryCostUSD;
    const averageMarginPercent =
      totalInventoryCostUSD > 0 ? (totalPotentialProfitUSD / totalInventoryCostUSD) * 100 : 0;

    // Total Purchases from Invoices
    const totalPurchasesCostUSD = purchases.reduce((acc, inv) => acc + Number(inv.subtotalUSD || inv.totalUSD), 0);
    const totalTaxCreditUSD = purchases.reduce((acc, inv) => acc + Number(inv.taxTotalUSD || 0), 0);

    // Mermas / Shrinkage loss from Kardex
    const shrinkageMovements = movements.filter(
      (m) => m.type === 'OUT' && (m.reason?.toLowerCase().includes('merma') || m.reason?.toLowerCase().includes('vencimiento') || m.reason?.toLowerCase().includes('daño')),
    );
    const shrinkageUnits = shrinkageMovements.reduce((acc, m) => acc + m.quantity, 0);

    return {
      totalInventoryCostUSD,
      totalPotentialSalesUSD,
      totalPotentialProfitUSD,
      averageMarginPercent,
      lossProductsCount,
      lowMarginProductsCount,
      totalPurchasesCostUSD,
      totalTaxCreditUSD,
      shrinkageUnits,
    };
  }, [analyzedProducts, purchases, movements]);

  // Category Profitability Breakdown
  const categoryMetrics = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        productCount: number;
        totalCostUSD: number;
        totalSalesUSD: number;
        totalProfitUSD: number;
      }
    >();

    categories.forEach((c) => {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        productCount: 0,
        totalCostUSD: 0,
        totalSalesUSD: 0,
        totalProfitUSD: 0,
      });
    });

    // Unassigned category
    map.set('NONE', {
      id: 'NONE',
      name: 'Sin Categoría',
      productCount: 0,
      totalCostUSD: 0,
      totalSalesUSD: 0,
      totalProfitUSD: 0,
    });

    analyzedProducts.forEach((p) => {
      const catKey = p.categoryId || 'NONE';
      const entry = map.get(catKey) || map.get('NONE')!;
      entry.productCount += 1;
      entry.totalCostUSD += p.totalValuationCostUSD;
      entry.totalSalesUSD += p.totalPotentialSalesUSD;
      entry.totalProfitUSD += p.totalPotentialProfitUSD;
    });

    return Array.from(map.values())
      .filter((c) => c.productCount > 0)
      .map((c) => {
        const marginPercent = c.totalCostUSD > 0 ? (c.totalProfitUSD / c.totalCostUSD) * 100 : 0;
        const shareOfProfit =
          globalMetrics.totalPotentialProfitUSD > 0
            ? (c.totalProfitUSD / globalMetrics.totalPotentialProfitUSD) * 100
            : 0;
        return { ...c, marginPercent, shareOfProfit };
      })
      .sort((a, b) => b.totalProfitUSD - a.totalProfitUSD);
  }, [analyzedProducts, categories, globalMetrics]);

  // Filtered Products for Products Tab
  const filteredProducts = useMemo(() => {
    return analyzedProducts.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.includes(term));

      const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      let matchMargin = true;
      if (marginStatusFilter === 'LOSS') matchMargin = p.status === 'LOSS';
      if (marginStatusFilter === 'LOW') matchMargin = p.status === 'LOW';
      if (marginStatusFilter === 'NORMAL') matchMargin = p.status === 'NORMAL';
      if (marginStatusFilter === 'HIGH') matchMargin = p.status === 'HIGH';

      return matchSearch && matchCat && matchMargin;
    });
  }, [analyzedProducts, searchTerm, selectedCategory, marginStatusFilter]);

  const handleSidebarAction = (action: SidebarAction) => {
    if (action === 'catalog') {
      router.push('/adminnegocio');
    } else if (action === 'openInventory' || action === 'openStockModal') {
      router.push('/adminnegocio/inventario');
    } else if (action === 'openNewProduct') {
      router.push('/adminnegocio/productos/nuevo');
    } else if (action === 'openPurchaseModal') {
      router.push('/adminnegocio/compras/nueva');
    } else if (action === 'openProfitLoss') {
      setActiveTab('products');
    } else if (action === 'openHrPayroll') {
      router.push('/adminnegocio/rrhh');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar onAction={handleSidebarAction} activeItem="catalog" bcvUsd={bcvUsd} />

        {/* MAIN P&L HUB */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Centro de Rentabilidad & P&L (Profit and Loss)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Análisis de Ganancias, Pérdidas & Márgenes Comerciales
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Control financiero de rentabilidad por producto, detección inmediata de ventas bajo costo y estado de resultados bi-moneda.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push('/adminnegocio/compras/nueva')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ingresar Compra</span>
              </button>

              <button
                onClick={() => router.push('/adminnegocio/productos/nuevo')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Package className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Loss Warning Alert if Any */}
          {globalMetrics.lossProductsCount > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  ⚠️ Se detectaron <strong>{globalMetrics.lossProductsCount} productos con Venta a Pérdida</strong> (Precio de venta inferior al costo).
                </span>
              </div>
              <button
                onClick={() => {
                  setMarginStatusFilter('LOSS');
                  setActiveTab('products');
                }}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-all shadow-xs"
              >
                Filtrar y Corregir
              </button>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Utilidad Bruta Proyectada</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +${globalMetrics.totalPotentialProfitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
              <p className="text-xs text-slate-400 font-mono">
                {(globalMetrics.totalPotentialProfitUSD * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES (BCV {bcvUsd.toFixed(2)})
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Margen Bruto Promedio</span>
                <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                +{globalMetrics.averageMarginPercent.toFixed(1)}%
              </span>
              <p className="text-xs text-slate-400 font-medium">Rentabilidad media sobre costo</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Inversión en Inventario (Costo)</span>
                <DollarSign className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                ${globalMetrics.totalInventoryCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
              <p className="text-xs text-slate-400 font-mono">
                Valor venta: ${globalMetrics.totalPotentialSalesUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Alertas de Rentabilidad</span>
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${globalMetrics.lossProductsCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                  {globalMetrics.lossProductsCount} Pérdida
                </span>
                <span className="text-xs text-amber-600 font-bold font-mono">({globalMetrics.lowMarginProductsCount} Bajo Margen)</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Requieren ajuste de precio</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rentabilidad por Producto ({filteredProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Margen por Categoría ({categoryMetrics.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('statement')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'statement'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Estado de Resultados (P&L Bi-Moneda)</span>
            </button>
          </div>

          {/* TAB 1: RENTABILIDAD POR PRODUCTO */}
          {activeTab === 'products' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Margen & Beneficio por Producto</h3>
                  <p className="text-xs text-slate-500">Costo de compra, precio de venta, margen bruto y utilidad potencial</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar SKU, producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Todas las Categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Margin Status Filter */}
                  <select
                    value={marginStatusFilter}
                    onChange={(e) => setMarginStatusFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-bold"
                  >
                    <option value="ALL">Todos los Márgenes</option>
                    <option value="LOSS">🔴 ¡Solo Pérdidas! (&lt;0%)</option>
                    <option value="LOW">🟠 Bajo Margen (&lt;15%)</option>
                    <option value="NORMAL">🟡 Margen Normal (15-35%)</option>
                    <option value="HIGH">🟢 Alto Margen (&gt;35%)</option>
                  </select>
                </div>
              </div>

              {/* SIMULADOR DE MÁRGENES OBJETIVO */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Simulador Rápido de Precios con Margen Objetivo:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[20, 25, 30, 40, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setSimulatorTargetMargin(simulatorTargetMargin === pct ? null : pct)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all ${
                        simulatorTargetMargin === pct
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                  {simulatorTargetMargin !== null && (
                    <button
                      onClick={() => setSimulatorTargetMargin(null)}
                      className="text-xs text-rose-500 hover:underline font-semibold ml-1"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No se encontraron productos con los filtros seleccionados.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">SKU</th>
                        <th className="p-3.5">Producto & Categoría</th>
                        <th className="p-3.5">Costo Unit. ($)</th>
                        <th className="p-3.5">P. Venta Actual ($)</th>
                        {simulatorTargetMargin !== null && (
                          <th className="p-3.5 text-purple-600 dark:text-purple-400">P. Simulado (+{simulatorTargetMargin}%)</th>
                        )}
                        <th className="p-3.5">Margen Comercial</th>
                        <th className="p-3.5">Ganancia / Unidad ($)</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5">Utilidad Total Stock ($)</th>
                        <th className="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {filteredProducts.map((p) => {
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${p.status === 'LOSS' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                            <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                              {p.sku}
                            </td>

                            <td className="p-3.5">
                              <span className="font-semibold text-slate-900 dark:text-white block">{p.name}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block mt-0.5">
                                {p.categoryName || 'Sin Categoría'}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                              ${p.cost.toFixed(2)}
                            </td>

                            <td className="p-3.5 font-mono font-bold">
                              ${p.sale.toFixed(2)}
                            </td>

                            {simulatorTargetMargin !== null && (
                              <td className="p-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                                ${p.simulatedPriceUSD.toFixed(2)}
                              </td>
                            )}

                            <td className="p-3.5">
                              {p.status === 'LOSS' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-300 dark:border-rose-800">
                                  <TrendingDown className="w-3 h-3 text-rose-600" />
                                  {p.marginPercent.toFixed(1)}% (Pérdida)
                                </span>
                              ) : p.status === 'LOW' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-300 dark:border-amber-800">
                                  +{p.marginPercent.toFixed(1)}% (Bajo)
                                </span>
                              ) : p.status === 'HIGH' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">
                                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                                  +{p.marginPercent.toFixed(1)}% (Alto)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                                  +{p.marginPercent.toFixed(1)}%
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 font-mono font-semibold">
                              <span className={p.profitUSD < 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}>
                                {p.profitUSD >= 0 ? `+$${p.profitUSD.toFixed(2)}` : `-$${Math.abs(p.profitUSD).toFixed(2)}`}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono text-slate-500">
                              {p.stock} {p.unit}
                            </td>

                            <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                              <span className={p.totalPotentialProfitUSD < 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}>
                                {p.totalPotentialProfitUSD >= 0
                                  ? `+$${p.totalPotentialProfitUSD.toFixed(2)}`
                                  : `-$${Math.abs(p.totalPotentialProfitUSD).toFixed(2)}`}
                              </span>
                            </td>

                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => router.push(`/adminnegocio/productos/nuevo?editId=${p.id}`)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                              >
                                Editar Precio
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

          {/* TAB 2: MARGEN POR CATEGORÍA */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Rentabilidad & Margen por Categoría</h3>
                <p className="text-xs text-slate-500">Aporte porcentual al beneficio bruto global y rendimiento de cada familia de productos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryMetrics.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {c.productCount} Artículos
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between text-slate-500">
                        <span>Inversión al Costo:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">${c.totalCostUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Valoración en Venta:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">${c.totalSalesUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Utilidad Proyectada:</span>
                        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          +${c.totalProfitUSD.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Profit Share */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Margen Promedio:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">+{c.marginPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(Math.max(c.shareOfProfit, 0), 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 text-right block">
                        Aporta el {c.shareOfProfit.toFixed(1)}% de la ganancia del negocio
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ESTADO DE RESULTADOS (P&L STATEMENT) */}
          {activeTab === 'statement' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" /> Estado de Resultados P&L (Estructura Financiera)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proyección operativa formal con deducción de mermas y balance de crédito fiscal SENIAT
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                  Tasa Oficial BCV: {bcvUsd.toFixed(2)} Bs
                </span>
              </div>

              {/* P&L Financial Ledger Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {/* 1. Ingresos Brutos */}
                <div className="p-4 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      (+) Ingresos Brutos Proyectados por Ventas
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Totalidad del valor comercializable del inventario actual
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      ${globalMetrics.totalPotentialSalesUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ≈ {(globalMetrics.totalPotentialSalesUSD * bcvUsd).toLocaleString('es-VE')} VES
                    </span>
                  </div>
                </div>

                {/* 2. Costo de Mercancía Vendida (COGS) */}
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 block">
                      (-) Costo de Adquisición de Mercancía (COGS)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Costo directo pagado a proveedores según facturas de compra
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block">
                      -${globalMetrics.totalInventoryCostUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ≈ {(globalMetrics.totalInventoryCostUSD * bcvUsd).toLocaleString('es-VE')} VES
                    </span>
                  </div>
                </div>

                {/* 3. Utilidad Bruta */}
                <div className="p-4 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm block">
                      (=) UTILIDAD BRUTA ESTIMADA
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Margen Bruto General: +{globalMetrics.averageMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 block">
                      +${globalMetrics.totalPotentialProfitUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      ≈ {(globalMetrics.totalPotentialProfitUSD * bcvUsd).toLocaleString('es-VE')} VES
                    </span>
                  </div>
                </div>

                {/* 4. Mermas & Pérdidas en Almacén */}
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      (-) Impacto por Mermas / Vencimientos (Kardex)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {globalMetrics.shrinkageUnits} unidades descargadas por caducidad o merma
                    </span>
                  </div>
                  <div className="text-right font-mono text-slate-600 dark:text-slate-400">
                    <span>Auditado en Kardex</span>
                  </div>
                </div>

                {/* 5. Posición Fiscal SENIAT */}
                <div className="p-4 flex items-center justify-between bg-blue-50/40 dark:bg-blue-950/30">
                  <div className="space-y-0.5">
                    <span className="font-bold text-blue-900 dark:text-blue-300 block">
                      Crédito Fiscal IVA Deducible (Facturas Proveedor)
                    </span>
                    <span className="text-[11px] text-blue-700 dark:text-blue-400">
                      IVA crédito acumulado para compensación fiscal SENIAT
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">
                      ${globalMetrics.totalTaxCreditUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ≈ {(globalMetrics.totalTaxCreditUSD * bcvUsd).toLocaleString('es-VE')} VES
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProfitAndLossPage() {
  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando análisis P&L...</div>}>
        <ProfitAndLossPageContent />
      </Suspense>
    </RoleGuard>
  );
}
