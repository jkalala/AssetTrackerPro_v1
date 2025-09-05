'use client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth/auth-provider'
import ErrorBoundary from '@/components/error-boundary'
import { SessionSync } from '@/components/session-sync'
import { BrandingProvider, useBranding } from '@/components/branding-provider'
import HelpdeskWidget from '@/components/helpdesk-widget'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

function BrandingStyle() {
  const branding = useBranding()
  if (!branding) return null
  return (
    <style>{`
      body {
        --branding-primary: ${branding.primaryColor || '#2563eb'};
        --branding-secondary: ${branding.secondaryColor || '#f1f5f9'};
      }
    `}</style>
  )
}

function LanguageSwitcher() {
  const router = useRouter()
  const { i18n } = useTranslation()
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }
  return (
    <select onChange={e => changeLanguage(e.target.value)} value={i18n.language} className="ml-2">
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="pt">Português</option>
    </select>
  )
}

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
    }
  }, [])
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <BrandingProvider>
            <SessionSync />
            <BrandingStyle />
            <header className="flex items-center justify-end p-2">
              <LanguageSwitcher />
            </header>
            {children}
            <Toaster />
            <HelpdeskWidget />
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
