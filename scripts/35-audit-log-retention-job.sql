-- 35-audit-log-retention-job.sql
-- Scheduled job: Delete audit logs older than the configured retention period
DO $$
DECLARE
  retention_days INTEGER;
BEGIN
  SELECT value::INTEGER INTO retention_days FROM public.app_config WHERE key = 'audit_log_retention_days';
  IF retention_days IS NULL THEN
    retention_days := 365;
  END IF;
  EXECUTE format('DELETE FROM public.audit_logs WHERE created_at < NOW() - INTERVAL ''%s days'';', retention_days);
END $$; 