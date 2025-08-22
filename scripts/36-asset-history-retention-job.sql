-- 36-asset-history-retention-job.sql
-- Scheduled job: Delete asset_history records older than the configured retention period
DO $$
DECLARE
  retention_days INTEGER;
BEGIN
  SELECT value::INTEGER INTO retention_days FROM public.app_config WHERE key = 'asset_history_retention_days';
  IF retention_days IS NULL THEN
    retention_days := 365;
  END IF;
  EXECUTE format('DELETE FROM public.asset_history WHERE performed_at < NOW() - INTERVAL ''%s days'';', retention_days);
END $$; 