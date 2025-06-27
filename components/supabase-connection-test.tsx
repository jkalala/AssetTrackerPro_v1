"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { SUPABASE_CONFIG } from "@/lib/supabase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")
  const [projectRef, setProjectRef] = useState<string>(SUPABASE_CONFIG.projectId)

  const testConnection = async () => {
    setStatus("loading")
    setMessage("Testing connection to Supabase...")

    try {
      const supabase = createClient()

      // Simple query to test connection
      const { data, error } = await supabase.from("profiles").select("id").limit(1)

      if (error) {
        console.error("Supabase connection error:", error)
        setStatus("error")
        setMessage(`Connection failed: ${error.message}`)
        return
      }

      setStatus("success")
      setMessage("Successfully connected to Supabase!")
    } catch (err) {
      console.error("Unexpected error:", err)
      setStatus("error")
      setMessage(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Supabase Connection Status
          {status === "loading" && <RefreshCw className="h-4 w-4 animate-spin" />}
          {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>Testing connection to project: {projectRef}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`p-4 rounded-md ${
            status === "loading"
              ? "bg-blue-50 text-blue-700"
              : status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={testConnection}
          disabled={status === "loading"}
          variant={status === "error" ? "destructive" : "default"}
        >
          {status === "loading" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection Again
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
