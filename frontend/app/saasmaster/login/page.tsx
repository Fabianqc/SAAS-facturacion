'use client';

import React from 'react';
import { PortalLoginForm } from '../../../components/PortalLoginForm';
import { ShieldCheck } from 'lucide-react';

export default function SaasMasterLoginPage() {
  return (
    <PortalLoginForm
      expectedRole="SUPER_ADMIN"
      targetPath="/saasmaster"
      portalTitle="Portal SuperAdmin SaaS"
      portalSubtitle="Acceso al panel de control global de empresas, suscripciones e infraestructura"
      icon={ShieldCheck}
      defaultEmail="admin@saasve.com"
      badge="SaaS Master Master-Access"
      colorScheme="amber"
    />
  );
}
