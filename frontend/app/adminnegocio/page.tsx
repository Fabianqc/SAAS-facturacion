'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { Sidebar, SidebarAction } from '../../components/Sidebar';
import { BcvHistoryModal } from '../../components/BcvHistoryModal';
import { ProductModal } from '../../components/ProductModal';
import { StockMovementModal } from '../../components/StockMovementModal';
import { CategoryManagerModal } from '../../components/CategoryManagerModal';
import { PurchaseInvoiceModal } from '../../components/PurchaseInvoiceModal';
import { PurchaseHistoryModal } from '../../components/PurchaseHistoryModal';
import { SupplierModal } from '../../components/SupplierModal';
import { useAuth } from '../../context/AuthContext';
import { Product, Category } from '../../types/product';
import { Supplier, PurchaseInvoice } from '../../types/purchase';
import {
  Store,
  DollarSign,
  Receipt,
  AlertTriangle,
  Plus,
  TrendingUp,
  CheckCircle2,
  Package,
  Search,
  Sliders,
  Edit,
  Barcode,
  FileSpreadsheet,
  Building2,
  ArrowUpRight,
  Clock,
  Eye,
  CheckCircle,
} from 'lucide-react';

export default function AdminNegocioPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [bcvUsd, setBcvUsd] = useState<number>(775.3356);
  const [bcvEur, setBcvEur] = useState<number>(897.8231);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Products, Categories, Suppliers & Purchases state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState<boolean>(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState<boolean>(false);
  const [supplierModalInitialMode, setSupplierModalInitialMode] = useState<'list' | 'create'>('list');

  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('catalog');

  const fetchBcvRates = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/bcv/current');
      if (res.ok) {
        const data = await res.json();
        if (data.usd && data.eur) {
          setBcvUsd(data.usd);
          setBcvEur(data.eur);
        }
      }
    } catch (e) {
      console.error('Error obteniendo tasas BCV:', e);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;
    setIsLoadingProducts(true);
    try {
      const res = await fetch('http://localhost:3001/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Error cargando productos:', e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/products/categories/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Error cargando categorías:', e);
    }
  };

  const fetchSuppliers = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/purchases/suppliers/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (e) {
      console.error('Error cargando proveedores:', e);
    }
  };

  const fetchPurchases = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data);
      }
    } catch (e) {
      console.error('Error cargando facturas de compra:', e);
    }
  };

  useEffect(() => {
    fetchBcvRates();
    if (token) {
      fetchProducts();
      fetchCategories();
      fetchSuppliers();
      fetchPurchases();
    }
  }, [token]);

  // Inventory valuation & KPI metrics
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const criticalProducts = products.filter((p) => p.isLowStock).slice(0, 4);
  const totalValuationUSD = products.reduce((sum, p) => sum + p.costPriceUSD * p.currentStock, 0);
  const totalValuationVES = totalValuationUSD * bcvUsd;
  const totalPurchasesUSD = purchases.reduce((sum, inv) => sum + Number(inv.totalUSD), 0);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));

      const matchCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'LOW') matchStock = p.isLowStock;
      if (stockFilter === 'OUT') matchStock = p.currentStock === 0;

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') matchStatus = p.isActive !== false;
      if (statusFilter === 'INACTIVE') matchStatus = p.isActive === false;

      return matchSearch && matchCategory && matchStock && matchStatus;
    });
  }, [products, searchTerm, selectedCategory, stockFilter, statusFilter]);

  const handleToggleProductStatus = async (prod: Product) => {
    try {
      const res = await fetch(`http://localhost:3001/api/products/${prod.id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, isActive: !p.isActive } : p)),
        );
        const nextStatus = !prod.isActive ? 'habilitado' : 'deshabilitado';
        setSyncNotice(`Producto "${prod.name}" ${nextStatus} para la venta.`);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (e) {
      console.error('Error al alternar estado del producto:', e);
    }
  };

  const openCreateProduct = () => {
    router.push('/adminnegocio/productos/nuevo');
  };

  const openEditProduct = (prod: Product) => {
    router.push(`/adminnegocio/productos/nuevo?editId=${prod.id}`);
  };

  const openStockModal = (prod?: Product) => {
    setProductForStock(prod || products[0] || null);
    setIsStockModalOpen(true);
  };

  const handlePurchaseSaved = () => {
    fetchProducts();
    fetchSuppliers();
    fetchPurchases();
    setSyncNotice('Factura de compra registrada exitosamente. Inventario y Kardex actualizados.');
    setTimeout(() => setSyncNotice(null), 5000);
  };

  // Handle Sidebar Navigation / Action Triggers
  const handleSidebarAction = (action: SidebarAction) => {
    setActiveSidebarItem(action);

    switch (action) {
      case 'catalog':
        setStockFilter('ALL');
        setSelectedCategory('ALL');
        break;
      case 'openNewProduct':
        openCreateProduct();
        break;
      case 'openCategories':
        setIsCategoryModalOpen(true);
        break;
      case 'openInventory':
      case 'openStockModal':
        router.push('/adminnegocio/inventario');
        break;
      case 'openPurchaseModal':
        router.push('/adminnegocio/compras/nueva');
        break;
      case 'openPurchaseHistory':
        setIsPurchaseHistoryOpen(true);
        break;
      case 'openSuppliers':
        setSupplierModalInitialMode('list');
        setIsSupplierModalOpen(true);
        break;
      case 'openAddSupplier':
        setSupplierModalInitialMode('create');
        setIsSupplierModalOpen(true);
        break;
      case 'openBcvHistory':
        setIsHistoryOpen(true);
        break;
      case 'openProfitLoss':
        router.push('/adminnegocio/rentabilidad');
        break;
      case 'openHrPayroll':
        router.push('/adminnegocio/rrhh');
        break;
      default:
        break;
    }
  };

  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <Sidebar
            onAction={handleSidebarAction}
            activeItem={activeSidebarItem}
            lowStockCount={lowStockCount}
            bcvUsd={bcvUsd}
          />

          {/* MAIN DASHBOARD / PANEL DE CONTROL */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                  <Store className="w-3.5 h-3.5" />
                  <span>Panel de Control Gerencial</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Resumen de Negocio & Control de Inventarios
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Métricas clave de existencias, recepción de compras, valoración fiscal y tasa oficial BCV.
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ingresar Factura Compra</span>
                </button>

                <button
                  onClick={openCreateProduct}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Producto</span>
                </button>
              </div>
            </div>

            {syncNotice && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{syncNotice}</span>
              </div>
            )}

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Catálogo Activo</span>
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalProducts} Ítems</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{categories.length} Familias / Categorías</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Valoración de Existencias</span>
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${totalValuationUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {totalValuationVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES (BCV {bcvUsd.toFixed(2)})
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Compras a Proveedores</span>
                  <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    ${totalPurchasesUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {purchases.length} Facturas procesadas
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Tasa BCV Oficial</span>
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{bcvUsd.toFixed(2)} Bs</span>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">EUR: {bcvEur.toFixed(2)} Bs</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN INTERMEDIA: PANELES DE INTERÉS (Alertas de Stock & Facturas Recientes) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel 1: Alertas de Stock Bajo / Reposición */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alertas de Stock Crítico</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Productos por debajo del stock mínimo sugerido</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStockFilter('LOW')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver todos ({lowStockCount})
                  </button>
                </div>

                {criticalProducts.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Inventario en niveles óptimos</p>
                    <p className="text-[11px]">No hay productos con alerta de stock bajo actualmente.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {criticalProducts.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {p.currentStock} {p.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Mín: {p.minStock}</span>
                          </div>
                          <button
                            onClick={() => openStockModal(p)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all"
                          >
                            Reponer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel 2: Últimas Facturas de Compra Recibidas */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimas Compras a Proveedores</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Mercancía recibida e ingresada al inventario</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPurchaseHistoryOpen(true)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Historial ({purchases.length})
                  </button>
                </div>

                {purchases.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                    <p>No se han registrado facturas de compra aún.</p>
                    <button
                      onClick={() => router.push('/adminnegocio/compras/nueva')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Ingresar Primera Factura
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {purchases.slice(0, 3).map((inv) => (
                      <div key={inv.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{inv.supplier?.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            FAC: {inv.invoiceNumber} • {new Date(inv.invoiceDate).toLocaleDateString('es-VE')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                            ${Number(inv.totalUSD).toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inv.items?.length || 0} ítems recibidos
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: CATÁLOGO DE PRODUCTOS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Catálogo Maestro de Productos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Precios multi-moneda en vivo, existencias y márgenes comerciales.
                  </p>
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
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todas las Categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {/* Stock filter */}
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todos los Stocks</option>
                    <option value="LOW">⚠️ Stock Bajo</option>
                    <option value="OUT">❌ Agotados (0)</option>
                  </select>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">✅ Solo Habilitados</option>
                    <option value="INACTIVE">⏸️ Solo Deshabilitados</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              {isLoadingProducts ? (
                <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Cargando catálogo de productos...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <Package className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No se encontraron productos</p>
                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      onClick={() => router.push('/adminnegocio/compras/nueva')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                    >
                      Ingresar por Factura de Compra
                    </button>
                    <button
                      onClick={openCreateProduct}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                    >
                      Crear Producto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">SKU / Código</th>
                        <th className="p-3.5">Producto & Categoría</th>
                        <th className="p-3.5">Costo Unit. ($)</th>
                        <th className="p-3.5">Precio Venta ($ / Bs / €)</th>
                        <th className="p-3.5">Margen</th>
                        <th className="p-3.5">IVA SENIAT</th>
                        <th className="p-3.5">Stock Actual</th>
                        <th className="p-3.5">Estado Venta</th>
                        <th className="p-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white block">{p.sku}</span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Barcode className="w-3 h-3 text-slate-400" />
                              {p.barcode || 'Sin código'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-slate-900 dark:text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-block mt-0.5">
                              {p.categoryName || 'Sin Categoría'}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                            ${p.costPriceUSD.toFixed(2)}
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs block">
                              ${p.salePriceUSD.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono block">
                              {p.salePriceVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block">
                              €{p.salePriceEUR.toFixed(2)} EUR
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className={`font-mono font-bold text-xs ${p.marginPercent >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {p.marginPercent}%
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              +${p.profitUSD.toFixed(2)}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {p.taxType === 'EXENTO_0' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                EXENTO
                              </span>
                            )}
                            {p.taxType === 'GENERAL_16' && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                                IVA 16%
                              </span>
                            )}
                            {p.taxType === 'REDUCIDO_8' && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
                                IVA 8%
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono font-bold ${p.currentStock === 0 ? 'text-rose-600 dark:text-rose-400' : p.isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                {p.currentStock} {p.unit}
                              </span>
                              {p.isLowStock && (
                                <span title={`Stock mínimo: ${p.minStock}`} className="text-amber-500">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">Mín: {p.minStock}</span>
                          </td>

                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleProductStatus(p)}
                              title={p.isActive !== false ? 'Haga clic para deshabilitar de la venta' : 'Haga clic para habilitar para la venta'}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                                p.isActive !== false
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span>{p.isActive !== false ? 'A la Venta' : 'Pausado'}</span>
                            </button>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openStockModal(p)}
                                title="Ajustar Stock / Kardex"
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openEditProduct(p)}
                                title="Editar Producto"
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* MODALS */}
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          token={token || ''}
          onRefresh={fetchSuppliers}
          initialMode={supplierModalInitialMode}
        />

        <PurchaseInvoiceModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onSaved={handlePurchaseSaved}
          products={products}
          categories={categories}
          suppliers={suppliers}
          bcvUsd={bcvUsd}
          bcvEur={bcvEur}
          token={token || ''}
        />

        <PurchaseHistoryModal
          isOpen={isPurchaseHistoryOpen}
          onClose={() => setIsPurchaseHistoryOpen(false)}
          token={token || ''}
          bcvUsd={bcvUsd}
        />

        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSaved={fetchProducts}
          productToEdit={productToEdit}
          categories={categories}
          bcvUsd={bcvUsd}
          bcvEur={bcvEur}
          token={token || ''}
        />

        <StockMovementModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          onSaved={fetchProducts}
          product={productForStock}
          storeId={user?.primaryStore?.id}
          storeName={user?.primaryStore?.name}
          token={token || ''}
        />

        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onRefresh={fetchCategories}
          token={token || ''}
        />

        <BcvHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </div>
    </RoleGuard>
  );
}
