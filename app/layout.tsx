import type { Metadata } from 'next';
import './globals.css';
import { EVENT_CONFIG } from '@/lib/event-config';

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.eventName} - Software Problem Statement Allocation Portal`,
  description: `Official Problem Statement Allocation Portal for ${EVENT_CONFIG.eventName} conducted by ${EVENT_CONFIG.institution.collegeName}. National Level 24-Hour Hackathon.`,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="cyber-grid-bg text-text-primary antialiased selection:bg-electric-blue selection:text-background min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
