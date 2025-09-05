import React from 'react'
// You can use a simple calendar library or build a basic grid
// For brevity, this is a minimal calendar view

interface MaintenanceCalendarProps {
  assetId: string
  schedules: any[]
  history: any[]
}

export default function MaintenanceCalendar({
  assetId,
  schedules,
  history,
}: MaintenanceCalendarProps) {
  // Flatten all dates (next_due for schedules, performed_at for history)
  const events = [
    ...schedules.map(s => ({
      date: s.next_due,
      type: s.status === 'overdue' ? 'overdue' : 'due',
      label: s.type,
    })),
    ...history.map(h => ({ date: h.performed_at, type: 'completed', label: 'Completed' })),
  ]
  // Group by date
  const grouped = events.reduce(
    (acc, ev) => {
      if (!ev.date) return acc
      acc[ev.date] = acc[ev.date] || []
      acc[ev.date].push(ev)
      return acc
    },
    {} as Record<string, any[]>
  )

  // Show current month
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))

  return (
    <div className="border rounded p-4 bg-white">
      <h3 className="font-semibold mb-2">Maintenance Calendar</h3>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs font-bold text-center">
            {d}
          </div>
        ))}
        {days.map(date => {
          const key = date.toISOString().slice(0, 10)
          const evs = grouped[key] || []
          return (
            <div
              key={key}
              className="h-16 border rounded flex flex-col items-center justify-center bg-gray-50 relative"
            >
              <span className="text-xs text-gray-700">{date.getDate()}</span>
              {evs.map((ev, i) => (
                <span
                  key={i}
                  className={
                    ev.type === 'overdue'
                      ? 'text-red-600 text-xs font-bold'
                      : ev.type === 'due'
                        ? 'text-yellow-600 text-xs font-bold'
                        : 'text-green-600 text-xs font-bold'
                  }
                >
                  {ev.label}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
