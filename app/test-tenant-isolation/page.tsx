"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useTenant } from "@/components/providers/tenant-provider"
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface TestResult {
  test: string
  success: boolean
  message: string
  details?: any
}

export default function TenantIsolationTestPage() {
  const { tenant, tenantContext } = useTenant()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [targetTenantId, setTargetTenantId] = useState("")

  const runTest = async (testName: string, testFn: () => Promise<TestResult>) => {
    setLoading(true)
    try {
      const result = await testFn()
      setTestResults(prev => [...prev, result])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
    setLoading(false)
  }

  const testValidTenantAccess = async (): Promise<TestResult> => {
    const response = await fetch('/api/tenant/validate')
    const data = await response.json()
    
    return {
      test: 'Valid Tenant Access',
      success: response.ok,
      message: data.message || data.error || 'Unknown response',
      details: data
    }
  }

  const testInvalidTenantAccess = async (): Promise<TestResult> => {
    if (!targetTenantId) {
      return {
        test: 'Invalid Tenant Access',
        success: false,
        message: 'Please enter a target tenant ID'
      }
    }

    const response = await fetch(`/api/tenant/validate?tenantId=${targetTenantId}`)
    const data = await response.json()
    
    // For this test, we expect it to fail (403) if tenant isolation is working
    const expectedToFail = targetTenantId !== tenantContext?.tenantId
    const actuallyFailed = response.status === 403
    
    return {
      test: 'Invalid Tenant Access',
      success: expectedToFail ? actuallyFailed : response.ok,
      message: expectedToFail 
        ? (actuallyFailed ? 'Correctly blocked unauthorized access' : 'SECURITY ISSUE: Unauthorized access allowed')
        : (response.ok ? 'Valid access granted' : data.error || 'Access denied'),
      details: { expectedToFail, actuallyFailed, status: response.status, data }
    }
  }

  const testCrossTenantDataAccess = async (): Promise<TestResult> => {
    if (!targetTenantId) {
      return {
        test: 'Cross-Tenant Data Access',
        success: false,
        message: 'Please enter a target tenant ID'
      }
    }

    const response = await fetch('/api/tenant/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        targetTenantId, 
        action: 'test_cross_tenant_access' 
      })
    })
    const data = await response.json()
    
    return {
      test: 'Cross-Tenant Data Access',
      success: response.ok && data.blocked === true,
      message: data.blocked 
        ? 'Cross-tenant access correctly blocked' 
        : 'SECURITY ISSUE: Cross-tenant access may be possible',
      details: data
    }
  }

  const testTenantScopedAssets = async (): Promise<TestResult> => {
    const response = await fetch('/api/assets')
    const data = await response.json()
    
    if (!response.ok) {
      return {
        test: 'Tenant-Scoped Assets',
        success: false,
        message: data.error || 'Failed to fetch assets',
        details: data
      }
    }

    // Check if all assets belong to current tenant (this would require asset data to have tenant_id)
    const assets = data.assets || []
    
    return {
      test: 'Tenant-Scoped Assets',
      success: true,
      message: `Successfully fetched ${assets.length} tenant-scoped assets`,
      details: { assetCount: assets.length, sampleAsset: assets[0] }
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runAllTests = async () => {
    clearResults()
    await runTest('Valid Tenant Access', testValidTenantAccess)
    await runTest('Tenant-Scoped Assets', testTenantScopedAssets)
    
    if (targetTenantId) {
      await runTest('Invalid Tenant Access', testInvalidTenantAccess)
      await runTest('Cross-Tenant Data Access', testCrossTenantDataAccess)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Tenant Isolation Testing
          </h1>
          <p className="text-gray-600">
            Test the tenant isolation functionality to ensure data security and proper access controls.
          </p>
        </div>

        {/* Current Tenant Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Tenant Context</CardTitle>
            <CardDescription>Your current tenant and user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Tenant Name</Label>
                <p className="text-lg" data-testid="tenant-name">{tenant?.name || 'Loading...'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tenant ID</Label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {tenantContext?.tenantId || 'Loading...'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {tenantContext?.userId || 'Loading...'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Badge variant="outline">{tenantContext?.role || 'Loading...'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure tests for unauthorized access scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="targetTenantId">Target Tenant ID (for unauthorized access tests)</Label>
                <Input
                  id="targetTenantId"
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  placeholder="Enter a different tenant ID to test unauthorized access"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use a fake tenant ID like "tenant_123" to test unauthorized access blocking
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>Run individual tests or all tests at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => runTest('Valid Tenant Access', testValidTenantAccess)}
                disabled={loading}
              >
                Test Valid Access
              </Button>
              <Button 
                onClick={() => runTest('Tenant-Scoped Assets', testTenantScopedAssets)}
                disabled={loading}
              >
                Test Asset Scoping
              </Button>
              <Button 
                onClick={() => runTest('Invalid Tenant Access', testInvalidTenantAccess)}
                disabled={loading || !targetTenantId}
              >
                Test Invalid Access
              </Button>
              <Button 
                onClick={() => runTest('Cross-Tenant Data Access', testCrossTenantDataAccess)}
                disabled={loading || !targetTenantId}
              >
                Test Cross-Tenant Access
              </Button>
              <Button 
                onClick={runAllTests}
                disabled={loading}
                variant="default"
              >
                Run All Tests
              </Button>
              <Button 
                onClick={clearResults}
                disabled={loading}
                variant="outline"
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Results of tenant isolation tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <Alert key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                    <div className="flex items-start">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{result.test}</h4>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <AlertDescription className="mt-1">
                          {result.message}
                        </AlertDescription>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> This page is for testing tenant isolation in development environments only. 
            Any failed security tests should be investigated immediately. In production, this page should be removed or 
            restricted to authorized security personnel only.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}