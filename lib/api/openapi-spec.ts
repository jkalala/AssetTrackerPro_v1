/**
 * OpenAPI 3.0 Specification Generator
 * Auto-generates comprehensive API documentation
 */

import { OpenAPIV3 } from 'openapi-types'

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'AssetTracker Pro Enterprise API',
    description: `
# AssetTracker Pro Enterprise API

A comprehensive enterprise asset management platform API providing:

- **Asset Management**: Complete CRUD operations for assets with lifecycle tracking
- **User Management**: Role-based access control with hierarchical permissions
- **Enterprise Integration**: ERP, CMMS, and LDAP/AD integrations
- **Webhook System**: Reliable event delivery with retry mechanisms
- **Analytics**: Real-time dashboards and business intelligence
- **Multi-tenant**: Secure tenant isolation and data residency

## Authentication

All API endpoints require authentication using Bearer tokens:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate limited to 1000 requests per minute per user.

## Webhooks

Webhook payloads are signed using HMAC-SHA256. Verify signatures using the webhook secret:

\`\`\`
X-Webhook-Signature: sha256=<signature>
\`\`\`

## GraphQL

A comprehensive GraphQL API is available at \`/api/graphql\` with:
- Type-safe queries and mutations
- Real-time subscriptions
- Introspection and playground (development only)
    `,
    version: '1.0.0',
    contact: {
      name: 'AssetTracker Pro Support',
      email: 'support@assettrackerpro.com',
      url: 'https://assettrackerpro.com/support',
    },
    license: {
      name: 'Commercial License',
      url: 'https://assettrackerpro.com/license',
    },
  },
  servers: [
    {
      url: 'https://api.assettrackerpro.com',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.assettrackerpro.com',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Asset: {
        type: 'object',
        required: ['id', 'tenantId', 'assetId', 'name', 'status'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique asset identifier',
          },
          tenantId: {
            type: 'string',
            format: 'uuid',
            description: 'Tenant identifier',
          },
          assetId: {
            type: 'string',
            description: 'Human-readable asset ID',
            example: 'LAPTOP-001',
          },
          name: {
            type: 'string',
            description: 'Asset name',
            example: 'Dell Latitude 7420',
          },
          description: {
            type: 'string',
            description: 'Asset description',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'DISPOSED'],
            description: 'Current asset status',
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'Asset category identifier',
          },
          locationId: {
            type: 'string',
            format: 'uuid',
            description: 'Current location identifier',
          },
          assigneeId: {
            type: 'string',
            format: 'uuid',
            description: 'Assigned user identifier',
          },
          purchasePrice: {
            type: 'number',
            format: 'decimal',
            description: 'Original purchase price',
            example: 1299.99,
          },
          currentValue: {
            type: 'number',
            format: 'decimal',
            description: 'Current depreciated value',
            example: 899.99,
          },
          purchaseDate: {
            type: 'string',
            format: 'date',
            description: 'Purchase date',
          },
          warrantyExpiry: {
            type: 'string',
            format: 'date',
            description: 'Warranty expiration date',
          },
          specifications: {
            type: 'object',
            description: 'Technical specifications',
            additionalProperties: true,
          },
          customFields: {
            type: 'object',
            description: 'Custom field values',
            additionalProperties: true,
          },
          qrCode: {
            type: 'string',
            description: 'QR code identifier',
          },
          rfidTag: {
            type: 'string',
            description: 'RFID tag identifier',
          },
          barcode: {
            type: 'string',
            description: 'Barcode identifier',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Integration: {
        type: 'object',
        required: ['id', 'tenantId', 'name', 'type', 'status'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Integration identifier',
          },
          tenantId: {
            type: 'string',
            format: 'uuid',
            description: 'Tenant identifier',
          },
          name: {
            type: 'string',
            description: 'Integration name',
            example: 'SAP ERP Integration',
          },
          type: {
            type: 'string',
            enum: [
              'ERP_SAP',
              'ERP_ORACLE',
              'ERP_DYNAMICS',
              'CMMS_MAXIMO',
              'CMMS_MAINTENANCE_CONNECTION',
              'LDAP',
              'ACTIVE_DIRECTORY',
              'WEBHOOK',
            ],
            description: 'Integration type',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING'],
            description: 'Integration status',
          },
          configuration: {
            type: 'object',
            description: 'Integration configuration (sensitive fields encrypted)',
            additionalProperties: true,
          },
          lastSyncAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last successful sync timestamp',
          },
          nextSyncAt: {
            type: 'string',
            format: 'date-time',
            description: 'Next scheduled sync timestamp',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Webhook: {
        type: 'object',
        required: ['id', 'tenantId', 'name', 'url', 'events', 'isActive'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Webhook identifier',
          },
          tenantId: {
            type: 'string',
            format: 'uuid',
            description: 'Tenant identifier',
          },
          name: {
            type: 'string',
            description: 'Webhook name',
            example: 'Asset Updates Webhook',
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Webhook endpoint URL',
            example: 'https://api.example.com/webhooks/assets',
          },
          events: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of events to subscribe to',
            example: ['asset.created', 'asset.updated', 'asset.deleted'],
          },
          secret: {
            type: 'string',
            description: 'Webhook signing secret (write-only)',
            writeOnly: true,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether webhook is active',
          },
          retryPolicy: {
            $ref: '#/components/schemas/RetryPolicy',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      RetryPolicy: {
        type: 'object',
        required: ['maxAttempts', 'backoffMultiplier', 'initialDelay', 'maxDelay'],
        properties: {
          maxAttempts: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            description: 'Maximum number of retry attempts',
            example: 5,
          },
          backoffMultiplier: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Exponential backoff multiplier',
            example: 2,
          },
          initialDelay: {
            type: 'integer',
            minimum: 100,
            maximum: 60000,
            description: 'Initial delay in milliseconds',
            example: 1000,
          },
          maxDelay: {
            type: 'integer',
            minimum: 1000,
            maximum: 3600000,
            description: 'Maximum delay in milliseconds',
            example: 300000,
          },
        },
      },
      SyncResult: {
        type: 'object',
        required: ['id', 'integrationId', 'status', 'recordsProcessed', 'recordsSucceeded', 'recordsFailed'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Sync result identifier',
          },
          integrationId: {
            type: 'string',
            format: 'uuid',
            description: 'Integration identifier',
          },
          status: {
            type: 'string',
            enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
            description: 'Sync status',
          },
          recordsProcessed: {
            type: 'integer',
            description: 'Total records processed',
            example: 1000,
          },
          recordsSucceeded: {
            type: 'integer',
            description: 'Records successfully processed',
            example: 950,
          },
          recordsFailed: {
            type: 'integer',
            description: 'Records that failed processing',
            example: 50,
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of error messages',
          },
          startedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Sync start timestamp',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Sync completion timestamp',
          },
        },
      },
      Error: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Resource not found',
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'RESOURCE_NOT_FOUND',
          },
        },
      },
      Success: {
        type: 'object',
        required: ['success'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            description: 'Response data',
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      RateLimited: {
        description: 'Rate limit exceeded',
        headers: {
          'Retry-After': {
            description: 'Seconds to wait before retrying',
            schema: {
              type: 'integer',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/Error',
                },
                {
                  type: 'object',
                  properties: {
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: {
                            type: 'string',
                          },
                          message: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/assets': {
      get: {
        summary: 'List assets',
        description: 'Retrieve a paginated list of assets for the authenticated tenant',
        tags: ['Assets'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (1-based)',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by asset status',
            schema: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'DISPOSED'],
            },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search assets by name or asset ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Assets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Asset',
                          },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            page: {
                              type: 'integer',
                            },
                            limit: {
                              type: 'integer',
                            },
                            total: {
                              type: 'integer',
                            },
                            totalPages: {
                              type: 'integer',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
      post: {
        summary: 'Create asset',
        description: 'Create a new asset',
        tags: ['Assets'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId', 'name'],
                properties: {
                  assetId: {
                    type: 'string',
                    description: 'Human-readable asset ID',
                    example: 'LAPTOP-001',
                  },
                  name: {
                    type: 'string',
                    description: 'Asset name',
                    example: 'Dell Latitude 7420',
                  },
                  description: {
                    type: 'string',
                    description: 'Asset description',
                  },
                  categoryId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Asset category identifier',
                  },
                  locationId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Location identifier',
                  },
                  assigneeId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Assigned user identifier',
                  },
                  purchasePrice: {
                    type: 'number',
                    format: 'decimal',
                    description: 'Purchase price',
                  },
                  purchaseDate: {
                    type: 'string',
                    format: 'date',
                    description: 'Purchase date',
                  },
                  warrantyExpiry: {
                    type: 'string',
                    format: 'date',
                    description: 'Warranty expiration date',
                  },
                  specifications: {
                    type: 'object',
                    description: 'Technical specifications',
                    additionalProperties: true,
                  },
                  customFields: {
                    type: 'object',
                    description: 'Custom field values',
                    additionalProperties: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Asset created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Asset',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/integrations': {
      get: {
        summary: 'List integrations',
        description: 'Retrieve all integrations for the authenticated tenant',
        tags: ['Integrations'],
        responses: {
          '200': {
            description: 'Integrations retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Integration',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
      post: {
        summary: 'Create integration',
        description: 'Create a new enterprise system integration',
        tags: ['Integrations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'configuration'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Integration name',
                    example: 'SAP ERP Integration',
                  },
                  type: {
                    type: 'string',
                    enum: [
                      'ERP_SAP',
                      'ERP_ORACLE',
                      'ERP_DYNAMICS',
                      'CMMS_MAXIMO',
                      'CMMS_MAINTENANCE_CONNECTION',
                      'LDAP',
                      'ACTIVE_DIRECTORY',
                      'WEBHOOK',
                    ],
                    description: 'Integration type',
                  },
                  configuration: {
                    type: 'object',
                    description: 'Integration configuration (varies by type)',
                    additionalProperties: true,
                    example: {
                      endpoint: 'https://sap.company.com/api',
                      sapClient: '100',
                      username: 'integration_user',
                      password: 'secure_password',
                      syncInterval: 3600,
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Integration created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Integration',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/integrations/{id}/sync': {
      post: {
        summary: 'Trigger integration sync',
        description: 'Manually trigger synchronization for an integration',
        tags: ['Integrations'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Integration identifier',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Sync triggered successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/SyncResult',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Sync already in progress or integration error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/webhooks': {
      get: {
        summary: 'List webhooks',
        description: 'Retrieve all webhooks for the authenticated tenant',
        tags: ['Webhooks'],
        responses: {
          '200': {
            description: 'Webhooks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Webhook',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
      post: {
        summary: 'Create webhook',
        description: 'Create a new webhook for event notifications',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'url', 'events'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Webhook name',
                    example: 'Asset Updates Webhook',
                  },
                  url: {
                    type: 'string',
                    format: 'uri',
                    description: 'Webhook endpoint URL (must be HTTPS in production)',
                    example: 'https://api.example.com/webhooks/assets',
                  },
                  events: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'List of events to subscribe to',
                    example: ['asset.created', 'asset.updated', 'asset.deleted'],
                  },
                  secret: {
                    type: 'string',
                    description: 'Webhook signing secret (auto-generated if not provided)',
                  },
                  retryPolicy: {
                    $ref: '#/components/schemas/RetryPolicy',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Webhook',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/webhooks/{id}/test': {
      post: {
        summary: 'Test webhook',
        description: 'Send a test event to a webhook endpoint',
        tags: ['Webhooks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Webhook identifier',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Test webhook sent successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Success',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'string',
                              format: 'uuid',
                            },
                            status: {
                              type: 'string',
                              enum: ['DELIVERED', 'FAILED'],
                            },
                            responseCode: {
                              type: 'integer',
                            },
                            deliveredAt: {
                              type: 'string',
                              format: 'date-time',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/graphql': {
      post: {
        summary: 'GraphQL endpoint',
        description: `
GraphQL endpoint supporting queries, mutations, and subscriptions.

## Available Operations

### Queries
- \`tenant\`: Get current tenant information
- \`assets\`: List and filter assets with pagination
- \`asset(id)\`: Get specific asset by ID
- \`users\`: List users with filtering
- \`integrations\`: List enterprise integrations
- \`webhooks\`: List configured webhooks
- \`assetAnalytics\`: Get asset analytics and metrics
- \`search\`: Global search across resources

### Mutations
- \`createAsset\`: Create new asset
- \`updateAsset\`: Update existing asset
- \`deleteAsset\`: Delete asset
- \`createIntegration\`: Create enterprise integration
- \`triggerSync\`: Trigger integration synchronization
- \`createWebhook\`: Create webhook
- \`testWebhook\`: Test webhook delivery
- \`bulkCreateAssets\`: Bulk create multiple assets
- \`bulkUpdateAssets\`: Bulk update multiple assets

### Subscriptions
- \`assetUpdated\`: Real-time asset updates
- \`assetCreated\`: Real-time asset creation events
- \`sensorDataReceived\`: Real-time IoT sensor data
- \`syncCompleted\`: Integration sync completion events

## Example Query

\`\`\`graphql
query GetAssets($first: Int, $filter: AssetFilter) {
  assets(first: $first, filter: $filter) {
    edges {
      node {
        id
        assetId
        name
        status
        assignee {
          firstName
          lastName
        }
        location {
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
\`\`\`
        `,
        tags: ['GraphQL'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: {
                    type: 'string',
                    description: 'GraphQL query string',
                  },
                  variables: {
                    type: 'object',
                    description: 'Query variables',
                    additionalProperties: true,
                  },
                  operationName: {
                    type: 'string',
                    description: 'Operation name (for multi-operation documents)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'GraphQL response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      description: 'Query result data',
                    },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          message: {
                            type: 'string',
                          },
                          locations: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                line: {
                                  type: 'integer',
                                },
                                column: {
                                  type: 'integer',
                                },
                              },
                            },
                          },
                          path: {
                            type: 'array',
                            items: {
                              oneOf: [
                                {
                                  type: 'string',
                                },
                                {
                                  type: 'integer',
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                    extensions: {
                      type: 'object',
                      description: 'Additional response metadata',
                      additionalProperties: true,
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'GraphQL syntax error or validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          message: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Assets',
      description: 'Asset management operations',
    },
    {
      name: 'Integrations',
      description: 'Enterprise system integrations',
    },
    {
      name: 'Webhooks',
      description: 'Webhook management and event delivery',
    },
    {
      name: 'GraphQL',
      description: 'GraphQL API endpoint',
    },
  ],
}