import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';

import './globals.css';

export const metadata: Metadata = {
  title: 'DevForge — Decentralized Technical Work & Milestone Escrow',
  description:
    'A decentralized marketplace for Web3 freelance work secured by milestone escrow smart contracts on Ethereum Sepolia.',
  keywords: [
    'Web3 freelancing',
    'smart contract escrow',
    'Ethereum Sepolia',
    'Solidity developer',
    'Rust auditor',
    'non-custodial milestone',
  ],
  authors: [{ name: 'DevForge Protocol' }],
  metadataBase: new URL('https://devforge-web-8bv4.vercel.app'),
  openGraph: {
    title: 'DevForge — Decentralized Technical Work & Milestone Escrow',
    description:
      'Pre-funded milestone smart contract escrow for Web3 engineers, security researchers, and technical teams on Ethereum Sepolia.',
    url: 'https://devforge-web-8bv4.vercel.app',
    siteName: 'DevForge Protocol',
    images: [
      {
        url: '/og-preview.png',
        width: 1200,
        height: 630,
        alt: 'DevForge Protocol — Milestone Escrow',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevForge — Decentralized Technical Work & Milestone Escrow',
    description:
      'Hire elite Web3 engineers with pre-funded on-chain milestone escrow protection on Ethereum Sepolia.',
    images: ['/og-preview.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'DevForge Protocol',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web3 / Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              description:
                'Decentralized marketplace for technical Web3 work secured by smart contract milestone escrow.',
            }),
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <Navigation />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
