
-- 1. Add 'ai_harm_observation' to entity_kind enum
ALTER TYPE public.entity_kind ADD VALUE IF NOT EXISTS 'ai_harm_observation';

-- 2. Create ai_incident_summary cache table for widget
CREATE TABLE public.ai_incident_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_incidents integer NOT NULL DEFAULT 0,
  vulnerable_incidents integer NOT NULL DEFAULT 0,
  vulnerable_percent numeric NOT NULL DEFAULT 0,
  top_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_fetched_at timestamptz NOT NULL DEFAULT now(),
  ingest_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read, no public write
ALTER TABLE public.ai_incident_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ai incident summary"
  ON public.ai_incident_summary
  FOR SELECT
  USING (true);
