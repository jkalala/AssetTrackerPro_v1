'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Building2, CreditCard, Users, Settings, Shield, Bell, Key } from 'lucide-react'

interface SettingsLink {
  href: string
  label: string
  icon: React.ElementType
  description: string
}

const settingsLinks: SettingsLink[] = [
  {
    href: '/settings/tenant',
    label: 'Organization',
    icon: Building2,
    description: 'Manage your organization settings',
  },
  {
    href: '/settings/billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Manage your subscription and billing',
  },
  {
    href: '/settings/team',
    label: 'Team',
    icon: Users,
    description: 'Manage team members and roles',
  },
  {
    href: '/settings/security',
    label: 'Security',
    icon: Shield,
    description: 'Security settings and authentication',
  },
  {
    href: '/settings/notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Configure notification preferences',
  },
  {
    href: '/settings/api',
    label: 'API',
    icon: Key,
    description: 'API keys and integration settings',
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="space-y-2">
            {settingsLinks.map(link => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{link.label}</div>
                    <p className="text-sm text-gray-500 hidden md:block">{link.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
