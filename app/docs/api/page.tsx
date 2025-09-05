'use client'

import dynamic from 'next/dynamic'
import type SwaggerUIType from 'swagger-ui-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Code,
  Key,
  Globe,
  Shield,
  Copy,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Zap,
} from 'lucide-react'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false }) as any

const apiEndpoints = [
  {
    method: 'GET',
    endpoint: '/api/assets',
    description: 'Retrieve all assets',
    auth: 'Required',
    parameters: [
      { name: 'page', type: 'number', description: 'Page number for pagination' },
      { name: 'limit', type: 'number', description: 'Number of items per page' },
      { name: 'category', type: 'string', description: 'Filter by asset category' },
      { name: 'status', type: 'string', description: 'Filter by asset status' },
    ],
  },
  {
    method: 'POST',
    endpoint: '/api/assets',
    description: 'Create a new asset',
    auth: 'Required',
    parameters: [
      { name: 'name', type: 'string', description: 'Asset name (required)' },
      { name: 'category', type: 'string', description: 'Asset category (required)' },
      { name: 'description', type: 'string', description: 'Asset description' },
      { name: 'location', type: 'string', description: 'Asset location' },
      { name: 'value', type: 'number', description: 'Asset value' },
    ],
  },
  {
    method: 'GET',
    endpoint: '/api/assets/{id}',
    description: 'Retrieve a specific asset',
    auth: 'Required',
    parameters: [{ name: 'id', type: 'string', description: 'Asset ID (required)' }],
  },
  {
    method: 'PUT',
    endpoint: '/api/assets/{id}',
    description: 'Update an existing asset',
    auth: 'Required',
    parameters: [
      { name: 'id', type: 'string', description: 'Asset ID (required)' },
      { name: 'name', type: 'string', description: 'Asset name' },
      { name: 'category', type: 'string', description: 'Asset category' },
      { name: 'description', type: 'string', description: 'Asset description' },
      { name: 'location', type: 'string', description: 'Asset location' },
      { name: 'status', type: 'string', description: 'Asset status' },
    ],
  },
  {
    method: 'DELETE',
    endpoint: '/api/assets/{id}',
    description: 'Delete an asset',
    auth: 'Required',
    parameters: [{ name: 'id', type: 'string', description: 'Asset ID (required)' }],
  },
  {
    method: 'POST',
    endpoint: '/api/assets/{id}/qr',
    description: 'Generate QR code for an asset',
    auth: 'Required',
    parameters: [
      { name: 'id', type: 'string', description: 'Asset ID (required)' },
      { name: 'size', type: 'number', description: 'QR code size in pixels' },
    ],
  },
  {
    method: 'GET',
    endpoint: '/api/analytics/metrics',
    description: 'Get real-time analytics metrics',
    auth: 'Required',
    parameters: [
      { name: 'period', type: 'string', description: 'Time period (day, week, month)' },
      { name: 'category', type: 'string', description: 'Filter by category' },
    ],
  },
]

const codeExamples = {
  javascript: {
    auth: `// Authentication
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your-password'
  })
});

const { token } = await response.json();`,

    getAssets: `// Get all assets
const response = await fetch('/api/assets', {
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  }
});

const assets = await response.json();`,

    createAsset: `// Create a new asset
const response = await fetch('/api/assets', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'MacBook Pro 16"',
    category: 'it-equipment',
    description: 'Company laptop for development',
    location: 'Office A',
    value: 2500
  })
});

const newAsset = await response.json();`,

    generateQR: `// Generate QR code
const response = await fetch(\`/api/assets/\${assetId}/qr\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    size: 256
  })
});

const { qrCode } = await response.json();`,
  },

  python: {
    auth: `# Authentication
import requests

response = requests.post('https://your-domain.com/api/auth/login', {
    'email': 'user@example.com',
    'password': 'your-password'
})

token = response.json()['token']`,

    getAssets: `# Get all assets
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('https://your-domain.com/api/assets', headers=headers)
assets = response.json()`,

    createAsset: `# Create a new asset
data = {
    'name': 'MacBook Pro 16"',
    'category': 'it-equipment',
    'description': 'Company laptop for development',
    'location': 'Office A',
    'value': 2500
}

response = requests.post(
    'https://your-domain.com/api/assets',
    headers=headers,
    json=data
)

new_asset = response.json()`,
  },

  curl: {
    auth: `# Authentication
curl -X POST https://your-domain.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'`,

    getAssets: `# Get all assets
curl -X GET https://your-domain.com/api/assets \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`,

    createAsset: `# Create a new asset
curl -X POST https://your-domain.com/api/assets \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MacBook Pro 16\"",
    "category": "it-equipment",
    "description": "Company laptop for development",
    "location": "Office A",
    "value": 2500
  }'`,
  },
}

export default function APIDocumentationPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [openApiSpec, setOpenApiSpec] = useState<any>(null)
  const [loadingSpec, setLoadingSpec] = useState(false)
  const [specError, setSpecError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSpec() {
      setLoadingSpec(true)
      setSpecError(null)
      try {
        const res = await fetch('/api/external/docs')
        const data = await res.json()
        setOpenApiSpec(data)
      } catch (err) {
        setSpecError('Failed to load OpenAPI spec')
      } finally {
        setLoadingSpec(false)
      }
    }
    fetchSpec()
  }, [])

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800'
      case 'POST':
        return 'bg-blue-100 text-blue-800'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <Code className="h-10 w-10 mr-4 text-blue-600" />
            API Documentation
          </h1>
          <p className="text-xl text-gray-600">
            Complete reference for integrating with the Asset Management System API
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="openapi">OpenAPI</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Overview</CardTitle>
                  <CardDescription>
                    RESTful API for managing assets, QR codes, and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold">RESTful Design</h4>
                      <p className="text-sm text-gray-600">
                        Standard HTTP methods and status codes
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold">Secure Authentication</h4>
                      <p className="text-sm text-gray-600">
                        JWT-based authentication with role-based access
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h4 className="font-semibold">Real-time Updates</h4>
                      <p className="text-sm text-gray-600">
                        WebSocket support for live data synchronization
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Base URL</h4>
                    <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                      https://your-domain.com/api/v1
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Response Format</h4>
                    <p className="text-gray-600 mb-3">
                      All API responses are returned in JSON format with consistent structure:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">
                        {`{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}`}
                      </pre>
                    </div>
                  </div>

                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <strong>API Key Required:</strong> All endpoints require authentication except
                      for public asset viewing.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limiting</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      To ensure fair usage and system stability, the API implements rate limiting:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Standard Tier</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 1,000 requests per hour</li>
                          <li>• 100 requests per minute</li>
                          <li>• Burst limit: 20 requests per second</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Premium Tier</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 10,000 requests per hour</li>
                          <li>• 500 requests per minute</li>
                          <li>• Burst limit: 50 requests per second</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authentication">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Methods</CardTitle>
                  <CardDescription>Secure your API requests with JWT tokens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">JWT Token Authentication</h4>
                    <p className="text-gray-600 mb-4">
                      The API uses JSON Web Tokens (JWT) for authentication. Include the token in
                      the Authorization header:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">{`Authorization: Bearer YOUR_JWT_TOKEN`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Obtaining a Token</h4>
                    <p className="text-gray-600 mb-3">
                      Send a POST request to the login endpoint with your credentials:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">
                        {`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}`}
                      </pre>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Token Expiry:</strong> Tokens expire after 1 hour. Implement token
                      refresh logic in your application.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-semibold mb-3">Token Refresh</h4>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">
                        {`POST /api/auth/refresh
Authorization: Bearer YOUR_CURRENT_TOKEN

Response:
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expires_in": 3600
  }
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Key Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      For server-to-server integrations, you can use API keys:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">{`X-API-Key: your-api-key-here`}</pre>
                    </div>
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        API keys can be generated in your account settings and should be kept
                        secure.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>
                    Complete list of available endpoints and their parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className={getMethodColor(endpoint.method)}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {endpoint.endpoint}
                            </code>
                          </div>
                          <Badge variant="outline">{endpoint.auth}</Badge>
                        </div>

                        <p className="text-gray-600 mb-4">{endpoint.description}</p>

                        <div>
                          <h5 className="font-medium mb-2">Parameters</h5>
                          <div className="space-y-2">
                            {endpoint.parameters.map((param, paramIndex) => (
                              <div
                                key={paramIndex}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center space-x-2">
                                  <code className="bg-gray-100 px-2 py-1 rounded">
                                    {param.name}
                                  </code>
                                  <Badge variant="outline" className="text-xs">
                                    {param.type}
                                  </Badge>
                                </div>
                                <span className="text-gray-600">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>
                    Implementation examples in different programming languages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex space-x-2">
                      {Object.keys(codeExamples).map(lang => (
                        <Button
                          key={lang}
                          variant={selectedLanguage === lang ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedLanguage(lang)}
                        >
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(
                      codeExamples[selectedLanguage as keyof typeof codeExamples]
                    ).map(([key, code]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(code, key)}
                          >
                            {copiedCode === key ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-sm">
                            <code>{code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Handling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      The API returns standard HTTP status codes and detailed error messages:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">
                        {`// Error Response Format
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Asset name is required",
    "details": {
      "field": "name",
      "value": null
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}

// Common Status Codes
200 - Success
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
429 - Too Many Requests
500 - Internal Server Error`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Real-time notifications for asset events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Available Events</h4>
                    <div className="space-y-3">
                      {[
                        {
                          event: 'asset.created',
                          description: 'Triggered when a new asset is created',
                        },
                        {
                          event: 'asset.updated',
                          description: 'Triggered when an asset is modified',
                        },
                        {
                          event: 'asset.deleted',
                          description: 'Triggered when an asset is deleted',
                        },
                        {
                          event: 'qr.generated',
                          description: 'Triggered when a QR code is generated',
                        },
                        { event: 'qr.scanned', description: 'Triggered when a QR code is scanned' },
                        { event: 'user.login', description: 'Triggered when a user logs in' },
                      ].map((webhook, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {webhook.event}
                            </code>
                            <span className="text-sm text-gray-600">{webhook.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Webhook Payload</h4>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">
                        {`{
  "event": "asset.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "asset": {
      "id": "asset-123",
      "name": "MacBook Pro 16\"",
      "category": "it-equipment",
      "created_by": "user-456",
      "created_at": "2024-01-15T10:30:00Z"
    }
  },
  "webhook_id": "webhook-789"
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Webhook Configuration</h4>
                    <p className="text-gray-600 mb-3">
                      Configure webhooks in your account settings or via the API:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                      <pre className="text-sm">
                        {`POST /api/webhooks
Authorization: Bearer YOUR_TOKEN

{
  "url": "https://your-app.com/webhooks/assets",
  "events": ["asset.created", "asset.updated"],
  "secret": "your-webhook-secret"
}`}
                      </pre>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security:</strong> Webhook payloads are signed with HMAC-SHA256.
                      Verify signatures to ensure authenticity.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="openapi">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>OpenAPI / Swagger Reference</CardTitle>
                  <CardDescription>
                    Interactive API reference generated from the OpenAPI spec
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      disabled={loadingSpec || !openApiSpec}
                    >
                      <a href="/api/external/docs" download="openapi.json">
                        Download OpenAPI JSON
                      </a>
                    </Button>
                  </div>
                  {loadingSpec && <div>Loading OpenAPI spec...</div>}
                  {specError && <div className="text-red-600">{specError}</div>}
                  {openApiSpec && (
                    <div className="bg-white rounded shadow p-2">
                      <SwaggerUI spec={openApiSpec} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* SDK and Tools */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>SDKs and Tools</CardTitle>
            <CardDescription>
              Official SDKs and tools to accelerate your integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">JavaScript SDK</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Official JavaScript/TypeScript SDK for web and Node.js applications
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Python SDK</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Python library for easy integration with your Python applications
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on PyPI
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Postman Collection</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Complete Postman collection for testing and exploring the API
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Import Collection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
