import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, FileSpreadsheet, CheckCircle, AlertTriangle, Eye } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const csvTemplate = [
  "asset_id,name,category,location,value",
  'AST-001,MacBook Pro 16",it-equipment,Office A,2499.99',
  "AST-002,Office Chair,furniture,Office B,299.99",
  "AST-003,Projector,av-equipment,Conference Room,899.99",
].join("\n")

const excelTemplateUrl = "https://github.com/your-org/assetpro-templates/raw/main/asset-template.xlsx" // Replace with your actual template location if needed

const REQUIRED_COLUMNS = ["asset_id", "name"]

export default function BulkAssetImport() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [fileValid, setFileValid] = useState(false)
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importHistory, setImportHistory] = useState<any[]>([])
  const [undoing, setUndoing] = useState(false)

  // Fetch import history
  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch("/api/assets/import/history")
      const data = await res.json()
      if (data.success) setImportHistory(data.history)
    }
    fetchHistory()
  }, [result, undoing])

  const handleDownloadCSV = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "asset-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadExcel = () => {
    window.open(excelTemplateUrl, "_blank")
  }

  const validateAndPreview = async (file: File) => {
    setError(null)
    setPreviewRows([])
    setFileValid(false)
    setFileName(file.name)
    let rows: any[] = []
    if (file.name.endsWith(".csv")) {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      rows = parsed.data as any[]
      if (parsed.errors.length > 0) {
        setError("CSV parse error: " + parsed.errors[0].message)
        return
      }
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet)
    } else {
      setError("Unsupported file type")
      return
    }
    if (!rows.length) {
      setError("File is empty or has no valid rows.")
      return
    }
    const columns = Object.keys(rows[0])
    const missing = REQUIRED_COLUMNS.filter(col => !columns.includes(col))
    if (missing.length > 0) {
      setError(`Missing required columns: ${missing.join(", ")}`)
      return
    }
    setPreviewRows(rows.slice(0, 5))
    setFileValid(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setUploading(false)
    setProgress(0)
    await validateAndPreview(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return
    setUploading(true)
    setProgress(10)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", fileInputRef.current.files[0])
      setProgress(30)
      const res = await fetch("/api/assets/import", {
        method: "POST",
        body: formData,
      })
      setProgress(80)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setResult(data)
      } else {
        setResult(data)
      }
      setProgress(100)
    } catch (err) {
      setError("Failed to import file")
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 2000)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setFileValid(false)
      setPreviewRows([])
      setFileName("")
    }
  }

  const handleUndo = async () => {
    setUndoing(true)
    try {
      const res = await fetch("/api/assets/import/undo", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setResult({ ...result, undoSuccess: true })
        setImportHistory((prev) => prev.map((h) => h.id === data.importId ? { ...h, undone: true } : h))
      } else {
        setError(data.error || "Failed to undo import")
      }
    } catch (err) {
      setError("Failed to undo import")
    } finally {
      setUndoing(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Bulk Asset Import
        </CardTitle>
        <CardDescription>Import assets from CSV or Excel files. Download a template to get started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Excel Template
          </Button>
        </div>
        {/* Undo Last Import */}
        {importHistory.length > 0 && !importHistory[0].undone && (
          <div className="mb-4">
            <Button onClick={handleUndo} disabled={undoing} variant="destructive">
              {undoing ? "Undoing..." : "Undo Last Import"}
            </Button>
            <span className="ml-2 text-xs text-gray-500">Last import: {importHistory[0].file_name} ({importHistory[0].success_count} imported, {importHistory[0].error_count} errors)</span>
          </div>
        )}
        {/* Import History */}
        {importHistory.length > 0 && (
          <div className="mt-6">
            <CardTitle className="text-sm mb-2">Import History</CardTitle>
            <table className="text-xs w-full border">
              <thead>
                <tr>
                  <th className="px-2 py-1 border-b">File</th>
                  <th className="px-2 py-1 border-b">Imported</th>
                  <th className="px-2 py-1 border-b">Errors</th>
                  <th className="px-2 py-1 border-b">Date</th>
                  <th className="px-2 py-1 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((h, idx) => (
                  <tr key={h.id} className={h.undone ? "text-gray-400" : ""}>
                    <td className="px-2 py-1 border-b">{h.file_name}</td>
                    <td className="px-2 py-1 border-b">{h.success_count}</td>
                    <td className="px-2 py-1 border-b">{h.error_count}</td>
                    <td className="px-2 py-1 border-b">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="px-2 py-1 border-b">{h.undone ? "Undone" : "Imported"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form className="flex flex-col sm:flex-row items-center gap-2" onSubmit={e => e.preventDefault()}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            disabled={uploading}
            className="max-w-xs"
          />
          <Button
            onClick={handleUpload}
            disabled={uploading || !fileValid}
            variant="outline"
            type="button"
          >
            {uploading ? <Upload className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </form>
        {fileName && (
          <div className="text-xs text-gray-500">Selected file: {fileName}</div>
        )}
        {previewRows.length > 0 && (
          <div className="bg-gray-50 p-2 rounded border">
            <div className="flex items-center mb-1">
              <Eye className="h-4 w-4 mr-1 text-blue-600" />
              <span className="font-semibold text-sm">Preview (first 5 rows):</span>
            </div>
            <table className="text-xs w-full">
              <thead>
                <tr>
                  {Object.keys(previewRows[0]).map((col) => (
                    <th key={col} className="px-2 py-1 text-left border-b">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(previewRows[0]).map((col) => (
                      <td key={col} className="px-2 py-1 border-b">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {progress > 0 && (
          <Progress value={progress} className="w-full" />
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && result.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Imported {result.successCount} assets successfully.
              {result.errorCount > 0 && (
                <span> {result.errorCount} rows failed.</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        {result && result.errorRows && result.errorRows.length > 0 && (
          <div className="mt-2">
            <CardTitle className="text-sm mb-2">Import Errors</CardTitle>
            <ul className="text-xs text-red-600 list-disc pl-5">
              {result.errorRows.map((row: any, idx: number) => (
                <li key={idx}>{row.error} (Row: {JSON.stringify(row.row)})</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 