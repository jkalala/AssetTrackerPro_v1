"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Download, RefreshCw, Database } from "lucide-react"

export default function FallbackDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AssetTracker Pro</h1>
          <p className="text-gray-600">Professional Asset Management System</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Preview Environment Detected
              </CardTitle>
              <CardDescription className="text-orange-700">
                You're viewing this in the v0 preview environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  The v0 preview environment may have network restrictions that prevent full database connectivity.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium text-orange-800">What's affected:</h4>
                <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                  <li>Real-time database connections</li>
                  <li>Authentication with external services</li>
                  <li>File uploads and downloads</li>
                  <li>Some API calls</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Full Functionality Available
              </CardTitle>
              <CardDescription className="text-green-700">
                Download and run locally for complete features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-800">When running locally:</h4>
                <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                  <li>✅ Full database connectivity</li>
                  <li>✅ Real-time asset tracking</li>
                  <li>✅ GitHub/Google OAuth</li>
                  <li>✅ File uploads</li>
                  <li>✅ QR code generation</li>
                  <li>✅ Team collaboration</li>
                </ul>
              </div>

              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Complete Code
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Management</CardTitle>
              <CardDescription>Track and manage all your assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Assets</span>
                  <span className="font-semibold">Demo: 24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active</span>
                  <span className="font-semibold text-green-600">20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Maintenance</span>
                  <span className="font-semibold text-orange-600">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Retired</span>
                  <span className="font-semibold text-gray-600">1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code Tools</CardTitle>
              <CardDescription>Generate and scan QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full" disabled>
                  Generate QR Code
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Scan QR Code
                </Button>
                <p className="text-xs text-gray-500">Available when running locally</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Collaboration</CardTitle>
              <CardDescription>Manage team access and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full" disabled>
                  Invite Team Members
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Manage Permissions
                </Button>
                <p className="text-xs text-gray-500">Available when running locally</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <Button onClick={() => (window.location.href = "/client-dashboard")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Client Dashboard
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/login")}>
              Go to Login
            </Button>
          </div>

          <p className="text-sm text-gray-600">
            For the best experience with full functionality, download the code and run it locally at localhost:3000
          </p>
        </div>
      </div>
    </div>
  )
}
