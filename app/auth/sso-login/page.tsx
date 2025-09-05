'use client'

import { Button } from '@/components/ui/button'

const PROVIDERS = [
  { name: 'Google', id: 'google' },
  { name: 'Azure AD', id: 'azure' },
  { name: 'Okta', id: 'okta' },
]

export default function SSOLoginPage() {
  const handleSSO = (provider: string) => {
    window.location.href = `/api/auth/login?provider=${provider}`
  }

  return (
    <div className="max-w-md mx-auto py-16 space-y-6 text-center">
      <h1 className="text-2xl font-bold mb-6">Sign in with SSO</h1>
      {PROVIDERS.map(p => (
        <Button key={p.id} className="w-full mb-2" onClick={() => handleSSO(p.id)}>
          Sign in with {p.name}
        </Button>
      ))}
    </div>
  )
}
