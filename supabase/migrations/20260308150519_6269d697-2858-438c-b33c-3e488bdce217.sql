
-- ═══════════════════════════════════════════════════════════════
-- HUMANITARIAN DATA PIPELINE — 4-TABLE ARCHITECTURE
-- ═══════════════════════════════════════════════════════════════

-- Enum types for controlled taxonomies
CREATE TYPE public.entity_kind AS ENUM (
  'event',
  'indicator_observation',
  'population_observation',
  'dataset_resource'
);

CREATE TYPE public.pipeline_domain AS ENUM (
  'conflict',
  'disaster',
  'health',
  'displacement',
  'food_security',
  'humanitarian_catalog',
  'slavery',
  'development',
  'other'
);

CREATE TYPE public.time_precision AS ENUM (
  'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year', 'unknown'
);

CREATE TYPE public.location_precision AS ENUM (
  'exact', 'near_exact', 'admin1', 'admin2', 'country', 'global', 'unknown'
);

-- ── 1. RAW RECORDS ─────────────────────────────────────────────
-- Exact source payload, untouched. Chain-of-custody root.
CREATE TABLE public.raw_records (
  raw_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  endpoint text NOT NULL,
  source_record_id text,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  raw_payload jsonb NOT NULL,
  raw_sha256 text NOT NULL,
  license text,
  UNIQUE (source_system, endpoint, source_record_id, raw_sha256)
);

-- ── 2. CANONICAL ENTITIES ──────────────────────────────────────
-- One normalized record per event / observation / aggregate.
CREATE TABLE public.canonical_entities (
  canonical_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_kind public.entity_kind NOT NULL,
  source_system text NOT NULL,
  source_record_id text,

  -- Time
  observed_at timestamptz,
  start_at timestamptz,
  end_at timestamptz,
  time_precision_val public.time_precision DEFAULT 'unknown',

  -- Taxonomy
  domain public.pipeline_domain NOT NULL DEFAULT 'other',
  subdomain text,
  event_type text,
  event_subtype text,
  hazard_type text,
  indicator_code text,
  indicator_name text,
  population_type text,

  -- Location
  country_code text,
  admin1 text,
  admin2 text,
  place_name text,
  lat double precision,
  lon double precision,
  location_precision_val public.location_precision DEFAULT 'unknown',

  -- Subjects
  actor_primary text,
  actor_secondary text,
  affected_population text,

  -- Metrics
  fatalities numeric,
  injuries numeric,
  displaced_persons numeric,
  affected_persons numeric,
  magnitude numeric,
  value numeric,
  unit text,

  -- Content
  title text,
  summary text,
  language text,

  -- Quality & Lineage (JSONB for flexibility)
  quality jsonb NOT NULL DEFAULT '{}',
  lineage jsonb NOT NULL DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. CANONICAL-RAW LINKS ─────────────────────────────────────
-- Provenance chain: which raw records produced which canonical entities.
CREATE TABLE public.canonical_raw_links (
  canonical_id uuid NOT NULL REFERENCES public.canonical_entities(canonical_id) ON DELETE CASCADE,
  raw_id uuid NOT NULL REFERENCES public.raw_records(raw_id) ON DELETE CASCADE,
  link_role text NOT NULL DEFAULT 'source',
  PRIMARY KEY (canonical_id, raw_id)
);

-- ── 4. DERIVED SCORES ──────────────────────────────────────────
-- Severity, suffering, confidence, and aggregation outputs.
CREATE TABLE public.derived_scores (
  score_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id uuid NOT NULL REFERENCES public.canonical_entities(canonical_id) ON DELETE CASCADE,
  scoring_model text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  scores jsonb NOT NULL DEFAULT '{}',
  inputs jsonb NOT NULL DEFAULT '{}'
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Raw records: lookup by source
CREATE INDEX idx_raw_source ON public.raw_records (source_system, retrieved_at DESC);

-- Canonical entities: primary query patterns
CREATE INDEX idx_canonical_domain ON public.canonical_entities (domain, observed_at DESC);
CREATE INDEX idx_canonical_source ON public.canonical_entities (source_system, observed_at DESC);
CREATE INDEX idx_canonical_kind ON public.canonical_entities (entity_kind);
CREATE INDEX idx_canonical_indicator ON public.canonical_entities (indicator_code) WHERE indicator_code IS NOT NULL;
CREATE INDEX idx_canonical_country ON public.canonical_entities (country_code) WHERE country_code IS NOT NULL;
CREATE INDEX idx_canonical_geo ON public.canonical_entities (lat, lon) WHERE lat IS NOT NULL AND lon IS NOT NULL;

-- Derived scores: lookup by model and time
CREATE INDEX idx_derived_model ON public.derived_scores (scoring_model, computed_at DESC);
CREATE INDEX idx_derived_canonical ON public.derived_scores (canonical_id);

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
-- These tables are written by service-role (edge functions) and 
-- read publicly for the Observatory dashboard.

ALTER TABLE public.raw_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_raw_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derived_scores ENABLE ROW LEVEL SECURITY;

-- Public read access for Observatory
CREATE POLICY "Public can read canonical entities"
  ON public.canonical_entities FOR SELECT
  USING (true);

CREATE POLICY "Public can read derived scores"
  ON public.derived_scores FOR SELECT
  USING (true);

-- Raw records: no public access (service role only)
CREATE POLICY "No public access to raw records"
  ON public.raw_records FOR SELECT
  USING (false);

CREATE POLICY "No public access to raw links"
  ON public.canonical_raw_links FOR SELECT
  USING (false);
