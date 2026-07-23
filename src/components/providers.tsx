'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light">
      {children}
      <Toaster position="top-right" richColors closeButton />
    </NextThemesProvider>
  );
}
