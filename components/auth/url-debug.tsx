'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function UrlDebug() {
  const [urls, setUrls] = useState({
    current: '',
    appUrl: '',
    origin: '',
    host: '',
  })

  useEffect(() => {
    setUrls({
      current: window.location.href,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      origin: window.location.origin,
      host: window.location.host,
    })
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>URL Configuration Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Current URL:</span>
            <Badge variant="outline">{urls.current}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">NEXT_PUBLIC_APP_URL:</span>
            <Badge variant={urls.appUrl === 'Not set' ? 'destructive' : 'default'}>
              {urls.appUrl}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Window Origin:</span>
            <Badge variant="outline">{urls.origin}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Window Host:</span>
            <Badge variant="outline">{urls.host}</Badge>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Required Supabase Settings:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Site URL: https://cloudeleavepro.vercel.app</li>
            <li>• Redirect URLs: https://cloudeleavepro.vercel.app/auth/callback</li>
            <li>• Additional Redirect URLs: https://cloudeleavepro.vercel.app/**</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
