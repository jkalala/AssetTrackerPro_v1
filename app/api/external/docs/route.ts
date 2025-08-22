import { NextResponse } from 'next/server';

const assetSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    asset_id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    status: { type: 'string' },
    location: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    // ...add more fields as needed
  }
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    full_name: { type: 'string' },
    avatar_url: { type: 'string' },
    role: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
  }
};

const analyticsResponseSchema = {
  type: 'object',
  properties: {
    totalAssets: { type: 'number' },
    totalUsers: { type: 'number' },
    recentAssets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          asset_id: { type: 'string' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        }
      }
    }
  }
};

const webhookRequestSchema = {
  type: 'object',
  properties: {
    url: { type: 'string', format: 'uri' },
    events: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of event types to subscribe to.'
    },
    secret: { type: 'string', description: 'Secret for signing payloads.' }
  },
  required: ['url', 'events']
};

const webhookResponseSchema = {
  type: 'object',
  properties: {
    webhook_id: { type: 'string' },
    url: { type: 'string', format: 'uri' },
    events: { type: 'array', items: { type: 'string' } },
    created_at: { type: 'string', format: 'date-time' }
  }
};

const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' }
  }
};

// Minimal OpenAPI spec for the external assets endpoint
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AssetPro External API',
    version: '1.0.0',
    description: 'API for accessing assets and users by tenant using API keys.'
  },
  servers: [
    { url: '/api/external' }
  ],
  paths: {
    '/assets': {
      get: {
        summary: 'List assets for tenant',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'List of assets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: assetSchema }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
          429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: errorResponse } } },
          500: { description: 'Server error', content: { 'application/json': { schema: errorResponse } } }
        }
      },
      post: {
        summary: 'Create a new asset',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: assetSchema
            }
          }
        },
        responses: {
          200: {
            description: 'Asset created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: assetSchema }
                }
              }
            }
          },
          400: { description: 'Invalid input', content: { 'application/json': { schema: errorResponse } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponse } } },
          429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: errorResponse } } },
          500: { description: 'Server error', content: { 'application/json': { schema: errorResponse } } }
        }
      }
    },
    '/assets/{assetId}': {
      get: {
        summary: 'Get asset by assetId',
        parameters: [
          {
            name: 'assetId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Asset ID'
          }
        ],
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Asset details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: assetSchema }
                }
              }
            }
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
          404: { description: 'Asset not found', content: { 'application/json': { schema: errorResponse } } },
          429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: errorResponse } } },
          500: { description: 'Server error', content: { 'application/json': { schema: errorResponse } } }
        }
      }
    },
    '/users': {
      get: {
        summary: 'List users for tenant',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: userSchema }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
          429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: errorResponse } } },
          500: { description: 'Server error', content: { 'application/json': { schema: errorResponse } } }
        }
      }
    },
    '/analytics': {
      get: {
        summary: 'Get analytics summary for tenant',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Analytics summary',
            content: {
              'application/json': {
                schema: analyticsResponseSchema
              }
            }
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
          403: { description: 'Analytics not enabled', content: { 'application/json': { schema: errorResponse } } },
          429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: errorResponse } } },
          500: { description: 'Server error', content: { 'application/json': { schema: errorResponse } } }
        }
      }
    },
    '/webhooks': {
      post: {
        summary: 'Register a webhook endpoint',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: webhookRequestSchema
            }
          }
        },
        responses: {
          200: {
            description: 'Webhook registered',
            content: {
              'application/json': {
                schema: webhookResponseSchema
              }
            }
          },
          400: { description: 'Invalid input', content: { 'application/json': { schema: errorResponse } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
          429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: errorResponse } } },
          500: { description: 'Server error', content: { 'application/json': { schema: errorResponse } } }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Use Bearer <API_KEY>'
      }
    }
  }
};

export async function GET() {
  return NextResponse.json(openApiSpec);
} 