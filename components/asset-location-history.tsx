import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'

interface LocationHistoryEntry {
  id: string
  location_text: string | null
  location_lat: number | null
  location_lng: number | null
  location_source: string | null
  updated_by: string | null
  updated_at: string
  prev_location_text: string | null
  prev_location_lat: number | null
  prev_location_lng: number | null
  updated_by_profile?: { full_name: string | null }
}

export default function AssetLocationHistory({ assetId }: { assetId: string }) {
  const [history, setHistory] = useState<LocationHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      const res = await fetch(`/api/assets/${assetId}/location-history`)
      const data = await res.json()
      setHistory(data.history || [])
      setLoading(false)
    }
    fetchHistory()
  }, [assetId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : history.length === 0 ? (
          <div className="text-gray-500">No location changes recorded.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>By</TableHead>
                <TableHead>New Location</TableHead>
                <TableHead>Old Location</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(h => (
                <TableRow key={h.id}>
                  <TableCell>{new Date(h.updated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {h.updated_by_profile?.full_name || h.updated_by || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {h.location_text || ''}
                    {h.location_lat && h.location_lng && (
                      <div className="text-xs text-gray-500">
                        {h.location_lat}, {h.location_lng}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {h.prev_location_text || ''}
                    {h.prev_location_lat && h.prev_location_lng && (
                      <div className="text-xs text-gray-500">
                        {h.prev_location_lat}, {h.prev_location_lng}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{h.location_source || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
