"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, LineChart, Line } from "recharts"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function AnalyticsReportsPage() {
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", category: "", status: "" })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    const res = await fetch("/api/analytics/advanced", {
      method: "POST",
      body: JSON.stringify(filters),
      headers: { "Content-Type": "application/json" }
    })
    const result = await res.json()
    setData(result.data)
    setLoading(false)
  }

  // Prepare chart data
  const statusChartData = data ? Object.entries(data.byStatus).map(([status, count]) => ({ status, count })) : []
  const categoryChartData = data ? Object.entries(data.byCategory).map(([category, count]) => ({ category, count })) : []

  // Export CSV utility
  const exportCSV = () => {
    if (!data?.assets) return
    const csv = [
      Object.keys(data.assets[0]).join(","),
      ...data.assets.map((row: any) => Object.values(row).join(","))
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "assets-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportReport = async (format: "pdf" | "xlsx") => {
    const res = await fetch("/api/analytics/export", {
      method: "POST",
      body: JSON.stringify({ ...filters, format }),
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) return alert("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "pdf" ? "assets-report.pdf" : "assets-report.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare time series data
  const timeSeriesData = data?.assets
    ? data.assets.reduce((acc: any[], asset: any) => {
        const date = asset.created_at.split("T")[0];
        const found = acc.find((d) => d.date === date);
        if (found) found.count++;
        else acc.push({ date, count: 1 });
        return acc;
      }, [])
    : [];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics & Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            <Input placeholder="Category" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} />
            <Input placeholder="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} />
            <Button onClick={fetchReport} disabled={loading}>{loading ? "Loading..." : "Run Report"}</Button>
          </div>
          {/* Charts */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-2">Assets by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statusChartData}>
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Assets by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryChartData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                      {categoryChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Assets Created Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {/* Table of assets */}
          {data && data.assets && (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border">
                <thead>
                  <tr>
                    {Object.keys(data.assets[0]).map((key) => (
                      <th key={key} className="border px-2 py-1 text-xs text-gray-600 bg-gray-50">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.assets.map((row: any, idx: number) => (
                    <tr key={idx} className="even:bg-gray-50">
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="border px-2 py-1 text-xs">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Export buttons */}
          {data && data.assets && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
              <Button variant="outline" onClick={() => exportReport("pdf")}>Export PDF</Button>
              <Button variant="outline" onClick={() => exportReport("xlsx")}>Export XLSX</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 