import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Real Estate Admin Control Plane',
  description: 'Tenant provisioning and platform operations dashboard.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  if (!publishableKey) {
    return content;
  }

  return <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>;
}
