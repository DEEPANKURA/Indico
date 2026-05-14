import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";
import ConfigInitializer from "@/components/ConfigInitializer";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import ChunkErrorHandler from "@/components/ChunkErrorHandler";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Indico | The Creator-First Social Media Platform",
  description: "A next-generation creator-first social media app where new creators can go viral easily based on content quality, watch time, and shares instead of follower count.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Indico",
    startupImage: "/icon.png",
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
  formatDetection: {
    telephone: false,
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
        <ConfigInitializer 
          url={process.env.SUPABASE_URL || ''} 
          anonKey={process.env.SUPABASE_ANON_KEY || ''} 
        />
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
