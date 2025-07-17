"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/components/ui/use-toast'
import { MapPin, Plus, Trash2, Edit, Eye, Shield, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import GeofenceRuleManager from "@/components/geofence-rule-manager"

interface Geofence {
  id: string
  name: string
  polygon: { coordinates: [number, number][][] }
  description?: string
  created_at?: string
}

const GeofenceMapEditor = dynamic(() => import('@/components/geofence-map-editor'), { ssr: false })

export default function GeofenceManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [userRole, setUserRole] = useState('user')
  const [assets, setAssets] = useState<any[]>([])
  const [geofences, setGeofences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchUserRole()
  }, [user])

  useEffect(() => { setShowMap(true) }, [])

  const fetchUserRole = async () => {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      setUserRole(profile?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchGeofences = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/geofence/zones')
      if (!res.ok) {
        throw new Error('Failed to fetch geofences')
      }
      const data = await res.json()
      setGeofences(data.zones || [])
    } catch (err) {
      setError('Failed to load geofences')
      toast({
        title: "Error",
        description: "Failed to load geofence zones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const assetsRes = await fetch("/api/assets?fields=id,asset_id,name")
        const geofencesRes = await fetch("/api/geofence/zones")
        const assetsData = await assetsRes.json()
        const geofencesData = await geofencesRes.json()
        setAssets(assetsData.assets || [])
        setGeofences(geofencesData.zones || [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGeofenceUpdate = async () => {
    await fetchGeofences()
    toast({
      title: "Success",
      description: "Geofence zones updated successfully"
    })
  }

  const handleDeleteGeofence = async (geofenceId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this geofence zone?')) {
      return
    }

    try {
      const res = await fetch('/api/geofence/zones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: geofenceId }),
      })

      if (!res.ok) {
        throw new Error('Failed to delete geofence')
      }

      await fetchGeofences()
      toast({
        title: "Success",
        description: "Geofence zone deleted successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete geofence zone",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access geofence management.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!['admin', 'manager'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Shield className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to manage geofence zones. Only administrators and managers can access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your current role: <Badge variant="outline">{userRole}</Badge>
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <a href="/dashboard">Return to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MapPin className="h-8 w-8 text-blue-600 mr-3" />
                Geofence Management
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage geofence zones for asset location tracking and alerts
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {userRole} Access
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Zones</p>
                  <p className="text-2xl font-bold text-gray-900">{geofences.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Zones</p>
                  <p className="text-2xl font-bold text-gray-900">{geofences.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Alerts Today</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Interactive Map Editor
                </CardTitle>
                <CardDescription>
                  Draw, edit, and manage geofence zones on the interactive map
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {loading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading geofence zones...</p>
                    </div>
                  </div>
                ) : (
                  showMap && (
                    <div key={JSON.stringify(geofences) + userRole}>
                      <GeofenceMapEditor geofences={geofences} onChange={handleGeofenceUpdate} userRole={userRole} />
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Geofence List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Geofence Zones</span>
                  <Badge variant="outline">{geofences.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Manage your geofence zones and their properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {geofences.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No geofence zones created yet</p>
                    <p className="text-sm text-gray-500">
                      Use the map editor to create your first geofence zone
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {geofences.map((geofence) => (
                      <div
                        key={geofence.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedGeofence?.id === geofence.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedGeofence(geofence)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{geofence.name}</h4>
                            {geofence.description && (
                              <p className="text-sm text-gray-600 mt-1">{geofence.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {geofence.polygon.coordinates[0].length} points
                              </Badge>
                              {geofence.created_at && (
                                <span className="text-xs text-gray-500">
                                  Created {new Date(geofence.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteGeofence(geofence.id)
                            }}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <Plus className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Click the polygon tool to draw a new geofence zone</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Edit className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Use the edit tool to modify existing zones</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Trash2 className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>Use the delete tool to remove zones</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                    <span>Click on zones to view details and manage them</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <GeofenceRuleManager assets={assets} geofences={geofences} />
      </div>
    </div>
  )
} 