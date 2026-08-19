'use client';

import React from 'react';
import { PortalLoginForm } from '../../../components/PortalLoginForm';
import { ShoppingBag } from 'lucide-react';

export default function PosLoginPage() {
  return (
    <PortalLoginForm
      expectedRole="CASHIER"
      targetPath="/pos"
      portalTitle="Terminal Punto de Venta (POS)"
      portalSubtitle="Ingreso para cajeras en turno asignado. Emisión de facturas fiscales SENIAT"
      icon={ShoppingBag}
      defaultEmail="cajero@tiendave.com"
      badge="Cajera / POS Terminal"
      colorScheme="emerald"
    />
  );
}
