import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Cormorant_Garamond, Outfit, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Matt Caiola CRM',
  description: 'Tenant-aware CRM workspace for polished lead and contact management.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>{children}</body>
    </html>
  );

  if (!publishableKey) {
    return content;
  }

  return <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>;
}
