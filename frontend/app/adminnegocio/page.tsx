'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { BcvHistoryModal } from '../../components/BcvHistoryModal';
import { Store, DollarSign, Receipt, AlertTriangle, Plus, TrendingUp, Printer, ArrowUpRight, RefreshCw, CheckCircle2, Coins, History } from 'lucide-react';

export default function AdminNegocioPage() {
  const [bcvUsd, setBcvUsd] = useState<number>(773.3125);
  const [bcvEur, setBcvEur] = useState<number>(896.0295);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

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

  const handleSyncBcv = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await fetch('http://localhost:3001/api/bcv/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.usd && data.eur) {
          setBcvUsd(data.usd);
          setBcvEur(data.eur);
          setSyncNotice(data.message);
          setTimeout(() => setSyncNotice(null), 5000);
        }
      }
    } catch (e) {
      console.error('Error sincronizando BCV:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBcvRates();
  }, []);

  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                <Store className="w-3.5 h-3.5" /> Portal Administración de Negocio (URL: /adminnegocio)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Gestión de Tienda & Sucursales
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Control de inventarios multi-moneda ($/€/Bs), catálogo de productos, sucursales y reportes de facturación SENIAT.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span>Historial de Tasas BCV</span>
              </button>
            </div>
          </div>

          {syncNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Ventas del Día</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold text-white">$450.00 USD</span>
                <p className="text-xs text-slate-400">{(450 * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES (BCV USD)</p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Tasa Oficial USD (BCV)</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold text-emerald-400">{bcvUsd.toFixed(2)} VES</span>
                <p className="text-xs text-slate-400">Scraped de bcv.org.ve</p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Tasa Oficial EUR (BCV)</span>
                <Coins className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold text-cyan-400">{bcvEur.toFixed(2)} VES</span>
                <p className="text-xs text-slate-400">Scraped de bcv.org.ve</p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Facturas Emitidas</span>
                <Receipt className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold text-white">28 Facturas</span>
                <p className="text-xs text-emerald-400">Control SENIAT al día</p>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all text-left group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm">Nuevo Producto</h4>
              <p className="text-xs text-slate-400 mt-1">Carga precio en USD/EUR, IVA y SKU.</p>
            </button>

            <button
              onClick={handleSyncBcv}
              disabled={isSyncing}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm">Sincronizar BCV Real</h4>
              <p className="text-xs text-slate-400 mt-1">Analiza variaciones en bcv.org.ve y guarda sin duplicados.</p>
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                  <History className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm">Historial de Tasas</h4>
              <p className="text-xs text-slate-400 mt-1">Línea de tiempo de cambios de tasa registrados en PostgreSQL.</p>
            </button>

            <button className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-violet-500/50 transition-all text-left group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                  <Printer className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
              </div>
              <h4 className="font-bold text-white text-sm">Reporte X / Z SENIAT</h4>
              <p className="text-xs text-slate-400 mt-1">Generación de resúmenes fiscales diarios.</p>
            </button>
          </div>
        </main>

        <BcvHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </div>
    </RoleGuard>
  );
}
