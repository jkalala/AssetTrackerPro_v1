import { createClient } from '@/lib/supabase/server'

export type AuditLogEvent = {
  user_id: string
  action: string
  entity: string
  entity_id?: string
  details?: Record<string, any>
  tenant_id?: string
  ip_address?: string
  before?: Record<string, any>
  after?: Record<string, any>
  user_agent?: string
}

/**
 * Logs an audit event to the audit_logs table.
 * @param event AuditLogEvent
 */
export async function logAuditEvent(event: AuditLogEvent) {
  const supabase = await createClient()
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: event.user_id,
      action: event.action,
      entity: event.entity,
      entity_id: event.entity_id || null,
      details: event.details || {},
      tenant_id: event.tenant_id || null,
      ip_address: event.ip_address || null,
      before: event.before || null,
      after: event.after || null,
      user_agent: event.user_agent || null,
      created_at: new Date().toISOString(),
    })
    if (error) {
      console.error('Failed to log audit event:', error)
    }
  } catch (err) {
    console.error('Audit log error:', err)
  }
}
