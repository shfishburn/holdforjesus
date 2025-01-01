
ALTER TABLE public.ai_incident_summary
  ADD COLUMN IF NOT EXISTS trend text NOT NULL DEFAULT 'stable',
  ADD COLUMN IF NOT EXISTS recent_12m_count integer NOT NULL DEFAULT 0;
