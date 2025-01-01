
DO $do$
BEGIN
  IF to_regclass('public.global_prayer_voices') IS NOT NULL THEN
    -- Only touch policy and table-backed function when the table already exists.
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read voices" ON public.global_prayer_voices';

    CREATE OR REPLACE FUNCTION public.get_session_votes(p_session_id text)
    RETURNS SETOF uuid
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT issue_id FROM public.global_prayer_voices WHERE session_id = p_session_id;
    $fn$;
  ELSE
    -- Keep migration chain bootable; later migrations replace this with table-backed logic.
    CREATE OR REPLACE FUNCTION public.get_session_votes(p_session_id text)
    RETURNS SETOF uuid
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT NULL::uuid WHERE false;
    $fn$;
  END IF;
END;
$do$;
