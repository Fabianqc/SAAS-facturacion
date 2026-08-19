'use client';

import React from 'react';
import { RoleGuard } from '../../components/RoleGuard';
import { Navbar } from '../../components/Navbar';
import { Building2, DollarSign, Users, PackageCheck, Plus, Search, ShieldCheck } from 'lucide-react';

export default function SaasMasterPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Portal Administrador Global (URL: /saasmaster)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                SaaS Master Control Panel
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Control global de empresas multi-tenant, suscripciones, facturación recurrente e infraestructura.
              </p>
            </div>

            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Registrar Nueva Empresa / Tenant
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Empresas (Tenants)</span>
                <Building2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">12 Activas</span>
                <span className="text-xs text-emerald-400 font-medium">+2 este mes</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Ingresos Recurrentes (MRR)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">$1,450.00 /mes</span>
                <span className="text-xs text-emerald-400 font-medium">+18%</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Usuarios Registrados</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">48 Usuarios</span>
                <span className="text-xs text-slate-400 font-medium">4 Roles</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Servicios & APIs</span>
                <PackageCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-400">99.9% Uptime</span>
                <span className="text-xs text-slate-400 font-medium">PostgreSQL + Redis</span>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Directorio de Empresas (Tenants)</h3>
                <p className="text-xs text-slate-400">Clientes suscritos a la plataforma SaaS</p>
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por RIF o nombre..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Empresa</th>
                    <th className="p-3.5">RIF Fiscal</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Registro</th>
                    <th className="p-3.5 rounded-r-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-3.5 font-semibold text-white">Inversiones Y Tienda Venzla, C.A.</td>
                    <td className="p-3.5 font-mono">J-123456789</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px]">PREMIUM</span></td>
                    <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">ACTIVO</span></td>
                    <td className="p-3.5 text-slate-400">19/08/2026</td>
                    <td className="p-3.5"><button className="text-amber-400 hover:underline">Gestionar Tenant</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
