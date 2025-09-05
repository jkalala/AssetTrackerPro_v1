import React, { useEffect, useState } from 'react'

export default function AssetReverseGeocode({
  lat,
  lng,
}: {
  lat: number | null
  lng: number | null
}) {
  const [address, setAddress] = useState<string | null>(null)
  useEffect(() => {
    if (lat && lng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name || 'No address found'))
        .catch(() => setAddress('No address found'))
    } else {
      setAddress(null)
    }
  }, [lat, lng])
  if (!lat || !lng) return null
  return (
    <div className="text-xs text-gray-600 mt-1">
      <span className="font-medium">Address:</span> {address || 'Loading...'}
    </div>
  )
}
