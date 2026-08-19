'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
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

const COLOR_CLASSES = {
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'bg-amber-500/20',
    button: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950',
    ring: 'focus:ring-amber-500/50 focus:border-amber-500',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    glow: 'bg-indigo-600/20',
    button: 'from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white',
    ring: 'focus:ring-indigo-500/50 focus:border-indigo-500',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'bg-violet-600/20',
    button: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white',
    ring: 'focus:ring-violet-500/50 focus:border-violet-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'bg-emerald-600/20',
    button: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
    ring: 'focus:ring-emerald-500/50 focus:border-emerald-500',
  },
};

const ROLE_NAME_MAP: Record<Role, { name: string; loginPath: string }> = {
  SUPER_ADMIN: { name: 'SuperAdmin SaaS', loginPath: '/saasmaster/login' },
  STORE_ADMIN: { name: 'Admin de Negocio', loginPath: '/adminnegocio/login' },
  SUPERVISOR: { name: 'Supervisor de Cajas', loginPath: '/supervisor/login' },
  CASHIER: { name: 'Cajera / POS', loginPath: '/pos/login' },
};

export const PortalLoginForm: React.FC<PortalLoginFormProps> = ({
  expectedRole,
  targetPath,
  portalTitle,
  portalSubtitle,
  icon: Icon,
  defaultEmail,
  badge,
  colorScheme,
}) => {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const theme = COLOR_CLASSES[colorScheme];

  const [bcvRate, setBcvRate] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/bcv/current')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rate) setBcvRate(data.rate);
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

      // Validar si el rol coincide con el portal actual
      if (data.user.role !== expectedRole && data.user.role !== 'SUPER_ADMIN') {
        const correctInfo = ROLE_NAME_MAP[data.user.role as Role] || { name: 'otro portal', loginPath: '/' };
        throw new Error(
          `Acceso denegado: Tu cuenta tiene rol "${correctInfo.name}". Debes ingresar desde su portal correspondiente (${correctInfo.loginPath}).`
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-3 px-6 rounded-2xl glass-card border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight">SaaS Facturación VE</h1>
            <p className="text-[10px] text-slate-400">Sistema Fiscal Venezuela</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{bcvRate ? `BCV ${bcvRate.toFixed(2)}` : 'BCV Real'}</span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
          {/* Background Glow */}
          <div className={`absolute -top-20 -right-20 w-44 h-44 ${theme.glow} rounded-full blur-3xl pointer-events-none`}></div>

          {/* Title Header */}
          <div className="space-y-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className={`p-2 rounded-xl ${theme.bg} ${theme.border} ${theme.text} border`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${theme.bg} ${theme.border} ${theme.text} border`}>
                {badge}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">{portalTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">{portalSubtitle}</p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm transition-all focus:outline-none focus:ring-2 ${theme.ring}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm transition-all focus:outline-none focus:ring-2 ${theme.ring}`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${theme.button} font-bold text-sm shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando acceso...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-1.5 text-xs text-slate-400">
            <p>
              📧 Correo demo: <code className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">{defaultEmail}</code>
            </p>
            <p>
              🔑 Contraseña demo: <code className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">password123</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center py-3 text-[11px] text-slate-500">
        <p>© 2026 SaaS Facturación VE • SENIAT & BCV Compliant</p>
      </footer>
    </div>
  );
};
