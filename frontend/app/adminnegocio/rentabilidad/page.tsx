'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '../../../components/RoleGuard';
import { Navbar } from '../../../components/Navbar';
import { Sidebar, SidebarAction } from '../../../components/Sidebar';
import {
  useBcvRates,
  useProducts,
  useCategories,
  usePnLSummary,
  useFinancialTransactions,
  useCreateFinancialTransaction,
  useCancelFinancialTransaction,
} from '../../../hooks/useApi';
import { Product, Category } from '../../../types/product';
import { TransactionType } from '../../../types/finance';
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
  Plus,
  Calendar,
  Building2,
  FileText,
  Trash2,
  X,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Users,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'ALQUILER',
  'SERVICIOS_PUBLICOS',
  'MANTENIMIENTO',
  'TRANSPORTE_FLETES',
  'SUMINISTROS_EMPAQUES',
  'PUBLICIDAD_MARKETING',
  'IMPUESTOS_PATENTE',
  'NOMINA_HONORARIOS',
  'OTROS_GASTOS',
];

const INCOME_CATEGORIES = [
  'VENTAS_POS',
  'ALQUILER_ESPACIOS',
  'COMISIONES_SERVICIOS',
  'INTERESES_RENDIMIENTOS',
  'OTROS_INGRESOS',
];

function ProfitAndLossPageContent() {
  const router = useRouter();

  // Date Range Filter States
  const [periodPreset, setPeriodPreset] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('MONTH');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Primer día del mes actual
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // React Query Hooks
  const { data: bcvRates } = useBcvRates();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: pnlSummary, isLoading: isLoadingPnL } = usePnLSummary(
    periodPreset === 'ALL' ? undefined : startDate,
    periodPreset === 'ALL' ? undefined : endDate,
  );
  const { data: transactions = [], isLoading: isLoadingTx } = useFinancialTransactions({
    startDate: periodPreset === 'ALL' ? undefined : startDate,
    endDate: periodPreset === 'ALL' ? undefined : endDate,
  });

  // Mutations
  const createTxMutation = useCreateFinancialTransaction();
  const cancelTxMutation = useCancelFinancialTransaction();

  const bcvUsd = bcvRates?.usd || 775.3356;
  const bcvEur = bcvRates?.eur || 897.8231;

  // Active Tab: 'pnl_statement' | 'transactions' | 'products' | 'categories'
  const [activeTab, setActiveTab] = useState<'pnl_statement' | 'transactions' | 'products' | 'categories'>('pnl_statement');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [marginStatusFilter, setMarginStatusFilter] = useState<'ALL' | 'LOSS' | 'LOW' | 'NORMAL' | 'HIGH'>('ALL');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('EXPENSE');
  const [txCategory, setTxCategory] = useState('ALQUILER');
  const [txCurrencyOrigin, setTxCurrencyOrigin] = useState<'USD' | 'VES'>('USD');
  const [txAmountUSD, setTxAmountUSD] = useState<number | ''>(100);
  const [txAmountVES, setTxAmountVES] = useState<number | ''>(100 * bcvUsd);
  const [txExchangeRate, setTxExchangeRate] = useState<number>(bcvUsd);
  const [txJustification, setTxJustification] = useState('');
  const [txVoucherNumber, setTxVoucherNumber] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);

  // Target Margin Simulator for Products
  const [simulatorTargetMargin, setSimulatorTargetMargin] = useState<number | null>(null);

  // Handle Preset Period Change
  const handlePresetChange = (preset: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL') => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === 'TODAY') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'WEEK') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'MONTH') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'YEAR') {
      const d = new Date(now.getFullYear(), 0, 1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

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

  // Handle New Financial Transaction Submit
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txJustification.trim()) {
      setFormError('La justificación del movimiento es obligatoria');
      return;
    }
    const numUSD = typeof txAmountUSD === 'number' ? txAmountUSD : 0;
    const numVES = typeof txAmountVES === 'number' ? txAmountVES : 0;
    if (numUSD <= 0 && numVES <= 0) {
      setFormError('El monto debe ser mayor a 0');
      return;
    }

    setFormError(null);
    createTxMutation.mutate(
      {
        type: txType,
        category: txCategory,
        currencyOrigin: txCurrencyOrigin,
        amountUSD: numUSD,
        amountVES: numVES,
        exchangeRate: txExchangeRate,
        justification: txJustification.trim(),
        voucherNumber: txVoucherNumber.trim() || undefined,
        date: txDate,
      },
      {
        onSuccess: () => {
          setIsTxModalOpen(false);
          setTxJustification('');
          setTxVoucherNumber('');
        },
        onError: (err: any) => {
          setFormError(err.message || 'Error al guardar movimiento financiero');
        },
      },
    );
  };

  // Filtered Financial Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = txTypeFilter === 'ALL' || t.type === txTypeFilter;
      const matchSearch =
        searchTerm === '' ||
        t.justification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.voucherNumber && t.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [transactions, txTypeFilter, searchTerm]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* HEADER & DATE RANGE FILTER BAR */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-6 h-6" />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Estado de Resultados & P&L Real
                </h1>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Contabilidad ejecutiva inmutable: ingresos reales, costos de compras, nómina, mermas y gastos justificados con congelamiento de tasa BCV histórica.
              </p>
            </div>

            {/* Date Preset Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => handlePresetChange('TODAY')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    periodPreset === 'TODAY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('WEEK')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    periodPreset === 'WEEK' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  7 Días
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('MONTH')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    periodPreset === 'MONTH' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Este Mes
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('YEAR')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    periodPreset === 'YEAR' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Año en Curso
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    periodPreset === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Todo
                </button>
              </div>

              <button
                onClick={() => {
                  setTxType('EXPENSE');
                  setTxCategory('ALQUILER');
                  setTxExchangeRate(bcvUsd);
                  setTxAmountUSD(50);
                  setTxAmountVES(parseFloat((50 * bcvUsd).toFixed(2)));
                  setIsTxModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Gasto / Ingreso</span>
              </button>
            </div>
          </div>

          {/* TOP SUMMARY CARDS (BI-MONEDA INMUTABLE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Ingresos Totales */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>(+) Ingresos Totales</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
                  ${(pnlSummary?.inflows.totalGrossIncomeUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {(pnlSummary?.inflows.totalGrossIncomeVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs VES
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                {pnlSummary?.inflows.salesCount || 0} ventas + {pnlSummary?.inflows.extraIncomesCount || 0} ingresos extras
              </div>
            </div>

            {/* 2. Costos de Compras & Mercancía */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>(-) Compras a Proveedores</span>
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
                  ${(pnlSummary?.outflows.purchasesUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {(pnlSummary?.outflows.purchasesVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs VES
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                {pnlSummary?.outflows.purchasesCount || 0} facturas de compra recibidas
              </div>
            </div>

            {/* 3. Nómina & Gastos Operativos */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>(-) Nómina + Gastos + Mermas</span>
                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
                  ${(pnlSummary?.outflows.totalOperatingCostsUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {(pnlSummary?.outflows.totalOperatingCostsVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs VES
                </div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>Nómina: ${(pnlSummary?.outflows.payrollUSD || 0).toFixed(2)}</span>
                <span>•</span>
                <span>Gastos: ${(pnlSummary?.outflows.operatingExpensesUSD || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* 4. UTILIDAD NETA OPERATIVA (P&L REAL) */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
              (pnlSummary?.results.netOperatingProfitUSD || 0) >= 0
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={pnlSummary?.results.isProfitable ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                  (=) Utilidad Neta Real
                </span>
                <span className="p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-xs">
                  {pnlSummary?.results.isProfitable ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  )}
                </span>
              </div>
              <div>
                <div className={`text-2xl font-mono font-extrabold ${
                  pnlSummary?.results.isProfitable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  ${(pnlSummary?.results.netOperatingProfitUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-mono font-bold">
                  {(pnlSummary?.results.netOperatingProfitVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs VES
                </div>
              </div>
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Margen Operativo: <strong className="font-mono">{pnlSummary?.results.operatingMarginPercent || 0}%</strong>
              </div>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab('pnl_statement')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'pnl_statement'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Estado de Resultados (P&L Integral)</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'transactions'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Gastos & Ingresos Justificados ({transactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Margen por Producto & Semáforo</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Rentabilidad por Categoría</span>
            </button>
          </div>

          {/* TAB 1: ESTADO DE RESULTADOS INTEGRAL (P&L REAL) */}
          {activeTab === 'pnl_statement' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Estado Financiero de Ganancias & Pérdidas (P&L)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo basado estrictamente en las tasas históricas congeladas de cada movimiento de dinero
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Inmutabilidad Garantizada: Sumatoria directa $ USD y Bs VES
                  </span>
                </div>
              </div>

              {/* P&L Breakdown Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Rubro Contable</th>
                      <th className="p-3.5">Detalle / Operaciones</th>
                      <th className="p-3.5 text-right">Monto ($ USD Histórico)</th>
                      <th className="p-3.5 text-right">Monto (Bs VES Histórico)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {/* INFLOWS */}
                    <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold text-emerald-900 dark:text-emerald-300">
                      <td className="p-3.5" colSpan={4}>
                        (+) 1. INGRESOS OPERATIVOS BRUTOS
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-8 font-semibold">Ventas Facturadas POS / SENIAT</td>
                      <td className="p-3.5 text-slate-500">{pnlSummary?.inflows.salesCount || 0} facturas de venta</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        +${(pnlSummary?.inflows.salesUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        +{(pnlSummary?.inflows.salesVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-8 font-semibold">Ingresos Extraordinarios Justificados</td>
                      <td className="p-3.5 text-slate-500">{pnlSummary?.inflows.extraIncomesCount || 0} asientos justificados</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        +${(pnlSummary?.inflows.extraIncomesUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        +{(pnlSummary?.inflows.extraIncomesVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>

                    {/* COST OF GOODS SOLD */}
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-bold text-blue-900 dark:text-blue-300">
                      <td className="p-3.5" colSpan={4}>
                        (-) 2. COSTO DE MERCANCÍA / COMPRAS
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-8 font-semibold">Compras a Proveedores Recibidas</td>
                      <td className="p-3.5 text-slate-500">{pnlSummary?.outflows.purchasesCount || 0} facturas de compra</td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -${(pnlSummary?.outflows.purchasesUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -{(pnlSummary?.outflows.purchasesVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>

                    {/* GROSS PROFIT SUB-ROW */}
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                      <td className="p-3.5" colSpan={2}>
                        (=) MARGEN BRUTO MERCANTIL (Ingresos - Compras)
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">
                        ${(pnlSummary?.results.grossProfitUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">
                        {(pnlSummary?.results.grossProfitVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>

                    {/* OPERATING EXPENSES & PAYROLL */}
                    <tr className="bg-amber-50/40 dark:bg-amber-950/20 font-bold text-amber-900 dark:text-amber-300">
                      <td className="p-3.5" colSpan={4}>
                        (-) 3. GASTOS OPERATIVOS, LABORALES & MERMAS
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-8 font-semibold">Nómina y Salarios Liquidados</td>
                      <td className="p-3.5 text-slate-500">{pnlSummary?.outflows.payrollReceiptsCount || 0} recibos de pago</td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -${(pnlSummary?.outflows.payrollUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -{(pnlSummary?.outflows.payrollVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-8 font-semibold">Gastos Operativos Justificados (Luz, Alquiler, etc.)</td>
                      <td className="p-3.5 text-slate-500">{pnlSummary?.outflows.operatingExpensesCount || 0} gastos registrados</td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -${(pnlSummary?.outflows.operatingExpensesUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -{(pnlSummary?.outflows.operatingExpensesVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-8 font-semibold">Pérdidas por Mermas y Roturas (Kardex)</td>
                      <td className="p-3.5 text-slate-500">{pnlSummary?.outflows.mermasCount || 0} salidas/desechos</td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -${(pnlSummary?.outflows.mermasUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -{(pnlSummary?.outflows.mermasVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>

                    {/* NET OPERATING PROFIT FINAL TOTAL */}
                    <tr className={`font-extrabold text-sm ${
                      (pnlSummary?.results.netOperatingProfitUSD || 0) >= 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200'
                    }`}>
                      <td className="p-4" colSpan={2}>
                        (=) UTILIDAD NETA OPERATIVA REAL (P&L FINAL)
                      </td>
                      <td className="p-4 text-right font-mono text-base">
                        ${(pnlSummary?.results.netOperatingProfitUSD || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-base">
                        {(pnlSummary?.results.netOperatingProfitVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Breakdown by Expense Category */}
              {pnlSummary?.expensesByCategory && pnlSummary.expensesByCategory.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Desglose de Gastos Operativos por Categoría
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pnlSummary.expensesByCategory.map((c) => (
                      <div
                        key={c.category}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{c.category}</span>
                          <span className="text-[10px] text-slate-400">{c.count} registros</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-rose-600 block">${c.amountUSD.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">{c.amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GASTOS & INGRESOS JUSTIFICADOS */}
          {activeTab === 'transactions' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Libro de Gastos & Ingresos Justificados
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro auditable con número de comprobante, justificación y congelamiento de tasa BCV
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="ALL">Todos los Movimientos</option>
                    <option value="EXPENSE">Solo Gastos (-)</option>
                    <option value="INCOME">Solo Ingresos (+)</option>
                  </select>

                  <button
                    onClick={() => {
                      setTxType('EXPENSE');
                      setIsTxModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Movimiento</span>
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No se encontraron movimientos financieros en el periodo seleccionado.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Fecha</th>
                        <th className="p-3.5">Tipo</th>
                        <th className="p-3.5">Categoría</th>
                        <th className="p-3.5">Justificación & Comprobante</th>
                        <th className="p-3.5 text-right">Monto ($ USD)</th>
                        <th className="p-3.5 text-right">Monto (Bs VES)</th>
                        <th className="p-3.5 text-right">Tasa Congelada</th>
                        <th className="p-3.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono text-slate-500">
                            {new Date(tx.date).toLocaleDateString('es-VE')}
                          </td>

                          <td className="p-3.5">
                            {tx.type === 'INCOME' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                + INGRESO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800">
                                - GASTO
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {tx.category}
                          </td>

                          <td className="p-3.5">
                            <span className="block font-medium">{tx.justification}</span>
                            {tx.voucherNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Comp: {tx.voucherNumber}
                              </span>
                            )}
                          </td>

                          <td className={`p-3.5 text-right font-mono font-bold ${
                            tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amountUSD).toFixed(2)}
                          </td>

                          <td className={`p-3.5 text-right font-mono font-bold ${
                            tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {tx.type === 'INCOME' ? '+' : '-'}{Number(tx.amountVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                          </td>

                          <td className="p-3.5 text-right font-mono text-[11px] text-slate-500">
                            {Number(tx.exchangeRate).toFixed(4)}
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => cancelTxMutation.mutate(tx.id)}
                              title="Anular movimiento (Soft-delete)"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* TAB 3: MARGEN POR PRODUCTO & SEMÁFORO */}
          {activeTab === 'products' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Análisis Comercial & Margen por Producto
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detector de ventas a pérdida y simulador de margen objetivo
                  </p>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar SKU o nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={marginStatusFilter}
                    onChange={(e) => setMarginStatusFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="ALL">Todos los Márgenes</option>
                    <option value="LOSS">⚠️ En Pérdida (&lt; 0%)</option>
                    <option value="LOW">Margen Bajo (&lt; 15%)</option>
                    <option value="NORMAL">Margen Sólido (15% - 35%)</option>
                    <option value="HIGH">Margen Alto (&gt; 35%)</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Producto</th>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5 text-right">Costo Unit. ($)</th>
                      <th className="p-3.5 text-right">Precio Venta ($)</th>
                      <th className="p-3.5 text-right">Ganancia ($)</th>
                      <th className="p-3.5 text-right">Margen (%)</th>
                      <th className="p-3.5 text-right">Stock</th>
                      <th className="p-3.5 text-right">Valor Potencial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {analyzedProducts
                      .filter((p) => {
                        const matchSearch =
                          searchTerm === '' ||
                          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchStatus = marginStatusFilter === 'ALL' || p.status === marginStatusFilter;
                        return matchSearch && matchStatus;
                      })
                      .map((p) => (
                        <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          p.status === 'LOSS' ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                        }`}>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">{p.sku}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-400">
                            ${p.cost.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${p.sale.toFixed(2)}
                          </td>
                          <td className={`p-3.5 text-right font-mono font-bold ${
                            p.profitUSD >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            ${p.profitUSD.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              p.status === 'LOSS'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : p.status === 'LOW'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}>
                              {p.marginPercent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono">{p.stock}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${p.totalPotentialSalesUSD.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RENTABILIDAD POR CATEGORÍA */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rendimiento Comercial por Categoría
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const catProducts = analyzedProducts.filter((p) => p.categoryId === cat.id);
                  const totalCost = catProducts.reduce((sum, p) => sum + p.totalValuationCostUSD, 0);
                  const totalSales = catProducts.reduce((sum, p) => sum + p.totalPotentialSalesUSD, 0);
                  const totalProfit = totalSales - totalCost;
                  const avgMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

                  return (
                    <div
                      key={cat.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          {avgMargin.toFixed(1)}% Margen
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Productos:</span>
                          <span className="font-mono font-bold">{catProducts.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Venta Estimada:</span>
                          <span className="font-mono font-bold">${totalSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ganancia Potencial:</span>
                          <span className="font-mono font-bold text-emerald-600">${totalProfit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: REGISTRAR GASTO O INGRESO JUSTIFICADO */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Registrar Movimiento Financiero Justificado
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Afecta el Estado de Ganancias y Pérdidas (P&L) con tasa BCV congelada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleTxSubmit} className="space-y-4 text-xs">
              {/* Type Switch: EXPENSE vs INCOME */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('EXPENSE');
                    setTxCategory('ALQUILER');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    txType === 'EXPENSE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  - Gasto Operativo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('INCOME');
                    setTxCategory('OTROS_INGRESOS');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    txType === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + Ingreso Extraordinario
                </button>
              </div>

              {/* Categoría & Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría Contable *</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold"
                  >
                    {txType === 'EXPENSE'
                      ? EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      : INCOME_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Fecha de la Operación</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                  />
                </div>
              </div>

              {/* Dual-Currency Amount Input */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Moneda Base de Registro:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTxCurrencyOrigin('USD')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        txCurrencyOrigin === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      💵 Dólares ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxCurrencyOrigin('VES')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        txCurrencyOrigin === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      🇻🇪 Bolívares (Bs)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Monto en USD ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={txAmountUSD}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setTxAmountUSD(val);
                        if (typeof val === 'number') {
                          setTxAmountVES(parseFloat((val * txExchangeRate).toFixed(2)));
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Monto en VES (Bs)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={txAmountVES}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setTxAmountVES(val);
                        if (typeof val === 'number' && txExchangeRate > 0) {
                          setTxAmountUSD(parseFloat((val / txExchangeRate).toFixed(2)));
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Tasa BCV Aplicada:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    1 USD = {txExchangeRate.toFixed(4)} VES
                  </span>
                </div>
              </div>

              {/* Comprobante & Justificación */}
              <div>
                <label className="block font-semibold mb-1">N° de Factura / Recibo / Comprobante (Opcional)</label>
                <input
                  type="text"
                  placeholder="FAC-9012 / REC-4412"
                  value={txVoucherNumber}
                  onChange={(e) => setTxVoucherNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Justificación del Gasto / Ingreso *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Motivo detallado, proveedor del servicio, etc..."
                  value={txJustification}
                  onChange={(e) => setTxJustification(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTxMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {createTxMutation.isPending ? 'Guardando...' : 'Asentar en P&L'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfitAndLossPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'STORE_ADMIN', 'SUPERVISOR']}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Cargando P&L...</div>}>
        <ProfitAndLossPageContent />
      </Suspense>
    </RoleGuard>
  );
}
