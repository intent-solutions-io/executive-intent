'use client';

import { ToastProvider } from '@/components/ui';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

