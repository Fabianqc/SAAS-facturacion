'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
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
  Percent,
  TrendingUp,
  Tag,
  Building,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Product, Category, TaxType, ProductUnitType } from '../types/product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  bcvUsd: number;
  bcvEur: number;
  token: string;
}

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

const MARGIN_PRESETS = [15, 25, 30, 40, 50, 100];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  productToEdit,
  categories,
  bcvUsd,
  bcvEur,
  token,
}) => {
  // Unit & Nature Type
  const [selectedUnitType, setSelectedUnitType] = useState<ProductUnitType>('COUNT');
  const [unit, setUnit] = useState('PZA');
  const [allowDecimals, setAllowDecimals] = useState(false);

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
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or Reset Form
  useEffect(() => {
    if (productToEdit) {
      // Deduce unit type from unit name
      let detectedType: ProductUnitType = 'COUNT';
      if (['KG', 'GR', 'LIBRA', 'TON'].includes(productToEdit.unit)) detectedType = 'WEIGHT';
      else if (['LT', 'ML', 'GALÓN', 'BOTELLA', 'LATA'].includes(productToEdit.unit)) detectedType = 'VOLUME';
      else if (['MTR', 'CM', 'M2', 'M3', 'ROLLO'].includes(productToEdit.unit)) detectedType = 'LENGTH';
      else if (['SRV', 'HORA', 'CONSULTA', 'INSTALACIÓN'].includes(productToEdit.unit)) detectedType = 'SERVICE';

      setSelectedUnitType(detectedType);
      setUnit(productToEdit.unit || 'PZA');
      setAllowDecimals(detectedType === 'WEIGHT' || detectedType === 'VOLUME' || detectedType === 'LENGTH');
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setBrand(productToEdit.brand || '');
      setLocation(productToEdit.location || '');
      setCategoryId(productToEdit.categoryId || '');
      setCostPriceUSD(productToEdit.costPriceUSD || 0);
      setSalePriceUSD(productToEdit.salePriceUSD || 0);
      setMarginPercent(productToEdit.marginPercent || 30);
      setTaxType(productToEdit.taxType || 'GENERAL_16');
      setMinStock(productToEdit.minStock || 5);
      setIsActive(productToEdit.isActive !== undefined ? productToEdit.isActive : true);
    } else {
      setSelectedUnitType('COUNT');
      setUnit('PZA');
      setAllowDecimals(false);
      setSku('');
      setBarcode('');
      setName('');
      setDescription('');
      setBrand('');
      setLocation('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setCostPriceUSD(0);
      setSalePriceUSD(0);
      setMarginPercent(30);
      setTaxType('GENERAL_16');
      setMinStock(5);
      setInitialStock(10);
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Handle Unit Type Selection
  const handleSelectUnitType = (cfg: UnitCategoryConfig) => {
    setSelectedUnitType(cfg.type);
    setUnit(cfg.defaultUnit);
    setAllowDecimals(cfg.allowDecimals);
  };

  // Profit & Pricing calculations
  const numCost = typeof costPriceUSD === 'number' ? costPriceUSD : 0;
  const numSale = typeof salePriceUSD === 'number' ? salePriceUSD : 0;

  // Calculate profit and margin
  const profitUSD = Math.max(0, numSale - numCost);
  const calculatedMargin = numCost > 0 ? ((numSale - numCost) / numCost) * 100 : 100;

  // Multi-Currency BCV calculations
  const saleVES = numSale * bcvUsd;
  const saleEUR = bcvEur > 0 ? saleVES / bcvEur : 0;

  // Tax amounts SENIAT
  let taxRatePercent = 0;
  if (taxType === 'GENERAL_16') taxRatePercent = 16;
  if (taxType === 'REDUCIDO_8') taxRatePercent = 8;
  const taxAmountUSD = (numSale * taxRatePercent) / 100;
  const totalWithTaxUSD = numSale + taxAmountUSD;
  const totalWithTaxVES = totalWithTaxUSD * bcvUsd;

  // Apply Margin Preset
  const applyMarginPreset = (margin: number) => {
    setMarginPercent(margin);
    if (numCost > 0) {
      const calculatedSale = numCost * (1 + margin / 100);
      setSalePriceUSD(parseFloat(calculatedSale.toFixed(2)));
    }
  };

  // Generate Automatic SKU
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

      if (productToEdit) {
        url = `http://localhost:3001/api/products/${productToEdit.id}`;
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

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-5xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6 shadow-2xl relative my-auto text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {productToEdit ? 'Ficha de Producto: ' + productToEdit.name : 'Crear Producto en Catálogo Maestro'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Enterprise Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clasificación operativa, parámetros fiscales SENIAT y estrategia de rentabilidad bi-moneda.
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
          {/* PASO 1: SELECCIÓN DE NATURALEZA Y UNIDAD DE MEDIDA (CORE ENTERPRISE) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Naturaleza Operativa & Unidad de Medida
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {UNIT_CATEGORIES.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = selectedUnitType === cfg.type;

                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => handleSelectUnitType(cfg)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight">{cfg.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{cfg.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selector de sub-unidad específica */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Unidad asignada:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {currentCategoryConfig.units.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition-all ${
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
                <span className="ml-auto text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-medium">
                  ⚖️ Habilita venta decimal (Balanza)
                </span>
              )}
            </div>
          </div>

          {/* 2-COLUMN LAYOUT: CONFIGURATION + COMMERCIAL LIVE HUB */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: FORM DETAILS (7 COLUMNS) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 2. Identificación del Producto */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> 2. Identificación & Clasificación
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      placeholder="HAR-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Código de Barras (EAN / UPC)
                    </label>
                    <input
                      type="text"
                      placeholder="7591234567890"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                    placeholder="Ej: Harina de Maíz Precocida 1Kg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Categoría / Familia
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
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
                      placeholder="Ej: Polar / Mavesa / Sony"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Precios, Costos & Margen Interactivo */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 3. Rentabilidad & Precios
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Costo Unitario ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={costPriceUSD}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setCostPriceUSD(val);
                        if (typeof val === 'number' && val > 0) {
                          const newSale = val * (1 + marginPercent / 100);
                          setSalePriceUSD(parseFloat(newSale.toFixed(2)));
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Precio de Venta Base ($ USD) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={salePriceUSD}
                      onChange={(e) => setSalePriceUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Presets de Margen Rápido */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Margen Comercial Sugerido (%):
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {calculatedMargin.toFixed(1)}% (+${profitUSD.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {MARGIN_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => applyMarginPreset(m)}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                          marginPercent === m
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        +{m}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Régimen SENIAT */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tratamiento Fiscal (SENIAT)
                  </label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as TaxType)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="GENERAL_16">IVA General (16%) - Bienes y servicios gravables</option>
                    <option value="REDUCIDO_8">IVA Reducido (8%) - Alimentos especiales y carne</option>
                    <option value="EXENTO_0">Exento de IVA (0%) - Canasta básica alimentaria / medicinas</option>
                  </select>
                </div>
              </div>

              {/* 4. Control de Inventario */}
              {selectedUnitType !== 'SERVICE' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> 4. Parámetros de Stock & Almacén
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!productToEdit && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Stock Inicial de Apertura ({unit})
                        </label>
                        <input
                          type="number"
                          step={allowDecimals ? '0.01' : '1'}
                          min="0"
                          value={initialStock}
                          onChange={(e) =>
                            setInitialStock(e.target.value === '' ? '' : parseFloat(e.target.value))
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Stock Mínimo (Alerta de Reorden)
                      </label>
                      <input
                        type="number"
                        step={allowDecimals ? '0.01' : '1'}
                        min="0"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: LIVE COMMERCIAL HUB & SUMMARY (5 COLUMNS) */}
            <div className="lg:col-span-5 space-y-4 sticky top-4">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ficha Comercial en Vivo
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    BCV: {bcvUsd.toFixed(2)} Bs
                  </span>
                </div>

                {/* Live Preview Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
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
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {name || 'Nombre del Producto'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">SKU: {sku || 'SKU-000'}</p>
                  </div>

                  {/* Multi-Currency Price breakdown */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Precio Base:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ${numSale.toFixed(2)} USD
                      </span>
                    </div>

                    {taxRatePercent > 0 && (
                      <div className="flex items-baseline justify-between text-xs text-slate-500">
                        <span>IVA SENIAT ({taxRatePercent}%):</span>
                        <span className="font-mono">+${taxAmountUSD.toFixed(2)} USD</span>
                      </div>
                    )}

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Precio Final ($):</span>
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
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
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
                    <span>Ganancia Bruta por Unidad:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      +${profitUSD.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : productToEdit ? 'Guardar Cambios' : 'Crear Producto'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
