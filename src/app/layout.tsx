import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import ChunkErrorHandler from "@/components/ChunkErrorHandler";
import E2EEInitializer from "@/components/E2EEInitializer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Indico | The Creator-First Social Media Platform",
    template: "%s | Indico",
  },
  description: "A next-generation creator-first social media app where new creators can go viral easily based on content quality, watch time, and shares instead of follower count.",
  manifest: "/manifest.json",
  keywords: ["social media", "creators", "viral", "content quality", "Indico", "creator economy"],
  authors: [{ name: "Indico Team" }],
  creator: "Indico",
  publisher: "Indico",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://indicosocial.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://indicosocial.in',
    siteName: 'Indico',
    title: 'Indico | The Creator-First Social Media Platform',
    description: 'A next-generation creator-first social media app where new creators can go viral easily.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Indico Social Media',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indico | The Creator-First Social Media Platform',
    description: 'A next-generation creator-first social media app where new creators can go viral easily.',
    images: ['/og-image.png'],
    creator: '@indico_live',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Indico",
    startupImage: "/icon.png",
  },
  verification: {
    google: "7cyOiAkcJXv0Zbrp08yj7NZa2T2nnMiY3SUjsF-Rtyc",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Indico",
    "apple-mobile-web-app-title": "Indico",
    "theme-color": "#8a2be2",
    "msapplication-navbutton-color": "#8a2be2",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-starturl": "/",
    "msapplication-TileColor": "#0a0a0f",
    "msapplication-TileImage": "/icon-512x512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body suppressHydrationWarning>
        <Toaster position="top-center" toastOptions={{
          style: {
            background: 'var(--bg-glass)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
          },
        }} />
        <RealtimeRefresh />
        <ChunkErrorHandler />
        <E2EEInitializer />
        <div className="app-layout">
          <Sidebar />
          <main className="main-feed-area">
            {children}
          </main>
          <RightSidebar />
        </div>
        {/* Bottom nav shown only on mobile via CSS */}
        <BottomNav />
        <PWARegister />
      </body>
    </html>
  );
}
