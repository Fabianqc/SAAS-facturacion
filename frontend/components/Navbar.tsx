'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, ShieldCheck, Store, UserCheck, ShoppingBag, RefreshCw } from 'lucide-react';
import { Role } from '../types/auth';

const ROLE_CONFIG: Record<Role, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  SUPER_ADMIN: { label: 'SuperAdmin SaaS', bg: 'bg-amber-500/10 border-amber-500/30', color: 'text-amber-400', icon: ShieldCheck },
  STORE_ADMIN: { label: 'Admin Tienda', bg: 'bg-indigo-500/10 border-indigo-500/30', color: 'text-indigo-400', icon: Store },
  SUPERVISOR: { label: 'Supervisor Cajas', bg: 'bg-violet-500/10 border-violet-500/30', color: 'text-violet-400', icon: UserCheck },
  CASHIER: { label: 'Cajera / POS', bg: 'bg-emerald-500/10 border-emerald-500/30', color: 'text-emerald-400', icon: ShoppingBag },
};

interface BcvRates {
  usd: number;
  eur: number;
}

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bcvRates, setBcvRates] = useState<BcvRates | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchBcvRates = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/bcv/current');
      if (res.ok) {
        const data = await res.json();
        if (data.usd && data.eur) {
          setBcvRates({ usd: data.usd, eur: data.eur });
        }
      }
    } catch (e) {
      console.error('Error cargando tasas BCV:', e);
    }
  };

  const syncBcvRates = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:3001/api/bcv/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.usd && data.eur) {
          setBcvRates({ usd: data.usd, eur: data.eur });
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

  if (!user) return null;

  const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.CASHIER;
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-white leading-none block">SaaS Facturación VE</span>
            <span className="text-[10px] text-slate-400">
              {user.tenant ? user.tenant.name : 'Plataforma SaaS Global'}
            </span>
          </div>
        </button>

        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${roleInfo.bg} ${roleInfo.color}`}>
          <RoleIcon className="w-3.5 h-3.5" />
          <span>{roleInfo.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Scraped Dual BCV Indicators ($ USD & € EUR) */}
        <div className="flex items-center gap-3 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">USD:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {bcvRates ? `${bcvRates.usd.toFixed(2)} Bs` : '...'}
            </span>
          </div>

          <div className="w-px h-3.5 bg-slate-800"></div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">EUR:</span>
            <span className="font-bold text-cyan-400 font-mono">
              {bcvRates ? `${bcvRates.eur.toFixed(2)} Bs` : '...'}
            </span>
          </div>

          <button
            onClick={syncBcvRates}
            disabled={isSyncing}
            title="Sincronizar tasas BCV oficiales (USD & EUR) en tiempo real desde bcv.org.ve"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all disabled:opacity-50 ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
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
  );
};
