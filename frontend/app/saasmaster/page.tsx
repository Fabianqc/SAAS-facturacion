'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { Sidebar, SidebarAction } from '../../components/Sidebar';
import { BcvHistoryModal } from '../../components/BcvHistoryModal';
import {
  Building2,
  DollarSign,
  Users,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  Server,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function SaasMasterPage() {
  const [bcvUsd, setBcvUsd] = useState<number>(775.3356);
  const [bcvEur, setBcvEur] = useState<number>(897.8231);
  const [isBcvModalOpen, setIsBcvModalOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('tenantsList');
  const [searchTerm, setSearchTerm] = useState('');

  const [tenants, setTenants] = useState([
    {
      id: 't-1',
      name: 'Inversiones y Tiendas Venezuela, C.A.',
      rif: 'J-123456789',
      plan: 'ENTERPRISE',
      storesCount: 3,
      usersCount: 12,
      status: 'ACTIVE',
      monthlyFeeUSD: 89.0,
      joinedAt: '19/08/2026',
    },
    {
      id: 't-2',
      name: 'Distribuidora Los Andes Express C.A.',
      rif: 'J-987654321',
      plan: 'PRO',
      storesCount: 1,
      usersCount: 4,
      status: 'ACTIVE',
      monthlyFeeUSD: 49.0,
      joinedAt: '20/08/2026',
    },
    {
      id: 't-3',
      name: 'Farmacias y Suministros Capital C.A.',
      rif: 'J-554433221',
      plan: 'ENTERPRISE',
      storesCount: 5,
      usersCount: 22,
      status: 'ACTIVE',
      monthlyFeeUSD: 149.0,
      joinedAt: '21/08/2026',
    },
  ]);

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd) setBcvUsd(data.usd);
        if (data && data.eur) setBcvEur(data.eur);
      })
      .catch(console.error);
  }, []);

  const totalMRR = tenants.reduce((sum, t) => sum + t.monthlyFeeUSD, 0);
  const totalUsers = tenants.reduce((sum, t) => sum + t.usersCount, 0);

  const handleSidebarAction = (action: SidebarAction) => {
    setActiveSidebarItem(action);
    if (action === 'openBcvHistory') {
      setIsBcvModalOpen(true);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.rif.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <Sidebar onAction={handleSidebarAction} activeItem={activeSidebarItem} bcvUsd={bcvUsd} />

          {/* MAIN SUPERADMIN DASHBOARD */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Panel Master Global SaaS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Administración Global de Tenants & Plataforma
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Control de clientes multi-tenant, suscripciones, infraestructura y scraper oficial BCV.
                </p>
              </div>

              <button className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all">
                <Plus className="w-4 h-4" />
                <span>Registrar Nueva Empresa</span>
              </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Empresas (Tenants)</span>
                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{tenants.length} Activas</span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">+100% Retención</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Ingresos Recurrentes (MRR)</span>
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${totalMRR.toFixed(2)} USD
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Facturación mensual</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Usuarios en la Plataforma</span>
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalUsers} Cuentas</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">4 Roles activos</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Scraper Oficial BCV</span>
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{bcvUsd.toFixed(2)} Bs</span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Cron activo cada 15 min</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: DIRECTORIO DE TENANTS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Directorio de Empresas (Tenants)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Negocios suscritos al SaaS con base de datos multi-tenant</p>
                </div>

                <div className="w-full sm:w-64 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por RIF o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Empresa / Razón Social</th>
                      <th className="p-3.5">RIF Fiscal</th>
                      <th className="p-3.5">Plan</th>
                      <th className="p-3.5">Sucursales / Usuarios</th>
                      <th className="p-3.5">Cuota Mensual</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{t.name}</td>
                        <td className="p-3.5 font-mono text-amber-600 dark:text-amber-400 font-bold">{t.rif}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
                            {t.plan}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {t.storesCount} sucursales • {t.usersCount} usuarios
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${t.monthlyFeeUSD.toFixed(2)} USD
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                            ACTIVO
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button className="text-amber-600 dark:text-amber-400 hover:underline font-semibold">
                            Gestionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        <BcvHistoryModal isOpen={isBcvModalOpen} onClose={() => setIsBcvModalOpen(false)} />
      </div>
    </RoleGuard>
  );
}
