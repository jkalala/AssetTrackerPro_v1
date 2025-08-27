import { createClient } from '@/lib/supabase/server';

export async function deliverWebhooks({ tenant_id, event, payload }: { tenant_id: string, event: string, payload: Record<string, unknown> }) {
  const supabase = await createClient();
  // Fetch active webhooks for this tenant and event
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('status', 'active');
  if (error || !webhooks) return;
  for (const webhook of webhooks) {
    if (!webhook.events.includes(event)) continue;
    try {
      // Optionally sign payload with webhook.secret
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'X-Signature': ... // TODO: Add HMAC signature if needed
        },
        body: JSON.stringify({ event, payload }),
      });
      // Optionally: log delivery success
    } catch (err) {
      // Optionally: log delivery failure, retry, etc.
      // console.error('Webhook delivery failed:', err);
    }
  }
} 