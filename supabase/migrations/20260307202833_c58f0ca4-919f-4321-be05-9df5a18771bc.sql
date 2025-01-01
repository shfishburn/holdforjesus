CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  faith TEXT,
  department TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — this is public anonymous logging, insert-only
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from edge function using service role, but also anon)
CREATE POLICY "Allow anonymous inserts" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- No select/update/delete for public users
CREATE POLICY "No public reads" ON public.analytics_events
  FOR SELECT TO anon, authenticated
  USING (false);
