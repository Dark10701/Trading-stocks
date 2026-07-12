import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "PaperTrade — Virtual Stock Trading",
  description:
    "Learn US stock market investing with a risk-free paper trading simulator. Track positions, execute trades, and review AI-powered debriefs.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PaperTrade",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#121218",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>
          <Navbar />
          {/* Bottom padding clears the mobile tab bar (hidden on md+) */}
          <main className="flex-1 pb-24 md:pb-0">{children}</main>
          <footer className="hidden md:block border-t border-border/40 py-5">
            <p className="container mx-auto px-6 text-center text-xs text-muted-foreground">
              PaperTrade is a paper-trading simulator for learning. Market data
              may be delayed. Nothing here is financial advice.
            </p>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
