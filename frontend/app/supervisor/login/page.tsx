'use client';

import React from 'react';
import { PortalLoginForm } from '../../../components/PortalLoginForm';
import { UserCheck } from 'lucide-react';

export default function SupervisorLoginPage() {
  return (
    <PortalLoginForm
      expectedRole="SUPERVISOR"
      targetPath="/supervisor"
      portalTitle="Portal Supervisor de Cajas"
      portalSubtitle="Asignación de cajeras a cajas registradoras, apertura de turnos y arqueos"
      icon={UserCheck}
      defaultEmail="supervisor@tiendave.com"
      badge="Supervisión de Cajas"
      colorScheme="violet"
    />
  );
}
