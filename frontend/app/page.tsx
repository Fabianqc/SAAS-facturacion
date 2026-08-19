'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Store, UserCheck, ShoppingBag, ArrowRight, Sparkles, CheckCircle2, Lock } from 'lucide-react';

const PORTAL_GATEWAYS = [
  {
    title: 'Portal SuperAdmin SaaS',
    subtitle: 'Administración Global de la Plataforma',
    path: '/saasmaster/login',
    icon: ShieldCheck,
    badge: 'Master Control',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/60',
    demoEmail: 'admin@saasve.com',
  },
  {
    title: 'Portal Admin de Negocio',
    subtitle: 'Gestión de Tienda, Inventarios & Tasa BCV',
    path: '/adminnegocio/login',
    icon: Store,
    badge: 'Gerencia Tienda',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-500/60',
    demoEmail: 'gerente@tiendave.com',
  },
  {
    title: 'Portal Supervisor de Cajas',
    subtitle: 'Asignación de Cajeras & Control de Turnos',
    path: '/supervisor/login',
    icon: UserCheck,
    badge: 'Supervisión Cajas',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/60',
    demoEmail: 'supervisor@tiendave.com',
  },
  {
    title: 'Terminal Punto de Venta (POS)',
    subtitle: 'Cobros Bi-Moneda & Facturación SENIAT',
    path: '/pos/login',
    icon: ShoppingBag,
    badge: 'Cajeras / POS',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
    demoEmail: 'cajero@tiendave.com',
  },
];

export default function RootGatewayPage() {
  const [bcvRate, setBcvRate] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rate) setBcvRate(data.rate);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
      {/* Top Banner */}
      <header className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-6 rounded-2xl glass-card border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              SaaS Facturación VE
            </h1>
            <p className="text-xs text-slate-400">Sistema Multi-Tenant & Fiscal SENIAT</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Tasa BCV del Día:</span>
            <span className="font-semibold text-emerald-400 font-mono">
              {bcvRate ? `${bcvRate.toFixed(2)} VES/USD` : 'Cargando...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto my-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" /> Puertas de Acceso Privadas & Independientes
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Selecciona el <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Portal de Acceso</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Cada sección cuenta con su propio formulario de inicio de sesión aislado en su URL correspondiente.
          </p>
        </div>

        {/* Portal Gateway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PORTAL_GATEWAYS.map((gateway) => {
            const Icon = gateway.icon;

            return (
              <Link
                key={gateway.path}
                href={gateway.path}
                className={`glass-card p-6 rounded-3xl border ${gateway.borderColor} ${gateway.hoverBorder} transition-all duration-300 group hover:-translate-y-1 shadow-xl hover:shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${gateway.bgColor} ${gateway.color} border ${gateway.borderColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${gateway.bgColor} ${gateway.color} border ${gateway.borderColor}`}>
                      URL: {gateway.path}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {gateway.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{gateway.subtitle}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{gateway.demoEmail}</span>
                  <div className={`flex items-center gap-1.5 font-bold ${gateway.color}`}>
                    <span>Ingresar al Login</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        <p>© 2026 SaaS Facturación & POS Multi-Tenant Venezuela. SENIAT / IGTF / BCV Compliant.</p>
      </footer>
    </div>
  );
}
