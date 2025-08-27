import { createClient } from '@/lib/supabase/server';

export async function sendIntegrationNotification({ tenant_id, message, event }: { tenant_id: string, message: string, event?: string }) {
  const supabase = await createClient();
  // Fetch active integrations for this tenant
  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('status', 'active');
  if (error || !integrations) return;
  for (const integration of integrations) {
    if (!integration.webhook_url) continue;
    // Optionally filter by event type if needed
    try {
      await fetch(integration.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }), // Slack/Teams expect { text }
      });
      // Optionally: log delivery success
    } catch (_err) {
      // Optionally: log delivery failure, retry, etc.
    }
  }
} 