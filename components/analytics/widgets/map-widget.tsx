'use client'

// =====================================================
// MAP WIDGET COMPONENT
// =====================================================
// Widget for displaying geospatial data and maps

import { Widget, WidgetData } from '@/lib/types/analytics'
import { MapPin, Navigation } from 'lucide-react'

interface MapWidgetProps {
  widget: Widget
  data: WidgetData
}

export function MapWidget({ widget: _widget, data }: MapWidgetProps) {
  // This is a placeholder implementation
  // In a real application, you would integrate with a mapping library like:
  // - Leaflet with react-leaflet
  // - Mapbox GL JS
  // - Google Maps API
  
  const locations = data.rows || []
  const totalLocations = locations.length

  return (
    <div className="h-full flex flex-col">
      {/* Map placeholder */}
      <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
        {/* Placeholder map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 opacity-50" />
        
        {/* Map content */}
        <div className="relative z-10 text-center">
          <Navigation className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Interactive Map
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {totalLocations} location{totalLocations !== 1 ? 's' : ''} to display
          </div>
          
          {/* Sample location markers */}
          {locations.slice(0, 5).map((location, index) => (
            <div
              key={index}
              className="absolute bg-red-500 rounded-full w-3 h-3 border-2 border-white shadow-lg"
              style={{
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`,
              }}
              title={String(location.name || `Location ${index + 1}`)}
            />
          ))}
        </div>
      </div>

      {/* Location summary */}
      {totalLocations > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Locations</span>
            <span className="font-semibold">{totalLocations}</span>
          </div>
          
          {/* Show first few locations */}
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {locations.slice(0, 3).map((location, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="truncate">
                  {String(location.name || location.address || `Location ${index + 1}`)}
                </span>
              </div>
            ))}
            {totalLocations > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{totalLocations - 3} more locations
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integration note */}
      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
        <strong>Note:</strong> This is a placeholder map widget. 
        In production, this would integrate with a mapping service like Mapbox or Google Maps.
      </div>
    </div>
  )
}