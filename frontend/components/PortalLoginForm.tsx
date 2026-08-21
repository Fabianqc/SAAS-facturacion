'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, ArrowRight, RefreshCw, AlertCircle, Building, Sun, Moon } from 'lucide-react';
import { Role } from '../types/auth';

interface PortalLoginFormProps {
  expectedRole: Role;
  targetPath: string;
  portalTitle: string;
  portalSubtitle: string;
  icon: React.ElementType;
  defaultEmail: string;
  badge: string;
  colorScheme: 'amber' | 'indigo' | 'violet' | 'emerald';
}

const ROLE_NAME_MAP: Record<Role, { name: string; loginPath: string }> = {
  SUPER_ADMIN: { name: 'SuperAdmin SaaS', loginPath: '/saasmaster/login' },
  STORE_ADMIN: { name: 'Admin de Empresa', loginPath: '/adminnegocio/login' },
  SUPERVISOR: { name: 'Supervisor de Cajas', loginPath: '/supervisor/login' },
  CASHIER: { name: 'Cajero / POS', loginPath: '/pos/login' },
};

export const PortalLoginForm: React.FC<PortalLoginFormProps> = ({
  expectedRole,
  targetPath,
  portalTitle,
  portalSubtitle,
  icon: Icon,
  defaultEmail,
  badge,
}) => {
  const router = useRouter();
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bcvRate, setBcvRate] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.usd) setBcvRate(data.usd);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      if (data.user.role !== expectedRole && data.user.role !== 'SUPER_ADMIN') {
        const correctInfo = ROLE_NAME_MAP[data.user.role as Role] || { name: 'otro portal', loginPath: '/' };
        throw new Error(
          `Acceso denegado: Tu usuario tiene rol "${correctInfo.name}". Debes ingresar desde su portal (${correctInfo.loginPath}).`,
        );
      }

      login(data.accessToken, data.user);
      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor backend');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-blue-600 flex items-center justify-center">
            <Building className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">SaaS Facturación</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Plataforma Fiscal VE</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <span>{bcvRate ? `BCV ${bcvRate.toFixed(2)} Bs` : 'BCV Oficial'}</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            title="Cambiar modo claro / oscuro"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Login Form */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {/* Title Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                {badge}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{portalTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{portalSubtitle}</p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <p>
              📧 Correo: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[11px]">{defaultEmail}</code>
            </p>
            <p>
              🔑 Clave: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[11px]">password123</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-slate-400">
        <p>© 2026 SaaS Facturación Fiscal VE</p>
      </footer>
    </div>
  );
};
