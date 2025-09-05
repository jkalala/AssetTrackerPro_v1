import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mlResponse = await fetch('http://localhost:8000/predict-maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await mlResponse.json()
    return NextResponse.json(data, { status: mlResponse.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'ML service unavailable', details: String(error) },
      { status: 500 }
    )
  }
}
