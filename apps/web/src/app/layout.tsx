import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { AuthProvider } from '@/context/AuthContext';

import './globals.css';

export const metadata: Metadata = {
  title: 'DevForge — Decentralized Technical Work & Escrow',
  description:
    'A decentralized marketplace for technical freelance work secured by non-custodial milestone escrow.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
