'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
        return;
      }

      // Si el rol del usuario no está dentro de los permitidos, redirigir a su URL correspondiente
      if (!allowedRoles.includes(user.role)) {
        switch (user.role) {
          case 'SUPER_ADMIN':
            router.push('/saasmaster');
            break;
          case 'STORE_ADMIN':
            router.push('/adminnegocio');
            break;
          case 'SUPERVISOR':
            router.push('/supervisor');
            break;
          case 'CASHIER':
            router.push('/pos');
            break;
          default:
            router.push('/');
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-medium">Verificando credenciales y permisos...</span>
      </div>
    );
  }

  return <>{children}</>;
};
