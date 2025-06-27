import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth/auth-provider"
import ErrorBoundary from "@/components/error-boundary"
import { SessionSync } from "@/components/session-sync"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AssetTracker Pro - Professional Asset Management System",
  description:
    "Comprehensive asset management solution with QR code integration, real-time tracking, and advanced analytics for businesses.",
  keywords: "asset management, QR codes, inventory tracking, business tools, asset tracking",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <SessionSync />
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
