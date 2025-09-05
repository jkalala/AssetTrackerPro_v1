'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, FeatureGroup, useMap, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// @ts-ignore
import { EditControl } from 'react-leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

interface Geofence {
  id?: string
  name: string
  polygon: { coordinates: [number, number][][] }
  description?: string
  created_at?: string
}

interface GeofenceMapEditorProps {
  geofences: Geofence[]
  onChange: () => void
  userRole: string
}

function GeofenceDraw({ geofences, onChange, userRole }: GeofenceMapEditorProps) {
  const map = useMap()
  const featureGroupRef = useRef<any>(null)
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)

  // Handle create/edit/delete
  const handleCreated = async (e: any) => {
    try {
      setIsCreating(true)
      const layer = e.layer
      const latlngs = layer.getLatLngs()[0].map((latlng: any) => [latlng.lng, latlng.lat])
      const polygon = { type: 'Polygon', coordinates: [latlngs] }

      // Prompt for zone details
      const name = prompt('Enter zone name:') || 'New Zone'
      if (!name.trim()) {
        toast({
          title: 'Error',
          description: 'Zone name is required',
          variant: 'destructive',
        })
        return
      }

      const description = prompt('Enter zone description (optional):') || ''

      const res = await fetch('/api/geofence/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, polygon, description }),
      })

      if (!res.ok) {
        throw new Error('Failed to create geofence zone')
      }

      toast({
        title: 'Success',
        description: `Geofence zone "${name}" created successfully`,
      })

      onChange()
    } catch (error) {
      console.error('Error creating geofence:', error)
      toast({
        title: 'Error',
        description: 'Failed to create geofence zone',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdited = async (e: any) => {
    try {
      for (const layer of Object.values(e.layers._layers)) {
        const l = layer as any
        const latlngs = l.getLatLngs()[0].map((latlng: any) => [latlng.lng, latlng.lat])
        const polygon = { type: 'Polygon', coordinates: [latlngs] }
        const id = l.options.zoneId
        const currentName = l.options.zoneName || 'Unnamed Zone'
        const currentDescription = l.options.zoneDescription || ''

        const name = prompt('Enter zone name:', currentName) || currentName
        if (!name.trim()) {
          toast({
            title: 'Error',
            description: 'Zone name is required',
            variant: 'destructive',
          })
          return
        }

        const description =
          prompt('Enter zone description:', currentDescription) || currentDescription

        const res = await fetch('/api/geofence/zones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name, polygon, description }),
        })

        if (!res.ok) {
          throw new Error('Failed to update geofence zone')
        }
      }

      toast({
        title: 'Success',
        description: 'Geofence zone updated successfully',
      })

      onChange()
    } catch (error) {
      console.error('Error updating geofence:', error)
      toast({
        title: 'Error',
        description: 'Failed to update geofence zone',
        variant: 'destructive',
      })
    }
  }

  const handleDeleted = async (e: any) => {
    try {
      for (const layer of Object.values(e.layers._layers)) {
        const l = layer as any
        const id = l.options.zoneId
        const name = l.options.zoneName || 'this zone'

        if (
          typeof window !== 'undefined' &&
          !window.confirm(`Are you sure you want to delete "${name}"?`)
        ) {
          return
        }

        const res = await fetch('/api/geofence/zones', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })

        if (!res.ok) {
          throw new Error('Failed to delete geofence zone')
        }
      }

      toast({
        title: 'Success',
        description: 'Geofence zone deleted successfully',
      })

      onChange()
    } catch (error) {
      console.error('Error deleting geofence:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete geofence zone',
        variant: 'destructive',
      })
    }
  }

  // Add polygons to map with zone info
  useEffect(() => {
    if (!map || !featureGroupRef.current) return

    // Clear existing layers
    featureGroupRef.current.clearLayers()

    geofences.forEach(zone => {
      try {
        const latlngs = zone.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])
        if (typeof window !== 'undefined' && (window as any).L) {
          const polygon = (window as any).L.polygon(latlngs, {
            zoneId: zone.id,
            zoneName: zone.name,
            zoneDescription: zone.description,
            color: '#3B82F6',
            weight: 2,
            opacity: 0.8,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
          })

          // Create popup content
          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1F2937;">${zone.name}</h3>
              ${zone.description ? `<p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">${zone.description}</p>` : ''}
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <span style="background: #E5E7EB; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #374151;">
                  ${zone.polygon.coordinates[0].length} points
                </span>
                ${
                  zone.created_at
                    ? `<span style="background: #E5E7EB; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #374151;">
                  Created ${new Date(zone.created_at).toLocaleDateString()}
                </span>`
                    : ''
                }
              </div>
            </div>
          `

          polygon.bindPopup(popupContent)
          featureGroupRef.current.addLayer(polygon)
        }
      } catch (error) {
        console.error('Error adding geofence to map:', error)
      }
    })
  }, [geofences, map])

  return (
    <FeatureGroup ref={featureGroupRef}>
      {['admin', 'manager'].includes(userRole) && (
        <EditControl
          position="topright"
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false,
            circle: false,
            marker: false,
            polyline: false,
            circlemarker: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e100',
                message: '<strong>Error:</strong> Shape edges cannot cross!',
              },
              shapeOptions: {
                color: '#3B82F6',
                weight: 2,
              },
            },
          }}
          edit={{
            featureGroup: featureGroupRef.current,
            remove: true,
          }}
        />
      )}
    </FeatureGroup>
  )
}

export default function GeofenceMapEditor({
  geofences,
  onChange,
  userRole,
}: GeofenceMapEditorProps) {
  const [mapKey, setMapKey] = useState(0)
  const mapRef = useRef<any>(null)

  // Force map re-render when geofences change
  useEffect(() => {
    setMapKey(prev => prev + 1)
  }, [geofences.length])

  useEffect(() => {
    return () => {
      if (mapRef.current && mapRef.current._leaflet_id) {
        mapRef.current.remove()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div style={{ height: 500, width: '100%' }} className="rounded-lg overflow-hidden border">
        <MapContainer ref={mapRef} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeofenceDraw geofences={geofences} onChange={onChange} userRole={userRole} />
        </MapContainer>
      </div>

      {/* Geofence Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Geofence Zones Summary</h4>
            <p className="text-sm text-gray-600">
              {geofences.length} zone{geofences.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {geofences.length} Active
            </Badge>
            {['admin', 'manager'].includes(userRole) && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Edit Mode
              </Badge>
            )}
          </div>
        </div>

        {geofences.length > 0 && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {geofences.slice(0, 6).map((zone, index) => (
              <div key={zone.id || index} className="text-xs bg-white p-2 rounded border">
                <span className="font-medium text-gray-900">{zone.name}</span>
                <span className="text-gray-500 ml-2">
                  ({zone.polygon.coordinates[0].length} points)
                </span>
              </div>
            ))}
            {geofences.length > 6 && (
              <div className="text-xs text-gray-500 p-2">+{geofences.length - 6} more zones</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
