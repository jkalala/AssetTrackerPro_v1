import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface Geofence {
  id: string
  name: string
  polygon: { coordinates: [number, number][][] }
  description?: string
}

interface AssetInteractiveMapProps {
  assetLat: number | null
  assetLng: number | null
  geofences: Geofence[]
  onMove?: (lat: number, lng: number) => void
}

function AssetMarker({ lat, lng, onMove }: { lat: number, lng: number, onMove?: (lat: number, lng: number) => void }) {
  const map = useMap()
  React.useEffect(() => {
    map.setView([lat, lng], 16)
  }, [lat, lng])
  return (
    <Marker
      position={[lat, lng]}
      eventHandlers={onMove ? {
        dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
          const { lat, lng } = e.target.getLatLng()
          onMove(lat, lng)
        }
      } : undefined}
    >
      <Popup>
        Asset Location<br />
        {lat}, {lng}
      </Popup>
    </Marker>
  )
}

function AssetInteractiveMap({ assetLat, assetLng, geofences, onMove }: AssetInteractiveMapProps) {
  // Default to a world view if no asset location
  const center: [number, number] = assetLat && assetLng ? [assetLat, assetLng] : [0, 0]
  return (
    <div style={{ height: 300, width: '100%' }}>
      <MapContainer 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {assetLat && assetLng && <AssetMarker lat={assetLat} lng={assetLng} onMove={onMove} />}
        {geofences.map(zone => (
          <Polygon key={zone.id} positions={zone.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])}>
            <Popup>
              <strong>{zone.name}</strong><br />
              {zone.description}
            </Popup>
          </Polygon>
        ))}
      </MapContainer>
    </div>
  )
}

export default AssetInteractiveMap; 