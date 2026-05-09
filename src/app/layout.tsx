import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";

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
    statusBarStyle: "default",
    title: "Indico",
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
      </head>
      <body suppressHydrationWarning>
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
