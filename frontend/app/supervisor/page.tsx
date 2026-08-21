'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { Sidebar, SidebarAction } from '../../components/Sidebar';
import { BcvHistoryModal } from '../../components/BcvHistoryModal';
import {
  UserCheck,
  Store,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  DollarSign,
  UserPlus,
  Layers,
  Calculator,
  AlertTriangle,
  History,
  TrendingUp,
  Receipt,
  FileCheck,
  CheckCircle,
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
  cashUSD: number;
  cashVES: number;
  electronicVES: number;
}

const AVAILABLE_CASHIERS = [
  { id: 'cashier-1', name: 'Valentina Cajera', email: 'cajero@tiendave.com' },
  { id: 'cashier-2', name: 'María Rodríguez', email: 'maria.cajera@tiendave.com' },
  { id: 'cashier-3', name: 'Ana Gutiérrez', email: 'ana.cajera@tiendave.com' },
];

export default function SupervisorPage() {
  const [bcvUsd, setBcvUsd] = useState<number>(775.3356);
  const [bcvEur, setBcvEur] = useState<number>(897.8231);

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
      cashUSD: 180.0,
      cashVES: 45000.0,
      electronicVES: 110000.0,
    },
    {
      id: 'reg-2',
      name: 'Caja 02 - Rápida / Expreso',
      code: 'POS-02',
      assignedCashierId: 'cashier-2',
      assignedCashierName: 'María Rodríguez',
      status: 'OPEN',
      openingBalanceUSD: 30.0,
      currentSalesUSD: 145.0,
      cashUSD: 85.0,
      cashVES: 15000.0,
      electronicVES: 31000.0,
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
      cashUSD: 0.0,
      cashVES: 0.0,
      electronicVES: 0.0,
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [isBcvModalOpen, setIsBcvModalOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('cashierAssignment');

  // Arqueo Interactivo State
  const [selectedArqueoRegId, setSelectedArqueoRegId] = useState<string>('reg-1');
  const [declaredCashUSD, setDeclaredCashUSD] = useState<number | ''>(230);
  const [declaredCashVES, setDeclaredCashVES] = useState<number | ''>(45000);
  const [declaredElectronicVES, setDeclaredElectronicVES] = useState<number | ''>(110000);
  const [arqueoNotice, setArqueoNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd) setBcvUsd(data.usd);
        if (data && data.eur) setBcvEur(data.eur);
      })
      .catch(console.error);
  }, []);

  const selectedRegister = registers.find((r) => r.id === selectedArqueoRegId) || registers[0];
  const expectedTotalUSD = selectedRegister
    ? selectedRegister.openingBalanceUSD + selectedRegister.currentSalesUSD
    : 0;

  const numDecUSD = typeof declaredCashUSD === 'number' ? declaredCashUSD : 0;
  const numDecVES = typeof declaredCashVES === 'number' ? declaredCashVES : 0;
  const numDecElec = typeof declaredElectronicVES === 'number' ? declaredElectronicVES : 0;
  const declaredTotalUSD = numDecUSD + (numDecVES + numDecElec) / bcvUsd;
  const differenceUSD = declaredTotalUSD - expectedTotalUSD;

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
      }),
    );

    if (cashier) {
      setNotification(`Cajera "${cashier.name}" asignada correctamente.`);
    } else {
      setNotification(`Caja registradora liberada.`);
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
      }),
    );
  };

  const handleSidebarAction = (action: SidebarAction) => {
    setActiveSidebarItem(action);
    if (action === 'openBcvHistory') {
      setIsBcvModalOpen(true);
    }
  };

  const handleConfirmArqueo = () => {
    setArqueoNotice(
      `✅ Cuadre de ${selectedRegister.name} guardado con éxito. Diferencia registrada: $${differenceUSD.toFixed(2)} USD.`,
    );
    setTimeout(() => setArqueoNotice(null), 6000);
  };

  const totalTurnoUSD = registers.reduce((acc, r) => acc + r.currentSalesUSD, 0);
  const totalTurnoVES = totalTurnoUSD * bcvUsd;

  return (
    <RoleGuard allowedRoles={['SUPERVISOR', 'STORE_ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <Sidebar onAction={handleSidebarAction} activeItem={activeSidebarItem} bcvUsd={bcvUsd} />

          {/* MAIN SUPERVISOR DASHBOARD */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Panel de Control de Supervisión</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Supervisión de Cajas, Turnos & Cuadres
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Monitoreo de cajeras en tiempo real, arqueo de fondos y auditoría de ventas.
                </p>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Store className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="font-semibold">Sucursal Las Mercedes</span>
              </div>
            </div>

            {/* Toast Notification */}
            {notification && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{notification}</span>
              </div>
            )}

            {/* Metric KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Cajas Activas</span>
                  <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {registers.filter((r) => r.status === 'OPEN').length} / {registers.length} Cajas
                </span>
                <p className="text-[11px] text-slate-400">Puntos de venta habilitados</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Cajeras en Turno</span>
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {registers.filter((r) => r.assignedCashierId !== null).length} Operando
                </span>
                <p className="text-[11px] text-slate-400">Personal asignado</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Recaudación del Turno</span>
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  ${totalTurnoUSD.toFixed(2)} USD
                </span>
                <p className="text-[11px] text-slate-400 font-mono">
                  {totalTurnoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES (BCV {bcvUsd.toFixed(2)})
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Tasa BCV de Cobro</span>
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{bcvUsd.toFixed(2)} Bs</span>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">EUR: {bcvEur.toFixed(2)} Bs</p>
              </div>
            </div>

            {/* SECCIÓN INTERMEDIA: CUADRE & ARQUEO RÁPIDO DE CAJA */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Módulo de Arqueo & Cuadre de Caja
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Verificación de dinero físico y electrónico vs ventas fiscales esperadas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Caja a Cuadrar:</label>
                  <select
                    value={selectedArqueoRegId}
                    onChange={(e) => setSelectedArqueoRegId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {registers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.assignedCashierName || 'Sin cajera'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {arqueoNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{arqueoNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    💵 Efectivo Dólares ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={declaredCashUSD}
                    onChange={(e) => setDeclaredCashUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    💵 Efectivo Bolívares (VES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={declaredCashVES}
                    onChange={(e) => setDeclaredCashVES(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    💳 Pago Móvil / Tarjetas (VES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={declaredElectronicVES}
                    onChange={(e) => setDeclaredElectronicVES(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Esperado en Caja:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">${expectedTotalUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Declarado Contado:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">${declaredTotalUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold">Diferencia:</span>
                    <span
                      className={`font-mono font-bold ${
                        Math.abs(differenceUSD) < 0.05
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : differenceUSD > 0
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {differenceUSD >= 0 ? `+$${differenceUSD.toFixed(2)}` : `-$${Math.abs(differenceUSD).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleConfirmArqueo}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Guardar Arqueo de Caja</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: ASIGNACIÓN Y ESTADO DE CAJAS */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Monitoreo y Asignación de Cajas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona la cajera asignada a cada terminal y gestiona la apertura/cierre de turnos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {registers.map((reg) => (
                  <div
                    key={reg.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{reg.code}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{reg.name}</h4>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          reg.status === 'OPEN'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {reg.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cajera Asignada:
                      </label>

                      <select
                        value={reg.assignedCashierId || ''}
                        onChange={(e) => handleAssignCashier(reg.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Sin Asignar (Libre) --</option>
                        {AVAILABLE_CASHIERS.map((cashier) => (
                          <option key={cashier.id} value={cashier.id}>
                            {cashier.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Fondo de Apertura:</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          ${reg.openingBalanceUSD.toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Ventas en Turno:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ${reg.currentSalesUSD.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(reg.id)}
                      className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        reg.status === 'OPEN'
                          ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
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
                ))}
              </div>
            </div>
          </main>
        </div>

        <BcvHistoryModal isOpen={isBcvModalOpen} onClose={() => setIsBcvModalOpen(false)} />
      </div>
    </RoleGuard>
  );
}
