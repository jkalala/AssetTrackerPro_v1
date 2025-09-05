import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, message } = await request.json()
  if (!email || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  // TODO: Integrate with Zendesk, Freshdesk, or send email
  console.log('Support ticket received:', { email, message })
  return NextResponse.json({ success: true })
}
