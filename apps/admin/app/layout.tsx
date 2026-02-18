import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: 'Real Estate Admin Control Plane',
  description: 'Tenant provisioning and platform operations dashboard.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>{children}</body>
    </html>
  );

  if (!publishableKey) {
    return content;
  }

  return <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>;
}
