'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  Store,
  UserCheck,
  ShoppingBag,
  ArrowRight,
  Building,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';

const PORTAL_GATEWAYS = [
  {
    title: 'SuperAdmin SaaS',
    subtitle: 'Administración Global de Tenants & Empresas',
    path: '/saasmaster/login',
    icon: ShieldCheck,
    badge: 'Master SaaS',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    demoEmail: 'admin@saasve.com',
  },
  {
    title: 'Admin de Negocio',
    subtitle: 'Gestión de Inventario, Proveedores & Tasa BCV',
    path: '/adminnegocio/login',
    icon: Store,
    badge: 'Gerencia Tienda',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    demoEmail: 'gerente@tiendave.com',
  },
  {
    title: 'Supervisor de Cajas',
    subtitle: 'Asignación de Cajeras & Control de Turnos',
    path: '/supervisor/login',
    icon: UserCheck,
    badge: 'Supervisión',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    demoEmail: 'supervisor@tiendave.com',
  },
  {
    title: 'Terminal Punto de Venta (POS)',
    subtitle: 'Facturación Fiscal SENIAT & Cobro Multi-Moneda',
    path: '/pos/login',
    icon: ShoppingBag,
    badge: 'Cajeras / POS',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    demoEmail: 'cajero@tiendave.com',
  },
];

export default function RootGatewayPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [bcvRate, setBcvRate] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd) setBcvRate(data.usd);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 transition-colors">
      {/* Top Banner */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-3 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center shadow-sm">
            <Building className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              SaaS Facturación Fiscal VE
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Plataforma Fiscal Multi-Tenant Venezuela
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Tasa Oficial BCV:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {bcvRate ? `${bcvRate.toFixed(2)} Bs` : 'Cargando...'}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            title={`Cambiar a modo ${resolvedTheme === 'dark' ? 'claro' : 'oscuro'}`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto my-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Accesos por Perfil de Usuario
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Portales de Acceso al Sistema
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Selecciona el módulo correspondiente para iniciar sesión con tus credenciales asignadas.
          </p>
        </div>

        {/* Portal Gateway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {PORTAL_GATEWAYS.map((gateway) => {
            const Icon = gateway.icon;

            return (
              <Link
                key={gateway.path}
                href={gateway.path}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${gateway.bgColor} ${gateway.color} border ${gateway.borderColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {gateway.path}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {gateway.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{gateway.subtitle}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{gateway.demoEmail}</span>
                  <div className={`flex items-center gap-1 font-semibold ${gateway.color}`}>
                    <span>Ingresar</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <p>© 2026 SaaS Facturación & POS Venezuela • SENIAT / IGTF / BCV Compliant</p>
      </footer>
    </div>
  );
}
