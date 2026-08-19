'use client';

import React, { useState } from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import {
  UserCheck,
  Store,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserPlus,
  Layers,
} from 'lucide-react';

interface CashRegister {
  id: string;
  name: string;
  code: string;
  assignedCashierId: string | null;
  assignedCashierName: string | null;
  status: 'OPEN' | 'CLOSED' | 'UNASSIGNED';
  openingBalanceUSD: number;
  currentSalesUSD: number;
}

const AVAILABLE_CASHIERS = [
  { id: 'cashier-1', name: 'Valentina Cajera', email: 'cajero@tiendave.com' },
  { id: 'cashier-2', name: 'María Rodríguez', email: 'maria.cajera@tiendave.com' },
  { id: 'cashier-3', name: 'Ana Gutiérrez', email: 'ana.cajera@tiendave.com' },
];

export default function SupervisorPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([
    {
      id: 'reg-1',
      name: 'Caja 01 - Principal',
      code: 'POS-01',
      assignedCashierId: 'cashier-1',
      assignedCashierName: 'Valentina Cajera',
      status: 'OPEN',
      openingBalanceUSD: 50.0,
      currentSalesUSD: 380.0,
    },
    {
      id: 'reg-2',
      name: 'Caja 02 - Rápida / Expreso',
      code: 'POS-02',
      assignedCashierId: null,
      assignedCashierName: null,
      status: 'UNASSIGNED',
      openingBalanceUSD: 0.0,
      currentSalesUSD: 0.0,
    },
    {
      id: 'reg-3',
      name: 'Caja 03 - Servicio al Cliente',
      code: 'POS-03',
      assignedCashierId: null,
      assignedCashierName: null,
      status: 'CLOSED',
      openingBalanceUSD: 0.0,
      currentSalesUSD: 0.0,
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleAssignCashier = (registerId: string, cashierId: string) => {
    const cashier = AVAILABLE_CASHIERS.find((c) => c.id === cashierId);

    setRegisters((prev) =>
      prev.map((reg) => {
        if (reg.id === registerId) {
          if (!cashierId) {
            return {
              ...reg,
              assignedCashierId: null,
              assignedCashierName: null,
              status: 'UNASSIGNED',
            };
          }
          return {
            ...reg,
            assignedCashierId: cashierId,
            assignedCashierName: cashier ? cashier.name : null,
            status: 'OPEN',
            openingBalanceUSD: reg.openingBalanceUSD || 50.0,
          };
        }
        return reg;
      })
    );

    if (cashier) {
      setNotification(`✅ Se asignó a "${cashier.name}" en ${registers.find((r) => r.id === registerId)?.name}`);
    } else {
      setNotification(`ℹ️ Se liberó la caja registradora`);
    }

    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = (registerId: string) => {
    setRegisters((prev) =>
      prev.map((reg) => {
        if (reg.id === registerId) {
          const nextStatus = reg.status === 'OPEN' ? 'CLOSED' : 'OPEN';
          return { ...reg, status: nextStatus };
        }
        return reg;
      })
    );
  };

  return (
    <RoleGuard allowedRoles={['SUPERVISOR', 'STORE_ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/50 via-slate-900 to-slate-950 border border-violet-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5" /> Portal Supervisor de Cajas (URL: /supervisor)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Supervisión & Asignación de Cajeras
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Asignación de personal a cajas registradoras, apertura de turnos, arqueos de caja y auditoría de ventas.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-400" />
              <span>Sucursal Las Mercedes</span>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{notification}</span>
            </div>
          )}

          {/* Metric Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Cajas Registradas</span>
                <Layers className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-2xl font-bold text-white">{registers.length} Cajas</span>
              <p className="text-[11px] text-slate-400">Sucursal Principal</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Cajeras en Turno</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-400">
                {registers.filter((r) => r.assignedCashierId !== null).length} Asignadas
              </span>
              <p className="text-[11px] text-slate-400">Turno Actual</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Ventas Acumuladas en Cajas</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                ${registers.reduce((acc, r) => acc + r.currentSalesUSD, 0).toFixed(2)} USD
              </span>
              <p className="text-[11px] text-slate-400">Total turno activo</p>
            </div>
          </div>

          {/* CASHIER ASSIGNMENT MODULE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-violet-400" /> Asignación de Cajeras por Caja Registradora
                </h3>
                <p className="text-xs text-slate-400">
                  Selecciona qué cajera operará cada punto de venta en la sucursal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {registers.map((reg) => (
                <div
                  key={reg.id}
                  className={`glass-card p-6 rounded-3xl border transition-all duration-300 space-y-5 relative overflow-hidden ${
                    reg.status === 'OPEN'
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20 bg-slate-900/90'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{reg.code}</span>
                      <h4 className="font-bold text-white text-base leading-tight">{reg.name}</h4>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        reg.status === 'OPEN'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {reg.status === 'OPEN' ? 'ABIERTA' : 'CERRADA / LIBRE'}
                    </span>
                  </div>

                  {/* Cashier Assignment Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-violet-400" /> Cajera Asignada:
                    </label>

                    <select
                      value={reg.assignedCashierId || ''}
                      onChange={(e) => handleAssignCashier(reg.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">-- Ninguna (Sin Asignar) --</option>
                      {AVAILABLE_CASHIERS.map((cashier) => (
                        <option key={cashier.id} value={cashier.id}>
                          {cashier.name} ({cashier.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Register Metrics */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Fondo Inicial ($):</span>
                      <span className="font-mono text-white">${reg.openingBalanceUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ventas en Turno:</span>
                      <span className="font-mono text-emerald-400 font-bold">${reg.currentSalesUSD.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(reg.id)}
                      className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        reg.status === 'OPEN'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {reg.status === 'OPEN' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Cerrar Caja
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Abrir Caja
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
