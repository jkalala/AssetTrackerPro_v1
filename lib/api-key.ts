import { randomBytes, createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from './audit-log';

export async function generateApiKey(): Promise<string> {
  // Generate a random 32-byte key and return as hex
  return randomBytes(32).toString('hex');
}

export async function storeApiKey({ tenant_id, user_id, name }: { tenant_id: string, user_id: string, name?: string }) {
  const supabase = await createClient();
  const key = await generateApiKey();
  // Store a hash of the key for security
  const keyHash = createHash('sha256').update(key).digest('hex');
  const { error, data } = await supabase.from('api_keys').insert({
    tenant_id,
    user_id,
    key: keyHash,
    name,
  }).select().single();
  if (error) throw error;
  // Audit log: API key created
  await logAuditEvent({
    user_id,
    action: 'create_api_key',
    entity: 'api_key',
    entity_id: data.id,
    details: { name },
    tenant_id,
  });
  // Return the plain key (only shown once)
  return { apiKey: key, record: data };
}

export async function validateApiKey(key: string): Promise<{ valid: boolean, tenant_id?: string, user_id?: string }> {
  const supabase = await createClient();
  const keyHash = createHash('sha256').update(key).digest('hex');
  const { data, error } = await supabase.from('api_keys').select('*').eq('key', keyHash).eq('revoked', false).single();
  if (error || !data) return { valid: false };
  return { valid: true, tenant_id: data.tenant_id, user_id: data.user_id };
}

export async function revokeApiKey({ id, tenant_id, user_id }: { id: string, tenant_id: string, user_id: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from('api_keys').update({ revoked: true }).eq('id', id).eq('tenant_id', tenant_id);
  if (error) throw error;
  // Audit log: API key revoked
  await logAuditEvent({
    user_id,
    action: 'revoke_api_key',
    entity: 'api_key',
    entity_id: id,
    details: {},
    tenant_id,
  });
} 