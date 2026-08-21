'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Building,
  LogOut,
  ShieldCheck,
  Store,
  UserCheck,
  ShoppingBag,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { Role } from '../types/auth';

const ROLE_CONFIG: Record<
  Role,
  { label: string; bg: string; color: string; icon: React.ElementType }
> = {
  SUPER_ADMIN: {
    label: 'SuperAdmin SaaS',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/30',
    color: 'text-amber-700 dark:text-amber-400',
    icon: ShieldCheck,
  },
  STORE_ADMIN: {
    label: 'Admin Empresa',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30',
    color: 'text-blue-700 dark:text-blue-400',
    icon: Store,
  },
  SUPERVISOR: {
    label: 'Supervisor',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500/30',
    color: 'text-violet-700 dark:text-violet-400',
    icon: UserCheck,
  },
  CASHIER: {
    label: 'Cajero / POS',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30',
    color: 'text-emerald-700 dark:text-emerald-400',
    icon: ShoppingBag,
  },
};

interface BcvRates {
  usd: number;
  eur: number;
}

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center shadow-sm">
            <Building className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white leading-none block">
              SaaS Facturación
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {user.tenant ? user.tenant.name : 'Plataforma Fiscal VE'}
            </span>
          </div>
        </button>

        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${roleInfo.bg} ${roleInfo.color}`}
        >
          <RoleIcon className="w-3.5 h-3.5" />
          <span>{roleInfo.label}</span>
        </div>
      </div>

      {/* Right Tools & Theme Selector */}
      <div className="flex items-center gap-3">
        {/* Live BCV Rates Pill */}
        <div className="flex items-center gap-2.5 text-xs bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">USD:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
              {bcvRates ? `${bcvRates.usd.toFixed(2)} Bs` : '...'}
            </span>
          </div>

          <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-800"></div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">EUR:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
              {bcvRates ? `${bcvRates.eur.toFixed(2)} Bs` : '...'}
            </span>
          </div>

          <button
            onClick={syncBcvRates}
            disabled={isSyncing}
            title="Sincronizar tasas BCV oficiales"
            className="p-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 ml-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

        {/* Theme Switcher Toggle */}
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

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            title="Cerrar sesión"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
