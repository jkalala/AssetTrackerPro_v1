import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  const { user_id, title, body } = await request.json()
  if (!user_id || !title || !body)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get FCM token for user
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', user_id)
    .single()
  if (error || !data?.token)
    return NextResponse.json({ error: 'No push token for user' }, { status: 404 })

  // Dynamically import firebase-admin
  // @ts-expect-error: firebase-admin types are only available in Node.js
  const admin = await import('firebase-admin')
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      readFileSync(path.resolve(process.cwd(), 'serviceAccountKey.json'), 'utf8')
    )
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }
  const message = {
    notification: { title, body },
    token: data.token,
  }
  try {
    const response = await admin.messaging().send(message)
    return NextResponse.json({ success: true, response })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
