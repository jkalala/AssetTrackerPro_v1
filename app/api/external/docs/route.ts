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
          401: { description: 'Unauthorized' }
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
          401: { description: 'Unauthorized' },
          404: { description: 'Asset not found' }
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
          401: { description: 'Unauthorized' }
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