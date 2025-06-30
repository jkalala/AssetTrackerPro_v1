import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth/auth-provider"
import ErrorBoundary from "@/components/error-boundary"
import { SessionSync } from "@/components/session-sync"
import { BrandingProvider, useBranding } from "@/components/branding-provider"
import { useEffect } from "react"
import HelpdeskWidget from "@/components/helpdesk-widget"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AssetTracker Pro - Professional Asset Management System",
  description:
    "Comprehensive asset management solution with QR code integration, real-time tracking, and advanced analytics for businesses.",
  keywords: "asset management, QR codes, inventory tracking, business tools, asset tracking",
    generator: 'v0.dev'
}

function BrandingStyle() {
  const branding = useBranding();
  if (!branding) return null;
  return (
    <style>{`
      body {
        --branding-primary: ${branding.primaryColor || "#2563eb"};
        --branding-secondary: ${branding.secondaryColor || "#f1f5f9"};
      }
    `}</style>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <BrandingProvider>
                <SessionSync />
                <BrandingStyle />
                {children}
                <Toaster />
                <HelpdeskWidget />
              </BrandingProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
