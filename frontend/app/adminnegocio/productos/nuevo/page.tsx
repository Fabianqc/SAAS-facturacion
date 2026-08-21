'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoleGuard } from '../../../../components/RoleGuard';
import { Navbar } from '../../../../components/Navbar';
import { Sidebar, SidebarAction } from '../../../../components/Sidebar';
import { useAuth } from '../../../../context/AuthContext';
import { Category, TaxType, ProductUnitType } from '../../../../types/product';
import {
  Package,
  DollarSign,
  Barcode,
  Layers,
  Save,
  AlertCircle,
  Scale,
  Droplets,
  Ruler,
  Wrench,
  Sparkles,
  ArrowLeft,
  Store,
  CheckCircle2,
  Tag,
  Boxes,
  Calculator,
  Building,
  MapPin,
} from 'lucide-react';

interface UnitCategoryConfig {
  type: ProductUnitType;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  defaultUnit: string;
  units: string[];
  allowDecimals: boolean;
}

const UNIT_CATEGORIES: UnitCategoryConfig[] = [
  {
    type: 'COUNT',
    title: 'Unidad / Conteo',
    subtitle: 'Venta por piezas enteras',
    icon: Package,
    defaultUnit: 'PZA',
    units: ['PZA', 'CAJA', 'PAQ', 'BULTO', 'DOCENA', 'DISPLAY'],
    allowDecimals: false,
  },
  {
    type: 'WEIGHT',
    title: 'Pesable / Granel',
    subtitle: 'Balanza y venta fraccionada',
    icon: Scale,
    defaultUnit: 'KG',
    units: ['KG', 'GR', 'LIBRA', 'TON'],
    allowDecimals: true,
  },
  {
    type: 'VOLUME',
    title: 'Líquidos / Volumen',
    subtitle: 'Fluidos y envasados',
    icon: Droplets,
    defaultUnit: 'LT',
    units: ['LT', 'ML', 'GALÓN', 'BOTELLA', 'LATA'],
    allowDecimals: true,
  },
  {
    type: 'LENGTH',
    title: 'Medida / Metraje',
    subtitle: 'Ferretería y telas',
    icon: Ruler,
    defaultUnit: 'MTR',
    units: ['MTR', 'CM', 'M2', 'M3', 'ROLLO'],
    allowDecimals: true,
  },
  {
    type: 'SERVICE',
    title: 'Servicio / Mano de Obra',
    subtitle: 'Intangibles sin stock físico',
    icon: Wrench,
    defaultUnit: 'SRV',
    units: ['SRV', 'HORA', 'CONSULTA', 'INSTALACIÓN'],
    allowDecimals: false,
  },
];

const PACKAGING_UNITS = ['CAJA', 'BULTO', 'FARDO', 'DISPLAY', 'DOCENA', 'PACK', 'SACO', 'TAMBOR'];
const MARGIN_PRESETS = [15, 25, 30, 40, 50, 100];

function ProductEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const { token } = useAuth();

  const [bcvUsd, setBcvUsd] = useState<number>(775.3356);
  const [bcvEur, setBcvEur] = useState<number>(897.8231);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(false);

  // Unit & Nature Type
  const [selectedUnitType, setSelectedUnitType] = useState<ProductUnitType>('COUNT');
  const [unit, setUnit] = useState('PZA');
  const [allowDecimals, setAllowDecimals] = useState(false);

  // Packaging & Box Conversion System (Productos Compuestos)
  const [hasPackaging, setHasPackaging] = useState<boolean>(false);
  const [packagingUnit, setPackagingUnit] = useState<string>('CAJA');
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | ''>(6);
  const [packageBarcode, setPackageBarcode] = useState<string>('');
  const [packageCostUSD, setPackageCostUSD] = useState<number | ''>(0);

  // General Details
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Financials & Pricing
  const [costPriceUSD, setCostPriceUSD] = useState<number | ''>(0);
  const [salePriceUSD, setSalePriceUSD] = useState<number | ''>(0);
  const [marginPercent, setMarginPercent] = useState<number>(30);
  const [taxType, setTaxType] = useState<TaxType>('GENERAL_16');

  // Stock Management
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [initialStock, setInitialStock] = useState<number | ''>(10);
  const [initialStockPackages, setInitialStockPackages] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch BCV and Categories
  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd) setBcvUsd(data.usd);
        if (data && data.eur) setBcvEur(data.eur);
      })
      .catch(console.error);

    if (token) {
      fetch('http://localhost:3001/api/products/categories/all', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(console.error);
    }
  }, [token]);

  // Load product if editing
  useEffect(() => {
    if (editId && token) {
      setIsLoadingProduct(true);
      fetch('http://localhost:3001/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: any[]) => {
          const found = data.find((p) => p.id === editId);
          if (found) {
            let detectedType: ProductUnitType = 'COUNT';
            if (['KG', 'GR', 'LIBRA', 'TON'].includes(found.unit)) detectedType = 'WEIGHT';
            else if (['LT', 'ML', 'GALÓN', 'BOTELLA', 'LATA'].includes(found.unit)) detectedType = 'VOLUME';
            else if (['MTR', 'CM', 'M2', 'M3', 'ROLLO'].includes(found.unit)) detectedType = 'LENGTH';
            else if (['SRV', 'HORA', 'CONSULTA', 'INSTALACIÓN'].includes(found.unit)) detectedType = 'SERVICE';

            setSelectedUnitType(detectedType);
            setUnit(found.unit || 'PZA');
            setAllowDecimals(detectedType === 'WEIGHT' || detectedType === 'VOLUME' || detectedType === 'LENGTH');
            setSku(found.sku || '');
            setBarcode(found.barcode || '');
            setName(found.name || '');
            setDescription(found.description || '');
            setBrand(found.brand || '');
            setLocation(found.location || '');
            setCategoryId(found.categoryId || '');
            setCostPriceUSD(found.costPriceUSD || 0);
            setSalePriceUSD(found.salePriceUSD || 0);
            setMarginPercent(found.marginPercent || 30);
            setTaxType(found.taxType || 'GENERAL_16');
            setMinStock(found.minStock || 5);
            setIsActive(found.isActive !== undefined ? found.isActive : true);

            // Packaging data
            if (found.packagingUnit && found.unitsPerPackage && found.unitsPerPackage > 1) {
              setHasPackaging(true);
              setPackagingUnit(found.packagingUnit);
              setUnitsPerPackage(found.unitsPerPackage);
              setPackageBarcode(found.packageBarcode || '');
              setPackageCostUSD(parseFloat((found.costPriceUSD * found.unitsPerPackage).toFixed(2)));
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingProduct(false));
    }
  }, [editId, token]);

  const handleSelectUnitType = (cfg: UnitCategoryConfig) => {
    setSelectedUnitType(cfg.type);
    setUnit(cfg.defaultUnit);
    setAllowDecimals(cfg.allowDecimals);
  };

  // Calculations
  const numCost = typeof costPriceUSD === 'number' ? costPriceUSD : 0;
  const numSale = typeof salePriceUSD === 'number' ? salePriceUSD : 0;
  const numFactor = hasPackaging && typeof unitsPerPackage === 'number' && unitsPerPackage > 1 ? unitsPerPackage : 1;

  const profitUSD = Math.max(0, numSale - numCost);
  const calculatedMargin = numCost > 0 ? ((numSale - numCost) / numCost) * 100 : 100;
  const saleVES = numSale * bcvUsd;

  let taxRatePercent = 0;
  if (taxType === 'GENERAL_16') taxRatePercent = 16;
  if (taxType === 'REDUCIDO_8') taxRatePercent = 8;
  const taxAmountUSD = (numSale * taxRatePercent) / 100;
  const totalWithTaxUSD = numSale + taxAmountUSD;
  const totalWithTaxVES = totalWithTaxUSD * bcvUsd;

  // Box Package Calculations
  const calculatedBoxCost = (numCost * numFactor).toFixed(2);
  const calculatedBoxSale = (numSale * numFactor).toFixed(2);

  const applyMarginPreset = (margin: number) => {
    setMarginPercent(margin);
    if (numCost > 0) {
      const calculatedSale = numCost * (1 + margin / 100);
      setSalePriceUSD(parseFloat(calculatedSale.toFixed(2)));
    }
  };

  const handlePackageCostChange = (val: number | '') => {
    setPackageCostUSD(val);
    if (typeof val === 'number' && val > 0 && numFactor > 0) {
      const derivedUnitCost = parseFloat((val / numFactor).toFixed(4));
      setCostPriceUSD(derivedUnitCost);
      const newSale = derivedUnitCost * (1 + marginPercent / 100);
      setSalePriceUSD(parseFloat(newSale.toFixed(2)));
    }
  };

  const handleInitialPackageChange = (packagesCount: number | '') => {
    setInitialStockPackages(packagesCount);
    if (typeof packagesCount === 'number' && packagesCount >= 0) {
      setInitialStock(packagesCount * numFactor);
    }
  };

  const handleGenerateSku = () => {
    const prefix = name
      ? name
          .split(' ')
          .slice(0, 2)
          .map((w) => w.substring(0, 3).toUpperCase())
          .join('-')
      : 'ART';
    const random = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${random}`);
  };

  const currentCategoryConfig = UNIT_CATEGORIES.find((c) => c.type === selectedUnitType) || UNIT_CATEGORIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setErrorMsg('El código SKU es obligatorio');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio');
      return;
    }
    if (numSale <= 0 && selectedUnitType !== 'SERVICE') {
      setErrorMsg('El precio de venta en USD debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || null,
        name: name.trim(),
        description: description.trim() || null,
        categoryId: categoryId || null,
        unit,
        unitType: selectedUnitType,
        allowDecimals,
        packagingUnit: hasPackaging ? packagingUnit : null,
        unitsPerPackage: hasPackaging && typeof unitsPerPackage === 'number' ? unitsPerPackage : 1,
        packageBarcode: hasPackaging && packageBarcode.trim() ? packageBarcode.trim() : null,
        brand: brand.trim() || null,
        location: location.trim() || null,
        costPriceUSD: numCost,
        salePriceUSD: numSale,
        taxType,
        minStock: typeof minStock === 'number' ? minStock : 5,
        isActive,
      };

      let url = 'http://localhost:3001/api/products';
      let method = 'POST';

      if (editId) {
        url = `http://localhost:3001/api/products/${editId}`;
        method = 'PUT';
      } else {
        payload.initialStock = selectedUnitType === 'SERVICE' ? 0 : typeof initialStock === 'number' ? initialStock : 0;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar el producto');
      }

      router.push('/adminnegocio');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSidebarAction = (action: SidebarAction) => {
    if (action === 'catalog') {
      router.push('/adminnegocio');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar onAction={handleSidebarAction} activeItem="openNewProduct" bcvUsd={bcvUsd} />

        {/* MAIN PAGE PRODUCT HUB */}
        <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <button
                onClick={() => router.push('/adminnegocio')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Catálogo de Productos
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {editId ? 'Editar Ficha de Producto' : 'Nuevo Producto en Catálogo Maestro'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Definición operativa de unidad de medida, empaques/cajas, fiscalidad SENIAT y rentabilidad bi-moneda.
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
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Crear y Publicar Producto'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoadingProduct ? (
            <div className="py-24 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Cargando datos del producto...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PASO 1: SELECCIÓN DE NATURALEZA Y UNIDAD DE MEDIDA */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    1. Unidad de Venta al Público (Consumidor Final)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define la unidad individual con la que el cliente compra en tienda o caja POS
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {UNIT_CATEGORIES.map((cfg) => {
                    const Icon = cfg.icon;
                    const isSelected = selectedUnitType === cfg.type;

                    return (
                      <button
                        key={cfg.type}
                        type="button"
                        onClick={() => handleSelectUnitType(cfg)}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-200 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-tight">{cfg.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{cfg.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-unidades */}
                <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Unidad individual de venta:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentCategoryConfig.units.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-3.5 py-1.5 rounded-lg font-mono font-bold text-xs transition-all ${
                          unit === u
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>

                  {allowDecimals && (
                    <span className="ml-auto text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium">
                      ⚖️ Venta fraccional habilitada (Balanza / Peso)
                    </span>
                  )}
                </div>
              </div>

              {/* PASO 2: SISTEMA DE EMPAQUES & CAJAS (CONVERSIÓN DE PRODUCTOS COMPUESTOS) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        2. Presentación Mayorista / Empaques & Cajas
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ¿Este producto se compra a proveedores por Cajas o Bultos que contienen varias unidades?
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPackaging}
                      onChange={(e) => setHasPackaging(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {hasPackaging ? 'Empaque Habilitado' : 'Sin Empaque Mayorista'}
                    </span>
                  </label>
                </div>

                {hasPackaging && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Unidad de Empaque (Proveedor)
                        </label>
                        <select
                          value={packagingUnit}
                          onChange={(e) => setPackagingUnit(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                        >
                          {PACKAGING_UNITS.map((pu) => (
                            <option key={pu} value={pu}>
                              {pu}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Unidades de Venta que contiene cada {packagingUnit} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="2"
                          step="1"
                          required
                          value={unitsPerPackage}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setUnitsPerPackage(val);
                            if (typeof val === 'number' && val > 0 && typeof packageCostUSD === 'number' && packageCostUSD > 0) {
                              const derivedUnit = parseFloat((packageCostUSD / val).toFixed(4));
                              setCostPriceUSD(derivedUnit);
                              setSalePriceUSD(parseFloat((derivedUnit * (1 + marginPercent / 100)).toFixed(2)));
                            }
                          }}
                          placeholder="Ej: 6 champús por caja"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Costo de Compra de la {packagingUnit} Completa ($ USD)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={packageCostUSD}
                          onChange={(e) =>
                            handlePackageCostChange(e.target.value === '' ? '' : parseFloat(e.target.value))
                          }
                          placeholder="Ej: $18.00 por caja"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Código de Barras de la {packagingUnit} Externa (Opcional para Almacén)
                        </label>
                        <input
                          type="text"
                          value={packageBarcode}
                          onChange={(e) => setPackageBarcode(e.target.value)}
                          placeholder="Código de la caja para escáner"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                        <div className="flex justify-between text-purple-900 dark:text-purple-300 font-semibold">
                          <span>Equivalencia de Inventario:</span>
                          <span className="font-mono">
                            1 {packagingUnit} = {unitsPerPackage} {unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-700 dark:text-purple-400">
                          Al comprar 1 {packagingUnit}, se registrarán automáticamente{' '}
                          <strong className="font-mono">{unitsPerPackage} {unit}</strong> a la venta con un costo unitario calculado de{' '}
                          <strong className="font-mono">${numCost.toFixed(2)} USD</strong> c/u.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2-COLUMN LAYOUT: CONFIGURATION + COMMERCIAL HUB */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: FORM DETAILS (7 COLUMNS) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* 3. Identificación del Producto */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 3. Identificación & Clasificación
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Código SKU <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateSku}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <Sparkles className="w-3 h-3" /> Auto
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="SHAMP-001"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Código de Barras Individual (EAN / UPC)
                        </label>
                        <input
                          type="text"
                          placeholder="7591234567890"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nombre Completo del Producto <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Shampoo Sedal Ceramidas 350ml"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Categoría / Familia
                        </label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="">-- Sin Categoría --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Marca / Fabricante
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Unilever / Polar / Sony"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Rentabilidad & Precios */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 4. Rentabilidad & Precios Unitarios
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Costo Unitario ($ USD por {unit})
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          placeholder="0.00"
                          value={costPriceUSD}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setCostPriceUSD(val);
                            if (typeof val === 'number' && val > 0) {
                              const newSale = val * (1 + marginPercent / 100);
                              setSalePriceUSD(parseFloat(newSale.toFixed(2)));
                              if (hasPackaging) {
                                setPackageCostUSD(parseFloat((val * numFactor).toFixed(2)));
                              }
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Precio de Venta Base ($ USD por {unit}) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          value={salePriceUSD}
                          onChange={(e) => setSalePriceUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Presets de Margen */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Margen Comercial Sugerido (%):
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {calculatedMargin.toFixed(1)}% (+${profitUSD.toFixed(2)} por {unit})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {MARGIN_PRESETS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => applyMarginPreset(m)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                              marginPercent === m
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            +{m}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tratamiento SENIAT */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Tratamiento Fiscal (SENIAT)
                      </label>
                      <select
                        value={taxType}
                        onChange={(e) => setTaxType(e.target.value as TaxType)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                      >
                        <option value="GENERAL_16">IVA General (16%) - Bienes y servicios gravables</option>
                        <option value="REDUCIDO_8">IVA Reducido (8%) - Alimentos especiales y carne</option>
                        <option value="EXENTO_0">Exento de IVA (0%) - Canasta básica alimentaria / medicinas</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Control de Inventario */}
                  {selectedUnitType !== 'SERVICE' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" /> 5. Parámetros de Stock & Almacén
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!editId && (
                          <div className="space-y-2">
                            {hasPackaging && (
                              <div>
                                <label className="block text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1">
                                  Ingreso Inicial en {packagingUnit}S
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={initialStockPackages}
                                  onChange={(e) =>
                                    handleInitialPackageChange(
                                      e.target.value === '' ? '' : parseFloat(e.target.value),
                                    )
                                  }
                                  placeholder={`Ej: 10 ${packagingUnit}S`}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Stock Inicial Total ({unit} a la venta)
                              </label>
                              <input
                                type="number"
                                step={allowDecimals ? '0.01' : '1'}
                                min="0"
                                value={initialStock}
                                onChange={(e) =>
                                  setInitialStock(e.target.value === '' ? '' : parseFloat(e.target.value))
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Stock Mínimo (Alerta de Reorden en {unit})
                          </label>
                          <input
                            type="number"
                            step={allowDecimals ? '0.01' : '1'}
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Disponibilidad para la Venta */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          6. Estado & Disponibilidad para la Venta
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Controla si este producto aparece habilitado en el Punto de Venta (POS) y catálogo
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span className={`ml-3 text-xs font-bold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {isActive ? 'Habilitado para la Venta' : 'Pausado / Oculto en POS'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE COMMERCIAL HUB & SUMMARY (5 COLUMNS) */}
                <div className="lg:col-span-5 space-y-4 sticky top-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Ficha Comercial en Vivo
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        BCV: {bcvUsd.toFixed(2)} Bs
                      </span>
                    </div>

                    {/* Live Preview Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                          {unit} • {currentCategoryConfig.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            taxType === 'EXENTO_0'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {taxType === 'EXENTO_0' ? 'EXENTO SENIAT' : `IVA ${taxRatePercent}%`}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {name || 'Nombre del Producto'}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">SKU: {sku || 'SKU-000'}</p>
                      </div>

                      {/* Packaging Info Badge */}
                      {hasPackaging && (
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300 font-semibold flex items-center justify-between">
                          <span>📦 1 {packagingUnit} = {unitsPerPackage} {unit}</span>
                          <span className="font-mono">${calculatedBoxCost} USD/{packagingUnit}</span>
                        </div>
                      )}

                      {/* Multi-Currency Price breakdown */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-slate-500">Precio Base Unitario:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ${numSale.toFixed(2)} USD / {unit}
                          </span>
                        </div>

                        {taxRatePercent > 0 && (
                          <div className="flex items-baseline justify-between text-xs text-slate-500">
                            <span>IVA SENIAT ({taxRatePercent}%):</span>
                            <span className="font-mono">+${taxAmountUSD.toFixed(2)} USD</span>
                          </div>
                        )}

                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Precio Final al Público:</span>
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                            ${totalWithTaxUSD.toFixed(2)} USD
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-slate-500">Equivalente en Bolívares:</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {totalWithTaxVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-slate-500">Equivalente en Euros:</span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400">
                            €{(totalWithTaxVES / (bcvEur || 1)).toFixed(2)} EUR
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profit Health Metric */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Rentabilidad Comercial:</span>
                        <span
                          className={`font-mono font-bold ${
                            calculatedMargin >= 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                          }`}
                        >
                          {calculatedMargin.toFixed(1)}% Margen
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Ganancia Bruta por {unit}:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          +${profitUSD.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductEditorPage() {
  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando editor...</div>}>
        <ProductEditorContent />
      </Suspense>
    </RoleGuard>
  );
}
