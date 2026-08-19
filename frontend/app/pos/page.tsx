'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { ShoppingBag, ShoppingCart, Printer, Check, Coins } from 'lucide-react';

export default function PosPage() {
  const [bcvUsd, setBcvUsd] = useState<number>(773.3125);
  const [bcvEur, setBcvEur] = useState<number>(896.0295);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'VES'>('USD');
  const [cart, setCart] = useState([
    { id: '1', name: 'Harina de Maíz Precocida 1Kg', priceUSD: 1.2, taxExempt: true, qty: 2 },
    { id: '2', name: 'Powerbank 10000mAh', priceUSD: 25.0, taxExempt: false, qty: 1 },
  ]);
  const [isInvoiceDone, setIsInvoiceDone] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd && data.eur) {
          setBcvUsd(data.usd);
          setBcvEur(data.eur);
        }
      })
      .catch(console.error);
  }, []);

  const subtotalUSD = cart.reduce((acc, item) => acc + item.priceUSD * item.qty, 0);
  const taxUSD = cart.reduce((acc, item) => (item.taxExempt ? acc : acc + item.priceUSD * item.qty * 0.16), 0);
  const totalUSD = subtotalUSD + taxUSD;
  const totalVES = totalUSD * bcvUsd;
  const totalEUR = totalVES / bcvEur;

  return (
    <RoleGuard allowedRoles={['CASHIER', 'SUPERVISOR', 'STORE_ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShoppingBag className="w-3.5 h-3.5" /> Terminal Punto de Venta (URL: /pos)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Punto de Venta (POS) Tri-Moneda ($ / € / Bs)
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Emisión de facturas fiscales, cobros en USD, EUR y Bolívares a tasa oficial del BCV.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950">
                <span className="text-slate-400 font-semibold">USD BCV:</span>
                <span className="text-emerald-400 font-bold font-mono">{bcvUsd.toFixed(2)} Bs</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950">
                <span className="text-slate-400 font-semibold">EUR BCV:</span>
                <span className="text-cyan-400 font-bold font-mono">{bcvEur.toFixed(2)} Bs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Products & Customer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" /> Catálogo Rápido de Productos
                </h3>
                <span className="text-xs text-slate-400">Sucursal Las Mercedes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">EXENTO</span>
                    <span className="text-xs text-slate-400 font-mono">PROD-001</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Harina de Maíz Precocida 1Kg</h4>
                    <p className="text-xs text-slate-400">Harina precocida para arepas</p>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-base font-bold text-emerald-400">$1.20 USD</span>
                      <p className="text-[10px] text-cyan-300">€{(1.2 * bcvUsd / bcvEur).toFixed(2)} EUR</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{(1.2 * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES</span>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">IVA 16%</span>
                    <span className="text-xs text-slate-400 font-mono">ELEC-002</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Powerbank 10000mAh</h4>
                    <p className="text-xs text-slate-400">Batería portátil carga rápida</p>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-base font-bold text-emerald-400">$25.00 USD</span>
                      <p className="text-[10px] text-cyan-300">€{(25 * bcvUsd / bcvEur).toFixed(2)} EUR</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{(25 * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente de la Factura</span>
                <div className="flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold">Juan Pérez</p>
                    <p className="text-slate-400 text-[11px]">RIF/Cédula: V-18765432</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 text-[11px]">Consumidor Final</span>
                </div>
              </div>
            </div>

            {/* Right: Receipt & Invoice Action */}
            <div className="lg:col-span-5">
              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">Factura N° FAC-01-00001</h3>
                    <p className="text-[10px] text-slate-400">Impresora Fiscal SENIAT • Serie 00</p>
                  </div>

                  {/* Currency Selector */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setSelectedCurrency('USD')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedCurrency === 'USD' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      $ USD
                    </button>
                    <button
                      onClick={() => setSelectedCurrency('EUR')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedCurrency === 'EUR' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      € EUR
                    </button>
                    <button
                      onClick={() => setSelectedCurrency('VES')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedCurrency === 'VES' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Bs VES
                    </button>
                  </div>
                </div>

                <div className="space-y-3 divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.qty} x ${item.priceUSD.toFixed(2)} {item.taxExempt ? '(Exento)' : '(IVA 16%)'}
                        </p>
                      </div>
                      <span className="font-bold text-slate-200">${(item.qty * item.priceUSD).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Summary Calculations Tri-Moneda */}
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subtotal Exento</span>
                    <span className="font-mono text-white">$2.40 USD</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subtotal Gravable (IVA 16%)</span>
                    <span className="font-mono text-white">$25.00 USD</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Monto IVA (16%)</span>
                    <span className="font-mono text-white">$4.00 USD</span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Total en Dólares ($):</span>
                      <span className="text-sm font-bold text-emerald-400">${totalUSD.toFixed(2)} USD</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Total en Euros (€ BCV):</span>
                      <span className="text-sm font-bold text-cyan-400">€{totalEUR.toFixed(2)} EUR</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/50">
                      <span className="text-sm font-extrabold text-white">TOTAL A COBRAR (VES BCV):</span>
                      <span className="text-base font-extrabold text-indigo-400">
                        {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                      </span>
                    </div>
                  </div>
                </div>

                {isInvoiceDone ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                    <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-emerald-300">¡Factura Fiscal Emitida con Éxito!</p>
                    <button
                      onClick={() => setIsInvoiceDone(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-all"
                    >
                      Nueva Venta
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsInvoiceDone(true)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
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
    </RoleGuard>
  );
}
