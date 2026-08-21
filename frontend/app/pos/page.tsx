'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { Sidebar, SidebarAction } from '../../components/Sidebar';
import { BcvHistoryModal } from '../../components/BcvHistoryModal';
import {
  ShoppingBag,
  ShoppingCart,
  Printer,
  Check,
  DollarSign,
  CreditCard,
  Smartphone,
  Calculator,
  Search,
  Receipt,
  User,
  Barcode,
  TrendingUp,
} from 'lucide-react';

export default function PosPage() {
  const [bcvUsd, setBcvUsd] = useState<number>(775.3356);
  const [bcvEur, setBcvEur] = useState<number>(897.8231);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'VES'>('USD');
  const [isBcvModalOpen, setIsBcvModalOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('posTerminal');

  // Cart
  const [cart, setCart] = useState([
    { id: '1', sku: 'PROD-001', name: 'Harina de Maíz Precocida 1Kg', priceUSD: 1.2, taxExempt: true, qty: 2 },
    { id: '2', sku: 'ELEC-002', name: 'Powerbank 10000mAh', priceUSD: 25.0, taxExempt: false, qty: 1 },
    { id: '3', sku: 'ARROZ-004', name: 'Arroz Blanco Grano Entero 1Kg', priceUSD: 1.55, taxExempt: true, qty: 3 },
  ]);
  const [isInvoiceDone, setIsInvoiceDone] = useState(false);

  // Vuelto / Calculadora
  const [receivedAmount, setReceivedAmount] = useState<number | ''>(50);
  const [receivedCurrency, setReceivedCurrency] = useState<'USD' | 'VES'>('USD');

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd) setBcvUsd(data.usd);
        if (data && data.eur) setBcvEur(data.eur);
      })
      .catch(console.error);
  }, []);

  const subtotalUSD = cart.reduce((acc, item) => acc + item.priceUSD * item.qty, 0);
  const taxUSD = cart.reduce((acc, item) => (item.taxExempt ? acc : acc + item.priceUSD * item.qty * 0.16), 0);
  const totalUSD = subtotalUSD + taxUSD;
  const totalVES = totalUSD * bcvUsd;
  const totalEUR = bcvEur > 0 ? totalVES / bcvEur : 0;

  // Calculo de cambio / vuelto
  const numReceived = typeof receivedAmount === 'number' ? receivedAmount : 0;
  const receivedInUSD = receivedCurrency === 'USD' ? numReceived : numReceived / bcvUsd;
  const changeUSD = Math.max(0, receivedInUSD - totalUSD);
  const changeVES = changeUSD * bcvUsd;

  const handleSidebarAction = (action: SidebarAction) => {
    setActiveSidebarItem(action);
    if (action === 'openBcvHistory') {
      setIsBcvModalOpen(true);
    }
  };

  return (
    <RoleGuard allowedRoles={['CASHIER', 'SUPERVISOR', 'STORE_ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <Sidebar onAction={handleSidebarAction} activeItem={activeSidebarItem} bcvUsd={bcvUsd} />

          {/* MAIN CASHIER DASHBOARD */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Terminal de Cobro & Caja</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Punto de Venta (POS) & Facturación SENIAT
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Cobros en Efectivo Divisas ($/€), Pago Móvil y Bolívares a tasa oficial BCV.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Caja Asignada:</span>
                <span className="font-bold text-slate-900 dark:text-white">Caja 01 - Principal</span>
              </div>
            </div>

            {/* Metric KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Fondo Inicial de Caja</span>
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">$50.00 USD</span>
                <p className="text-[11px] text-slate-400">Apertura de turno</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Ventas en mi Turno</span>
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">$380.00 USD</span>
                <p className="text-[11px] text-slate-400 font-mono">≈ {(380 * bcvUsd).toLocaleString('es-VE')} VES</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Facturas Emitidas</span>
                  <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">14 Tickets</span>
                <p className="text-[11px] text-slate-400">SENIAT Compliant</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Tasa BCV del Turno</span>
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{bcvUsd.toFixed(2)} Bs</span>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">EUR: {bcvEur.toFixed(2)} Bs</p>
              </div>
            </div>

            {/* SECCIÓN INTERMEDIA: CALCULADORA RÁPIDA DE VUELTO */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Calculadora Rápida de Cambio / Vuelto</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Calcula el vuelto exacto al recibir billetes de alta denominación o pago mixto</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">Recibe:</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={receivedCurrency}
                      onChange={(e) => setReceivedCurrency(e.target.value as any)}
                      className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="USD">$ USD</option>
                      <option value="VES">Bs VES</option>
                    </select>
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="text-[10px] text-slate-500 block">Vuelto a Entregar:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ${changeUSD.toFixed(2)} USD <span className="text-xs text-slate-500">({changeVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: TERMINAL POS (CATÁLOGO & FACTURA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Products & Customer */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Catálogo Rápido de Venta
                  </h3>
                  <span className="text-xs text-slate-400">3 Productos en Carrito</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        EXENTO
                      </span>
                      <span className="text-xs text-slate-400 font-mono">PROD-001</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Harina de Maíz Precocida 1Kg</h4>
                      <p className="text-xs text-slate-400">Stock: 150 KG</p>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">$1.20 USD</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(1.2 * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        IVA 16%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ELEC-002</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Powerbank 10000mAh</h4>
                      <p className="text-xs text-slate-400">Stock: 15 PZA</p>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">$25.00 USD</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(25 * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cliente de la Factura SENIAT</span>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Juan Pérez</p>
                      <p className="text-slate-500 font-mono text-[11px]">RIF / Cédula: V-18765432</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                      Consumidor Final
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Receipt & Invoice Action */}
              <div className="lg:col-span-5">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Factura Fiscal N° FAC-01-00001</h3>
                      <p className="text-[10px] text-slate-400">Impresora SENIAT • Control 00-0001</p>
                    </div>

                    {/* Currency Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setSelectedCurrency('USD')}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                          selectedCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        $ USD
                      </button>
                      <button
                        onClick={() => setSelectedCurrency('VES')}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                          selectedCurrency === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        Bs VES
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto text-xs">
                    {cart.map((item) => (
                      <div key={item.id} className="pt-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.qty} x ${item.priceUSD.toFixed(2)} {item.taxExempt ? '(Exento)' : '(IVA 16%)'}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">${(item.qty * item.priceUSD).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary Calculations */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Subtotal Exento</span>
                      <span className="font-mono text-slate-900 dark:text-white">$7.05 USD</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Subtotal Gravable (IVA 16%)</span>
                      <span className="font-mono text-slate-900 dark:text-white">$25.00 USD</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Monto IVA (16%)</span>
                      <span className="font-mono text-slate-900 dark:text-white">$4.00 USD</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Total USD:</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${totalUSD.toFixed(2)} USD</span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">TOTAL A COBRAR (VES):</span>
                        <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                          {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                        </span>
                      </div>
                    </div>
                  </div>

                  {isInvoiceDone ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                      <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">¡Factura Fiscal Emitida con Éxito!</p>
                      <button
                        onClick={() => setIsInvoiceDone(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-all"
                      >
                        Nueva Venta
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsInvoiceDone(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Facturar e Imprimir SENIAT</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

        <BcvHistoryModal isOpen={isBcvModalOpen} onClose={() => setIsBcvModalOpen(false)} />
      </div>
    </RoleGuard>
  );
}
