import type { Metadata } from 'next'
import * as Sentry from '@sentry/nextjs'
import ClientLayoutShell from '@/components/ClientLayoutShell'

export const metadata: Metadata = {
  // ... your static metadata
  other: {
    ...Sentry.getTraceData(),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayoutShell>{children}</ClientLayoutShell>
      </body>
    </html>
  )
}
