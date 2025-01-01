-- Reconcile community + safety schema objects used by the app.
-- This migration is defensive: IF NOT EXISTS / CREATE OR REPLACE to avoid clobbering existing environments.

-- 1) Safety telemetry table used by pray edge function
CREATE TABLE IF NOT EXISTS public.safety_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_mode text NOT NULL DEFAULT 'normal',
  detected_signals text[] NOT NULL DEFAULT '{}',
  applied_guardrails text[] NOT NULL DEFAULT '{}',
  faith text,
  department text,
  category text,
  consented boolean NOT NULL DEFAULT false,
  queue_duration_ms integer,
  response_style text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts to safety_signals" ON public.safety_signals;
CREATE POLICY "Allow anonymous inserts to safety_signals"
  ON public.safety_signals
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "No public reads on safety_signals" ON public.safety_signals;
CREATE POLICY "No public reads on safety_signals"
  ON public.safety_signals
  FOR SELECT TO anon, authenticated
  USING (false);

-- 2) Community board tables
CREATE TABLE IF NOT EXISTS public.global_prayer_board (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji text NOT NULL DEFAULT '🌍',
  issue text NOT NULL,
  department text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'Open',
  voices integer NOT NULL DEFAULT 0,
  voices_today integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_prayer_voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.global_prayer_board(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, session_id)
);

CREATE TABLE IF NOT EXISTS public.prayer_wall (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_text text NOT NULL,
  category text,
  faith text,
  approved boolean NOT NULL DEFAULT true,
  reactions_pray integer NOT NULL DEFAULT 0,
  reactions_heart integer NOT NULL DEFAULT 0,
  reactions_leaf integer NOT NULL DEFAULT 0,
  reactions_candle integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prayer_wall_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES public.prayer_wall(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('pray', 'heart', 'leaf', 'candle')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prayer_id, session_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_global_prayer_board_active_sort
  ON public.global_prayer_board (active, sort_order);

CREATE INDEX IF NOT EXISTS idx_prayer_wall_created_at
  ON public.prayer_wall (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prayer_wall_reactions_session
  ON public.prayer_wall_reactions (session_id);

-- RLS policies for community surfaces
ALTER TABLE public.global_prayer_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_prayer_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_wall ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_wall_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active global prayer board" ON public.global_prayer_board;
CREATE POLICY "Public can read active global prayer board"
  ON public.global_prayer_board
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "No direct public reads of global prayer voices" ON public.global_prayer_voices;
CREATE POLICY "No direct public reads of global prayer voices"
  ON public.global_prayer_voices
  FOR SELECT TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "Allow anonymous inserts to global prayer voices" ON public.global_prayer_voices;
CREATE POLICY "Allow anonymous inserts to global prayer voices"
  ON public.global_prayer_voices
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read approved prayer wall" ON public.prayer_wall;
CREATE POLICY "Public can read approved prayer wall"
  ON public.prayer_wall
  FOR SELECT
  USING (approved = true);

DROP POLICY IF EXISTS "Allow anonymous inserts to prayer wall" ON public.prayer_wall;
CREATE POLICY "Allow anonymous inserts to prayer wall"
  ON public.prayer_wall
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "No direct public reads of prayer wall reactions" ON public.prayer_wall_reactions;
CREATE POLICY "No direct public reads of prayer wall reactions"
  ON public.prayer_wall_reactions
  FOR SELECT TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "Allow anonymous inserts to prayer wall reactions" ON public.prayer_wall_reactions;
CREATE POLICY "Allow anonymous inserts to prayer wall reactions"
  ON public.prayer_wall_reactions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 3) RPCs consumed by frontend
CREATE OR REPLACE FUNCTION public.add_prayer_voice(p_issue_id uuid, p_session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  INSERT INTO public.global_prayer_voices (issue_id, session_id)
  VALUES (p_issue_id, p_session_id)
  ON CONFLICT (issue_id, session_id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count > 0 THEN
    UPDATE public.global_prayer_board
    SET voices = voices + 1,
        voices_today = voices_today + 1
    WHERE id = p_issue_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_prayer_reaction(p_prayer_id uuid, p_reaction_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_reaction_type = 'pray' THEN
    UPDATE public.prayer_wall SET reactions_pray = reactions_pray + 1 WHERE id = p_prayer_id;
  ELSIF p_reaction_type = 'heart' THEN
    UPDATE public.prayer_wall SET reactions_heart = reactions_heart + 1 WHERE id = p_prayer_id;
  ELSIF p_reaction_type = 'leaf' THEN
    UPDATE public.prayer_wall SET reactions_leaf = reactions_leaf + 1 WHERE id = p_prayer_id;
  ELSIF p_reaction_type = 'candle' THEN
    UPDATE public.prayer_wall SET reactions_candle = reactions_candle + 1 WHERE id = p_prayer_id;
  END IF;
END;
$$;

-- Keep get_session_votes in a known-good shape for clients.
CREATE OR REPLACE FUNCTION public.get_session_votes(p_session_id text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT issue_id FROM public.global_prayer_voices WHERE session_id = p_session_id;
$$;
