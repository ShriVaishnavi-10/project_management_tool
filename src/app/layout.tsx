import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskPulse | Project Management Application',
  description: 'A modern, full-stack Project Management Tool inspired by Jira, Asana, and ClickUp powered by Next.js & Supabase.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-100 text-slate-900 antialiased selection:bg-blue-200 selection:text-blue-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
