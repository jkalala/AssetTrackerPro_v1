import { randomBytes, createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from './audit-log';

export async function generateApiKey(): Promise<string> {
  // Generate a random 32-byte key with "ak_" prefix
  const randomKey = randomBytes(32).toString('hex');
  return `ak_${randomKey}`;
}

export async function storeApiKey({ 
  tenant_id, 
  user_id, 
  name, 
  permissions 
}: { 
  tenant_id: string, 
  user_id: string, 
  name?: string,
  permissions?: {
    assets: {
      read: boolean;
      write: boolean;
    };
  }
}) {
  const supabase = await createClient();
  const key = await generateApiKey();
  // Store a hash of the key for security
  const keyHash = createHash('sha256').update(key).digest('hex');
  const { error, data } = await supabase.from('api_keys').insert({
    tenant_id,
    user_id,
    key_name: name || 'Unnamed Key',
    key_prefix: key.substring(0, 8), // First 8 characters for identification
    key_hash: keyHash,
    permissions: permissions || { assets: { read: false, write: false } },
  }).select().single();
  if (error) throw error;
  // Audit log: API key created
  await logAuditEvent({
    user_id,
    action: 'create_api_key',
    entity: 'api_key',
    entity_id: data.id,
    details: { name, permissions },
    tenant_id,
    after: data,
    // ip_address, user_agent can be added from API context
  });
  // Return the plain key (only shown once)
  return { apiKey: key, record: data };
}

export async function validateApiKey(key: string): Promise<{ valid: boolean, tenant_id?: string, user_id?: string, api_key_id?: string }> {
  const supabase = await createClient();
  const keyHash = createHash('sha256').update(key).digest('hex');
  const { data, error } = await supabase.from('api_keys').select('*').eq('key_hash', keyHash).eq('is_active', true).single();
  if (error || !data) return { valid: false };
  return { valid: true, tenant_id: data.tenant_id, user_id: data.user_id, api_key_id: data.id };
}

export async function revokeApiKey({ id, tenant_id, user_id }: { id: string, tenant_id: string, user_id: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from('api_keys').update({ 
    is_active: false, 
    revoked_at: new Date().toISOString(),
    revoked_reason: 'User revoked'
  }).eq('id', id).eq('tenant_id', tenant_id);
  if (error) throw error;
  // Audit log: API key revoked
  await logAuditEvent({
    user_id,
    action: 'revoke_api_key',
    entity: 'api_key',
    entity_id: id,
    details: {},
    tenant_id,
    before: { id },
    // ip_address, user_agent can be added from API context
  });
} 