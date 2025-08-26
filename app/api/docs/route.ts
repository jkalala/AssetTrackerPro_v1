/**
 * API Documentation Endpoint
 * Serves OpenAPI specification and interactive documentation
 */

import { NextRequest, NextResponse } from 'next/server'
import { openApiSpec } from '../../../lib/api/openapi-spec'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'

  try {
    if (format === 'yaml') {
      // Convert to YAML format
      const yaml = await import('js-yaml')
      const yamlSpec = yaml.dump(openApiSpec)
      
      return new NextResponse(yamlSpec, {
        headers: {
          'Content-Type': 'application/x-yaml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Return JSON format
    return NextResponse.json(openApiSpec, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving API documentation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate API documentation',
      },
      { status: 500 }
    )
  }
}