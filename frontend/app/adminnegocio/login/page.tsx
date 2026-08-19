'use client';

import React from 'react';
import { PortalLoginForm } from '../../../components/PortalLoginForm';
import { Store } from 'lucide-react';

export default function AdminNegocioLoginPage() {
  return (
    <PortalLoginForm
      expectedRole="STORE_ADMIN"
      targetPath="/adminnegocio"
      portalTitle="Portal Admin de Negocio"
      portalSubtitle="Gestión de inventarios, productos bi-moneda ($/Bs), sucursales y tasa BCV"
      icon={Store}
      defaultEmail="gerente@tiendave.com"
      badge="Administración de Tienda"
      colorScheme="indigo"
    />
  );
}
