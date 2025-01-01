
-- ═══════════════════════════════════════════════════════════════
-- Observatory Architecture v2 — Issues 1, 2, 4, 7, 9
-- ═══════════════════════════════════════════════════════════════

-- ── Issue 1: Admissibility layer on canonical_entities ─────────
CREATE TYPE public.admissibility_status AS ENUM (
  'authoritative', 'signal_only', 'derived', 'needs_review'
);

ALTER TABLE public.canonical_entities
  ADD COLUMN admissibility_status public.admissibility_status NOT NULL DEFAULT 'needs_review',
  ADD COLUMN admissibility_reasons text[] NOT NULL DEFAULT '{}';

-- ── Issue 4: Time basis field ──────────────────────────────────
CREATE TYPE public.time_basis AS ENUM (
  'observed', 'reported', 'published', 'estimated'
);

ALTER TABLE public.canonical_entities
  ADD COLUMN time_basis public.time_basis NOT NULL DEFAULT 'observed';

-- ── Issue 9: Expand source metadata on raw_records ─────────────
ALTER TABLE public.raw_records
  ADD COLUMN ingest_run_id uuid,
  ADD COLUMN http_status integer,
  ADD COLUMN content_type text,
  ADD COLUMN source_version text;

-- ── Issue 2: Incident cluster model ───────────────────────────
CREATE TABLE public.incident_clusters (
  cluster_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain public.pipeline_domain NOT NULL DEFAULT 'other',
  centroid_lat double precision,
  centroid_lon double precision,
  start_at timestamptz,
  end_at timestamptz,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cluster_members (
  cluster_id uuid NOT NULL REFERENCES public.incident_clusters(cluster_id) ON DELETE CASCADE,
  canonical_id uuid NOT NULL REFERENCES public.canonical_entities(canonical_id) ON DELETE CASCADE,
  membership_confidence numeric NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cluster_id, canonical_id)
);

ALTER TABLE public.incident_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read incident clusters"
  ON public.incident_clusters FOR SELECT
  USING (true);

CREATE POLICY "Public can read cluster members"
  ON public.cluster_members FOR SELECT
  USING (true);

-- ── Issue 7: Normalization registry ───────────────────────────
CREATE TABLE public.normalization_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_code text NOT NULL,
  indicator_name text,
  baseline_min numeric NOT NULL DEFAULT 0,
  baseline_max numeric NOT NULL,
  normalization_method text NOT NULL DEFAULT 'min_max_clamp',
  direction text NOT NULL DEFAULT 'higher_is_worse',
  weight numeric NOT NULL DEFAULT 0,
  model_version text NOT NULL DEFAULT 'distress-v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (indicator_code, model_version)
);

ALTER TABLE public.normalization_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read normalization registry"
  ON public.normalization_registry FOR SELECT
  USING (true);

-- ── Issue 10: Rename composite score field in derived_scores ──
-- (Standardize on composite_suffering_index in scores JSONB — no DDL needed, handled in code)

-- ── Seed the normalization registry with current weights ──────
INSERT INTO public.normalization_registry (indicator_code, indicator_name, baseline_min, baseline_max, direction, weight, model_version) VALUES
  ('SI.POV.DDAY',       'Extreme Poverty (% at $2.15/day)',           0,   50,       'higher_is_worse', 0.09, 'distress-v1'),
  ('SH.DYN.MORT',       'Under-5 Mortality (per 1,000 live births)', 0,   200,      'higher_is_worse', 0.07, 'distress-v1'),
  ('SP.DYN.LE00.IN',    'Life Expectancy at Birth (years)',           40,  85,       'lower_is_worse',  0.06, 'distress-v1'),
  ('SN.ITK.DEFC.ZS',    'Prevalence of Undernourishment (%)',         0,   35,       'higher_is_worse', 0.08, 'distress-v1'),
  ('UNHCR.DISPLACED',   'Forcibly Displaced Persons',                 0,   120000000,'higher_is_worse', 0.12, 'distress-v1'),
  ('GSI.SLAVERY',        'People in Modern Slavery',                   0,   80000000, 'higher_is_worse', 0.09, 'distress-v1'),
  ('GDELT.INSTABILITY',  'Global Crisis Instability Signal',           0,   100,      'higher_is_worse', 0.08, 'distress-v1'),
  ('SDG.16.1.1',         'Intentional Homicide Rate',                  0,   30,       'higher_is_worse', 0.07, 'distress-v1'),
  ('ACLED.FATALITIES',   'Conflict Fatalities (ACLED)',                0,   200000,   'higher_is_worse', 0.10, 'distress-v1'),
  ('WHO.NEONATAL',       'Neonatal Mortality Rate',                    0,   50,       'higher_is_worse', 0.07, 'distress-v1'),
  ('USGS.EARTHQUAKES',   'Significant Earthquakes (M5.0+)',            0,   200,      'higher_is_worse', 0.06, 'distress-v1'),
  ('FIRMS.WILDFIRES',    'Active Fire Detections (24h)',               0,   300000,   'higher_is_worse', 0.06, 'distress-v1'),
  ('HDX.CRISES',         'Humanitarian Crisis Datasets',               0,   5000,     'higher_is_worse', 0.05, 'distress-v1');
