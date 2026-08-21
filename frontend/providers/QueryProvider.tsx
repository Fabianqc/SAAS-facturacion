'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutos de cache fresco
            gcTime: 1000 * 60 * 15, // 15 minutos en memoria
            refetchOnWindowFocus: false,
            retry: 3,
            // Reintentos con tiempo escalado (exponencial) y aleatoriedad (jitter) para evitar saturación
            retryDelay: (attemptIndex) => {
              const exponentialDelay = 1000 * Math.pow(2, attemptIndex); // 1s, 2s, 4s, 8s...
              const randomJitter = Math.floor(Math.random() * 600); // 0 a 600ms aleatorios
              return Math.min(exponentialDelay + randomJitter, 30000); // Máximo 30s
            },
          },
          mutations: {
            retry: 1,
            retryDelay: () => 1000 + Math.floor(Math.random() * 500),
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
