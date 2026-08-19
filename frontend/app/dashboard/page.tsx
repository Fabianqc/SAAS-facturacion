'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Store,
  ShoppingBag,
  LogOut,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Printer,
  CreditCard,
  Building2,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // POS State (para la vista de cajera)
  const [cart, setCart] = useState<{ id: string; name: string; priceUSD: number; taxExempt: boolean; qty: number }[]>([
    { id: '1', name: 'Harina de Maíz Precocida 1Kg', priceUSD: 1.2, taxExempt: true, qty: 2 },
    { id: '2', name: 'Powerbank 10000mAh', priceUSD: 25.0, taxExempt: false, qty: 1 },
  ]);
  const [bcvRate, setBcvRate] = useState<number>(773.3125);
  const [isInvoiceDone, setIsInvoiceDone] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rate) setBcvRate(data.rate);
      })
      .catch(console.error);

    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando perfil...</span>
        </div>
      </div>
    );
  }

  const roleBadges: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    SUPER_ADMIN: { label: 'SuperAdmin SaaS', bg: 'bg-amber-500/10 border-amber-500/30', color: 'text-amber-400', icon: ShieldCheck },
    STORE_ADMIN: { label: 'Admin Tienda', bg: 'bg-indigo-500/10 border-indigo-500/30', color: 'text-indigo-400', icon: Store },
    CASHIER: { label: 'Cajera / POS', bg: 'bg-emerald-500/10 border-emerald-500/30', color: 'text-emerald-400', icon: ShoppingBag },
  };

  const currentRoleInfo = roleBadges[user.role] || roleBadges.CASHIER;
  const RoleIcon = currentRoleInfo.icon;

  // Calculos POS
  const subtotalUSD = cart.reduce((acc, item) => acc + item.priceUSD * item.qty, 0);
  const taxUSD = cart.reduce((acc, item) => (item.taxExempt ? acc : acc + item.priceUSD * item.qty * 0.16), 0);
  const totalUSD = subtotalUSD + taxUSD;
  const totalVES = totalUSD * bcvRate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">SaaS Facturación VE</span>
              <p className="text-[10px] text-slate-400">
                {user.tenant ? user.tenant.name : 'Plataforma SaaS Global'}
              </p>
            </div>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${currentRoleInfo.bg} ${currentRoleInfo.color}`}>
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{currentRoleInfo.label}</span>
          </div>
        </div>

        {/* Right Info & Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Tasa BCV:</span>
            <span className="font-bold text-emerald-400">{bcvRate.toFixed(2)} VES/USD</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              title="Cerrar sesión"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700/50 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Banner de Bienvenida personalizado */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
              <RoleIcon className="w-3.5 h-3.5" />
              <span>Sesión activa como {currentRoleInfo.label}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¡Bienvenido(a), {user.firstName}!
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              {user.role === 'SUPER_ADMIN' && 'Gestión global del sistema SaaS, control de clientes, planes y facturación recurrente.'}
              {user.role === 'STORE_ADMIN' && 'Panel de control de Sucursal Las Mercedes. Gestión de inventario, ventas y cierres fiscales.'}
              {user.role === 'CASHIER' && 'Terminal de Punto de Venta (POS) activo. Listo para emitir facturas bi-monedas ($ / Bs).'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'CASHIER' ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Caja 01 - Abierta</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                Plan Premium • RIF: J-123456789
              </div>
            )}
          </div>
        </div>

        {/* RENDERIZADO CONDICIONAL POR ROL */}

        {/* 1. VISTA DE SUPER_ADMIN */}
        {user.role === 'SUPER_ADMIN' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Tenants Activos</span>
                  <Building2 className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">12 Empresas</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center">+2 este mes</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Ingresos Recurrentes (MRR)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">$1,450.00</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center">+18%</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Usuarios Globales</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">48 Usuarios</span>
                  <span className="text-xs text-slate-400 font-medium">3 Roles</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Estado del Sistema</span>
                  <PackageCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">99.9% Operational</span>
                  <span className="text-xs text-emerald-400 font-medium">Saludable</span>
                </div>
              </div>
            </div>

            {/* Admin Table */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Clientes / Tenants Registrados</h3>
                  <p className="text-xs text-slate-400">Listado de empresas bajo la plataforma SaaS</p>
                </div>
                <button className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4" /> Nuevo Tenant
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Empresa</th>
                      <th className="p-3">RIF</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 rounded-r-xl">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white">Inversiones Y Tienda Venzla, C.A.</td>
                      <td className="p-3 font-mono">J-123456789</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">PREMIUM</span></td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ACTIVO</span></td>
                      <td className="p-3"><button className="text-indigo-400 hover:underline">Administrar</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. VISTA DE STORE_ADMIN */}
        {user.role === 'STORE_ADMIN' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Ventas de Hoy ($)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-2xl font-bold text-white">$450.00 USD</span>
                  <p className="text-xs text-slate-400">22,500.00 VES (BCV 50.00)</p>
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

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Alertas de Inventario</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-2xl font-bold text-rose-400">2 Productos</span>
                  <p className="text-xs text-slate-400">Bajo del stock mínimo</p>
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Sucursal Activa</span>
                  <Store className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-bold text-white truncate block">Las Mercedes</span>
                  <p className="text-xs text-slate-400">Caracas, Venezuela</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all text-left group">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Plus className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h4 className="font-bold text-white text-sm">Agregar Nuevo Producto</h4>
                <p className="text-xs text-slate-400 mt-1">Configura precio en USD, IVA y código de barras.</p>
              </button>

              <button className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all text-left group">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h4 className="font-bold text-white text-sm">Actualizar Tasa BCV</h4>
                <p className="text-xs text-slate-400 mt-1">Cambia la tasa oficial del dólar para cobros en Bolívares.</p>
              </button>

              <button className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-violet-500/50 transition-all text-left group">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                    <Printer className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <h4 className="font-bold text-white text-sm">Reporte X / Cierre Z (SENIAT)</h4>
                <p className="text-xs text-slate-400 mt-1">Genera el reporte fiscal diario obligatorio.</p>
              </button>
            </div>
          </div>
        )}

        {/* 3. VISTA DE CAJERA (POS TERMINAL) */}
        {user.role === 'CASHIER' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Product Selector */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" /> Catálogo de Productos
                </h3>
                <span className="text-xs text-slate-400">Punto de Venta Activo</span>
              </div>

              {/* Product Cards */}
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
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-base font-bold text-emerald-400">$1.20 USD</span>
                      <p className="text-[10px] text-slate-400">{(1.2 * bcvRate).toFixed(2)} VES</p>
                    </div>
                    <span className="text-xs text-slate-400">Stock: 100</span>
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
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-base font-bold text-emerald-400">$25.00 USD</span>
                      <p className="text-[10px] text-slate-400">{(25.0 * bcvRate).toFixed(2)} VES</p>
                    </div>
                    <span className="text-xs text-slate-400">Stock: 15</span>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
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

            {/* Right: Invoice Receipt & Totals */}
            <div className="lg:col-span-5">
              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">Factura N° FAC-01-00001</h3>
                    <p className="text-[10px] text-slate-400">Impresora Fiscal SENIAT • Serie 00</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    Borrador
                  </span>
                </div>

                {/* Items List */}
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

                {/* Summary Calculations */}
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
                  <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">TOTAL USD:</span>
                      <p className="text-xs text-emerald-400 font-bold">TOTAL VES (BCV):</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-white">${totalUSD.toFixed(2)} USD</span>
                      <p className="text-sm font-extrabold text-emerald-400">{totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
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
        )}
      </main>
    </div>
  );
}
