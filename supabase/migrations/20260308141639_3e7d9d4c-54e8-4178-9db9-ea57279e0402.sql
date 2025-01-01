CREATE TABLE public.suffering_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_code text NOT NULL,
  indicator_name text NOT NULL,
  source text NOT NULL,
  value numeric,
  unit text,
  year integer,
  country_code text DEFAULT 'WLD',
  normalized_value numeric,
  weight numeric DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (indicator_code, country_code, year)
);

CREATE TABLE public.suffering_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_score numeric NOT NULL,
  components jsonb NOT NULL DEFAULT '{}',
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- Public read access for both tables
ALTER TABLE public.suffering_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suffering_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read metrics" ON public.suffering_metrics FOR SELECT USING (true);
CREATE POLICY "Public can read index" ON public.suffering_index FOR SELECT USING (true);