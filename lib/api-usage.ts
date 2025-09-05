import { createClient } from '@/lib/supabase/server'

export async function logApiUsage({
  api_key_id,
  endpoint,
  status,
}: {
  api_key_id: string
  endpoint: string
  status: number
}) {
  const supabase = await createClient()
  await supabase.from('api_usage').insert({
    api_key_id,
    endpoint,
    status,
    called_at: new Date().toISOString(),
  })
}
