"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface DemoUser {
  id: string
  email: string
  name: string
  role: string
}

interface DemoAuthContextType {
  user: DemoUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined)

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored demo user
    const storedUser = localStorage.getItem('demo-user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Demo authentication - accept any credentials
    const demoUser: DemoUser = {
      id: 'demo-user-1',
      email,
      name: email.split('@')[0],
      role: 'admin'
    }
    
    setUser(demoUser)
    localStorage.setItem('demo-user', JSON.stringify(demoUser))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('demo-user')
  }

  return (
    <DemoAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </DemoAuthContext.Provider>
  )
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext)
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider')
  }
  return context
}