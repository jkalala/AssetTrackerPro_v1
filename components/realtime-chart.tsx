'use client'

import { useState, useEffect } from 'react'
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface ChartDataPoint {
  time: string
  assets: number
  scans: number
  users: number
}

export default function RealtimeChart() {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    // Initialize with some historical data
    const now = new Date()
    const initialData: ChartDataPoint[] = []

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      initialData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assets: Math.floor(Math.random() * 10 + 5),
        scans: Math.floor(Math.random() * 20 + 10),
        users: Math.floor(Math.random() * 8 + 2),
      })
    }

    setData(initialData)

    // Set up real-time updates
    const interval = setInterval(() => {
      if (isLive) {
        const newTime = new Date()
        const newDataPoint: ChartDataPoint = {
          time: newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          assets: Math.floor(Math.random() * 10 + 5),
          scans: Math.floor(Math.random() * 20 + 10),
          users: Math.floor(Math.random() * 8 + 2),
        }

        setData(prevData => {
          const newData = [...prevData.slice(1), newDataPoint]
          return newData
        })
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
          ></div>
          <span className="text-sm font-medium">{isLive ? 'Live Updates' : 'Paused'}</span>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isLive ? 'Pause' : 'Resume'}
        </button>
      </div>

      <ChartContainer
        config={{
          assets: {
            label: 'Assets Created',
            color: 'hsl(var(--chart-1))',
          },
          scans: {
            label: 'QR Scans',
            color: 'hsl(var(--chart-2))',
          },
          users: {
            label: 'Active Users',
            color: 'hsl(var(--chart-3))',
          },
        }}
        className="h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="scans"
              stackId="1"
              stroke="var(--color-scans)"
              fill="var(--color-scans)"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="assets"
              stackId="1"
              stroke="var(--color-assets)"
              fill="var(--color-assets)"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="users"
              stackId="1"
              stroke="var(--color-users)"
              fill="var(--color-users)"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
