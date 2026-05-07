import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";

export const metadata: Metadata = {
  title: "Indico | The Creator-First Social Media Platform",
  description: "A next-generation creator-first social media app where new creators can go viral easily based on content quality, watch time, and shares instead of follower count.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-layout">
          <Sidebar />
          <main className="main-feed-area">
            {children}
          </main>
          <RightSidebar />
        </div>
      </body>
    </html>
  );
}
