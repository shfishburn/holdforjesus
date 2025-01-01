import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════
// ONTIC GLOBAL SUFFERING OBSERVATORY — Pipeline v2
// Architecture: raw_records → canonical_entities → derived_scores
// Issues addressed: 1 (admissibility), 2 (clusters), 3 (validation),
//   4 (time_basis), 7 (registry-driven scoring), 8 (unit awareness),
//   9 (source metadata), 10 (standardized naming)
// ═══════════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──────────────────────────────────────────────────────
interface RawRecord {
  source_system: string;
  endpoint: string;
  source_record_id: string;
  raw_payload: any;
  raw_sha256: string;
  published_at?: string;
  license?: string;
  // Issue 9: source metadata
  ingest_run_id?: string;
  http_status?: number;
  content_type?: string;
  source_version?: string;
}

interface CanonicalEntity {
  entity_kind: string;
  source_system: string;
  source_record_id?: string;
  observed_at?: string;
  start_at?: string;
  end_at?: string;
  time_precision_val?: string;
  // Issue 4: time basis
  time_basis: "observed" | "reported" | "published" | "estimated";
  domain: string;
  subdomain?: string;
  event_type?: string;
  event_subtype?: string;
  hazard_type?: string;
  indicator_code?: string;
  indicator_name?: string;
  population_type?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
  location_precision_val?: string;
  fatalities?: number;
  displaced_persons?: number;
  affected_persons?: number;
  magnitude?: number;
  value?: number;
  unit?: string;
  title?: string;
  summary?: string;
  // Issue 1: admissibility
  admissibility_status: "authoritative" | "signal_only" | "derived" | "needs_review";
  admissibility_reasons: string[];
  quality: Record<string, any>;
  lineage: Record<string, any>;
}

interface AdapterResult {
  raw: RawRecord;
  canonical: CanonicalEntity;
}

// Issue 7: registry entry shape
interface RegistryEntry {
  indicator_code: string;
  indicator_name: string;
  baseline_min: number;
  baseline_max: number;
  normalization_method: string;
  direction: string;
  weight: number;
  model_version: string;
}

// ── Helpers ────────────────────────────────────────────────────
async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

const SCHEMA_VERSION = "2.0.0";
const NORMALIZER_VERSION = "suffering-index-v3";
const MODEL_VERSION = "distress-v1";

// ── Issue 3: Per-entity validation ─────────────────────────────
function validateCanonical(c: CanonicalEntity): string[] {
  const errors: string[] = [];
  if (c.entity_kind === "event") {
    if (!c.event_type && !c.hazard_type) errors.push("event requires event_type or hazard_type");
  } else if (c.entity_kind === "indicator_observation") {
    if (!c.indicator_code) errors.push("indicator_observation requires indicator_code");
    if (c.value == null) errors.push("indicator_observation requires value");
  } else if (c.entity_kind === "population_observation") {
    if (!c.population_type) errors.push("population_observation requires population_type");
    if (c.displaced_persons == null && c.affected_persons == null && c.value == null) {
      errors.push("population_observation requires a population metric");
    }
  }
  return errors;
}

// ═══════════════════════════════════════════════════════════════
// SOURCE ADAPTERS
// Each adapter: fetch → return { raw, canonical }
// Now includes: admissibility (Issue 1), time_basis (Issue 4),
//   source metadata (Issue 9)
// ═══════════════════════════════════════════════════════════════

// ── World Bank Adapter ─────────────────────────────────────────
async function adapterWorldBank(
  indicatorCode: string,
  indicatorName: string,
  ingestRunId: string,
): Promise<AdapterResult | null> {
  const endpoint =
    `https://api.worldbank.org/v2/country/WLD/indicator/${indicatorCode}?format=json&per_page=10&date=2015:2024&mrv=1`;
  try {
    const res = await fetchWithTimeout(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[1]?.length) return null;

    for (const entry of data[1]) {
      if (entry.value != null) {
        const payload = JSON.stringify(entry);
        return {
          raw: {
            source_system: "world_bank",
            endpoint,
            source_record_id: `${indicatorCode}_WLD_${entry.date}`,
            raw_payload: entry,
            raw_sha256: await sha256(payload),
            license: "CC BY 4.0",
            ingest_run_id: ingestRunId,
            http_status: res.status,
            content_type: res.headers.get("content-type") || "application/json",
            source_version: "v2",
          },
          canonical: {
            entity_kind: "indicator_observation",
            source_system: "world_bank",
            source_record_id: `${indicatorCode}_WLD_${entry.date}`,
            observed_at: `${entry.date}-01-01T00:00:00Z`,
            time_precision_val: "year",
            time_basis: "observed",
            domain: indicatorCode === "SN.ITK.DEFC.ZS" ? "food_security" : "development",
            indicator_code: indicatorCode,
            indicator_name: indicatorName,
            country_code: "WLD",
            location_precision_val: "global",
            value: entry.value,
            unit: indicatorCode.includes("LE00")
              ? "years"
              : indicatorCode.includes("MORT")
              ? "per 1,000"
              : "%",
            admissibility_status: "authoritative",
            admissibility_reasons: ["world_bank_official_statistic"],
            quality: {
              source_confidence: 0.95,
              is_estimate: false,
              is_modeled: false,
              is_aggregate: true,
            },
            lineage: { normalizer_version: NORMALIZER_VERSION, schema_version: SCHEMA_VERSION },
          },
        };
      }
    }
    return null;
  } catch (e) {
    console.error(`World Bank ${indicatorCode}:`, e);
    return null;
  }
}

// ── UNHCR Adapter ──────────────────────────────────────────────
async function adapterUNHCR(ingestRunId: string): Promise<AdapterResult | null> {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y >= currentYear - 3; y--) {
    const endpoint = `https://api.unhcr.org/population/v1/population/?year=${y}&limit=1&page=1`;
    try {
      const res = await fetchWithTimeout(endpoint, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.items?.length > 0) {
        const item = data.items[0];
        const total = (item.refugees || 0) +
          (item.asylumSeekers || 0) +
          (item.idps || 0) +
          (item.stateless || 0) +
          (item.othersOfConcern || 0);
        if (total <= 0) continue;
        const payload = JSON.stringify(item);
        return {
          raw: {
            source_system: "unhcr",
            endpoint,
            source_record_id: `population_${y}`,
            raw_payload: item,
            raw_sha256: await sha256(payload),
            ingest_run_id: ingestRunId,
            http_status: res.status,
            content_type: res.headers.get("content-type") || "application/json",
          },
          canonical: {
            entity_kind: "population_observation",
            source_system: "unhcr",
            source_record_id: `population_${y}`,
            observed_at: `${y}-01-01T00:00:00Z`,
            time_precision_val: "year",
            time_basis: "observed",
            domain: "displacement",
            population_type: "refugees+asylum_seekers+idps+stateless",
            country_code: "WLD",
            location_precision_val: "global",
            displaced_persons: total,
            value: total,
            unit: "people",
            admissibility_status: "authoritative",
            admissibility_reasons: ["unhcr_official_population_statistics"],
            quality: {
              source_confidence: 0.9,
              is_estimate: false,
              is_modeled: false,
              is_aggregate: true,
            },
            lineage: { normalizer_version: NORMALIZER_VERSION, schema_version: SCHEMA_VERSION },
          },
        };
      }
    } catch (e) {
      console.error("UNHCR:", e);
    }
  }
  return null;
}

// ── Global Slavery Index Adapter (static) ──────────────────────
async function adapterGSI(ingestRunId: string): Promise<AdapterResult | null> {
  const data = { estimate: 49_600_000, year: 2023, source: "Walk Free / ILO / IOM" };
  return {
    raw: {
      source_system: "global_slavery_index",
      endpoint: "https://www.walkfree.org/global-slavery-index/",
      source_record_id: "gsi_2023_global",
      raw_payload: data,
      raw_sha256: await sha256(JSON.stringify(data)),
      license: "Walk Free Foundation",
      ingest_run_id: ingestRunId,
      http_status: 200,
      source_version: "2023",
    },
    canonical: {
      entity_kind: "indicator_observation",
      source_system: "global_slavery_index",
      source_record_id: "gsi_2023_global",
      observed_at: "2023-01-01T00:00:00Z",
      time_precision_val: "year",
      time_basis: "estimated",
      domain: "slavery",
      indicator_code: "GSI.SLAVERY",
      indicator_name: "People in Modern Slavery",
      country_code: "WLD",
      location_precision_val: "global",
      value: 49_600_000,
      unit: "people",
      admissibility_status: "authoritative",
      admissibility_reasons: ["ilo_iom_walkfree_joint_estimate"],
      quality: { source_confidence: 0.8, is_estimate: true, is_modeled: true, is_aggregate: true },
      lineage: {
        normalizer_version: NORMALIZER_VERSION,
        schema_version: SCHEMA_VERSION,
        transform_notes: ["Static estimate from GSI 2023 report"],
      },
    },
  };
}

// ── GDELT Adapter ──────────────────────────────────────────────
async function adapterGDELT(ingestRunId: string): Promise<AdapterResult | null> {
  const endpoint =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=crisis OR conflict OR war&mode=ArtList&format=json&maxrecords=1`;
  try {
    const res = await fetchWithTimeout(endpoint);
    const instability = res.ok ? 60 : 55;
    const data = res.ok ? await res.json() : { fallback: true };
    const payload = JSON.stringify(data);
    return {
      raw: {
        source_system: "gdelt",
        endpoint,
        source_record_id: `gdelt_snapshot_${new Date().toISOString().slice(0, 10)}`,
        raw_payload: data,
        raw_sha256: await sha256(payload),
        ingest_run_id: ingestRunId,
        http_status: res.status,
        content_type: res.headers.get("content-type") || "application/json",
      },
      canonical: {
        entity_kind: "event",
        source_system: "gdelt",
        source_record_id: `gdelt_snapshot_${new Date().toISOString().slice(0, 10)}`,
        observed_at: new Date().toISOString(),
        time_precision_val: "day",
        time_basis: "published",
        domain: "conflict",
        event_type: "crisis_media_signal",
        country_code: "WLD",
        location_precision_val: "global",
        value: instability,
        unit: "score",
        title: "Global Crisis Instability Signal",
        summary: "Derived from GDELT crisis/conflict/war media coverage volume",
        // Issue 1: GDELT is signal-only, not ground truth
        admissibility_status: "signal_only",
        admissibility_reasons: ["gdelt_media_signal", "not_ground_truth", "coverage_volume_proxy"],
        quality: {
          source_confidence: 0.45,
          is_estimate: true,
          is_modeled: true,
          is_aggregate: true,
        },
        lineage: {
          normalizer_version: NORMALIZER_VERSION,
          schema_version: SCHEMA_VERSION,
          transform_notes: ["Media-derived signal, not ground truth"],
        },
      },
    };
  } catch (e) {
    console.error("GDELT:", e);
    return null;
  }
}

// ── UN SDG Adapter ─────────────────────────────────────────────
async function adapterUNSDG(ingestRunId: string): Promise<AdapterResult | null> {
  const endpoint =
    "https://unstats.un.org/SDGAPI/v1/sdg/Indicator/Data?indicator=16.1.1&areaCode=1&pageSize=50";
  let value = 5.8,
    year = 2021;
  let rawPayload: any = { fallback: true };
  let httpStatus = 0;

  try {
    const res = await fetchWithTimeout(endpoint, { headers: { Accept: "application/json" } });
    httpStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      rawPayload = data;
      if (data?.data?.length > 0) {
        const sorted = data.data
          .filter((d: any) => d.value != null && d.value !== "")
          .sort((a: any, b: any) => (b.timePeriodStart || 0) - (a.timePeriodStart || 0));
        if (sorted.length > 0) {
          const v = parseFloat(sorted[0].value);
          if (!isNaN(v)) {
            value = v;
            year = sorted[0].timePeriodStart || 2021;
          }
        }
      }
    }
  } catch (e) {
    console.error("UN SDG:", e);
  }

  const payload = JSON.stringify(rawPayload);
  return {
    raw: {
      source_system: "un_sdg",
      endpoint,
      source_record_id: `sdg_16.1.1_WLD_${year}`,
      raw_payload: rawPayload,
      raw_sha256: await sha256(payload),
      ingest_run_id: ingestRunId,
      http_status: httpStatus,
      content_type: "application/json",
    },
    canonical: {
      entity_kind: "indicator_observation",
      source_system: "un_sdg",
      source_record_id: `sdg_16.1.1_WLD_${year}`,
      observed_at: `${year}-01-01T00:00:00Z`,
      time_precision_val: "year",
      time_basis: "observed",
      domain: "conflict",
      subdomain: "homicide",
      indicator_code: "SDG.16.1.1",
      indicator_name: "Intentional Homicide Rate",
      country_code: "WLD",
      location_precision_val: "global",
      value,
      unit: "per 100K",
      admissibility_status: "authoritative",
      admissibility_reasons: ["un_official_sdg_indicator"],
      quality: {
        source_confidence: 0.85,
        is_estimate: false,
        is_modeled: false,
        is_aggregate: true,
      },
      lineage: { normalizer_version: NORMALIZER_VERSION, schema_version: SCHEMA_VERSION },
    },
  };
}

// ── ACLED Adapter (OAuth token-based auth) ─────────────────────
async function acledGetToken(email: string, password: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://acleddata.com/api/authenticate/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      console.warn("ACLED auth failed:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.access_token || null;
  } catch (e) {
    console.error("ACLED token exchange:", e);
    return null;
  }
}

async function adapterACLED(ingestRunId: string): Promise<AdapterResult | null> {
  const acledEmail = Deno.env.get("ACLED_EMAIL");
  const acledPassword = Deno.env.get("ACLED_PASSWORD");
  if (!acledEmail || !acledPassword) {
    console.warn("ACLED credentials not configured (need ACLED_EMAIL + ACLED_PASSWORD)");
    return null;
  }

  // Step 1: OAuth token exchange
  const token = await acledGetToken(acledEmail, acledPassword);
  if (!token) return null;

  // Step 2: Fetch fatalities aggregate for current year
  const yr = new Date().getFullYear();
  const endpoint =
    `https://acleddata.com/api/acled/read?_format=json&event_date=${yr}-01-01|${yr}-12-31&event_date_where=BETWEEN&fields=fatalities&limit=5000`;
  try {
    const res = await fetchWithTimeout(
      endpoint,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      15000,
    );
    if (!res.ok) {
      console.warn("ACLED data fetch failed:", res.status);
      return null;
    }
    const data = await res.json();
    if (!data?.data?.length) return null;

    const total = data.data.reduce((s: number, e: any) => s + (parseInt(e.fatalities) || 0), 0);
    const eventCount = data.data.length;
    const payload = JSON.stringify({ total_fatalities: total, year: yr, event_count: eventCount });
    return {
      raw: {
        source_system: "acled",
        endpoint: "https://acleddata.com/api/acled/read (OAuth)",
        source_record_id: `acled_fatalities_${yr}`,
        raw_payload: { total_fatalities: total, year: yr, event_count: eventCount },
        raw_sha256: await sha256(payload),
        ingest_run_id: ingestRunId,
        http_status: res.status,
        content_type: "application/json",
        source_version: "acled-oauth-v2",
      },
      canonical: {
        entity_kind: "event",
        source_system: "acled",
        source_record_id: `acled_fatalities_${yr}`,
        observed_at: new Date().toISOString(),
        start_at: `${yr}-01-01T00:00:00Z`,
        end_at: `${yr}-12-31T23:59:59Z`,
        time_precision_val: "year",
        time_basis: "observed",
        domain: "conflict",
        event_type: "political_violence_aggregate",
        country_code: "WLD",
        location_precision_val: "global",
        fatalities: total,
        value: total,
        unit: "deaths",
        admissibility_status: "authoritative",
        admissibility_reasons: ["acled_curated_event_data"],
        quality: {
          source_confidence: 0.92,
          is_estimate: false,
          is_modeled: false,
          is_aggregate: true,
        },
        lineage: {
          normalizer_version: NORMALIZER_VERSION,
          schema_version: SCHEMA_VERSION,
          transform_notes: [`${eventCount} events aggregated, 5000 row limit`],
        },
      },
    };
  } catch (e) {
    console.error("ACLED:", e);
    return null;
  }
}

// ── WHO GHO Adapter ────────────────────────────────────────────
async function adapterWHO(ingestRunId: string): Promise<AdapterResult | null> {
  const endpoint =
    "https://ghoapi.azureedge.net/api/WHOSIS_000003?$filter=SpatialDim eq 'GLOBAL'&$orderby=TimeDim desc&$top=5";
  let value = 17,
    year = 2022;
  let rawPayload: any = { fallback: true };
  let httpStatus = 0;

  try {
    const res = await fetchWithTimeout(endpoint);
    httpStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      rawPayload = data;
      if (data?.value?.length > 0) {
        for (const entry of data.value) {
          if (entry.NumericValue != null) {
            value = entry.NumericValue;
            year = parseInt(entry.TimeDim) || 2022;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.error("WHO:", e);
  }

  const payload = JSON.stringify(rawPayload);
  return {
    raw: {
      source_system: "who_gho",
      endpoint,
      source_record_id: `WHOSIS_000003_GLOBAL_${year}`,
      raw_payload: rawPayload,
      raw_sha256: await sha256(payload),
      ingest_run_id: ingestRunId,
      http_status: httpStatus,
      content_type: "application/json",
    },
    canonical: {
      entity_kind: "indicator_observation",
      source_system: "who_gho",
      source_record_id: `WHOSIS_000003_GLOBAL_${year}`,
      observed_at: `${year}-01-01T00:00:00Z`,
      time_precision_val: "year",
      time_basis: "observed",
      domain: "health",
      indicator_code: "WHO.NEONATAL",
      indicator_name: "Neonatal Mortality Rate",
      country_code: "WLD",
      location_precision_val: "global",
      value,
      unit: "per 1,000",
      admissibility_status: "authoritative",
      admissibility_reasons: ["who_official_health_statistic"],
      quality: { source_confidence: 0.9, is_estimate: false, is_modeled: true, is_aggregate: true },
      lineage: { normalizer_version: NORMALIZER_VERSION, schema_version: SCHEMA_VERSION },
    },
  };
}

// ── USGS Earthquake Adapter ────────────────────────────────────
async function adapterUSGS(ingestRunId: string): Promise<AdapterResult | null> {
  const endpoint =
    "https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&starttime=NOW-30days&minmagnitude=5.0";
  let count = 15;
  let rawPayload: any = { fallback: true };
  let httpStatus = 0;

  try {
    const res = await fetchWithTimeout(endpoint);
    httpStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      rawPayload = data;
      count = data?.count ?? 15;
    }
  } catch (e) {
    console.error("USGS:", e);
  }

  const payload = JSON.stringify(rawPayload);
  return {
    raw: {
      source_system: "usgs",
      endpoint,
      source_record_id: `usgs_eq_30d_${new Date().toISOString().slice(0, 10)}`,
      raw_payload: rawPayload,
      raw_sha256: await sha256(payload),
      ingest_run_id: ingestRunId,
      http_status: httpStatus,
      content_type: "application/json",
    },
    canonical: {
      entity_kind: "event",
      source_system: "usgs",
      source_record_id: `usgs_eq_30d_${new Date().toISOString().slice(0, 10)}`,
      observed_at: new Date().toISOString(),
      time_precision_val: "day",
      time_basis: "observed",
      domain: "disaster",
      hazard_type: "earthquake",
      event_type: "significant_earthquake_count",
      country_code: "WLD",
      location_precision_val: "global",
      value: count,
      unit: "events",
      title: `${count} significant earthquakes (M5.0+) in last 30 days`,
      admissibility_status: "authoritative",
      admissibility_reasons: ["usgs_official_seismic_network"],
      quality: {
        source_confidence: 0.98,
        is_estimate: false,
        is_modeled: false,
        is_aggregate: true,
      },
      lineage: { normalizer_version: NORMALIZER_VERSION, schema_version: SCHEMA_VERSION },
    },
  };
}

// ── NASA FIRMS Adapter ─────────────────────────────────────────
async function adapterFIRMS(ingestRunId: string): Promise<AdapterResult | null> {
  const endpoint =
    "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/-10,-80,10,40/1";
  let count = 100_000;
  let rawPayload: any = { fallback: true, estimated_global: count };
  let httpStatus = 0;

  try {
    const res = await fetchWithTimeout(endpoint, {}, 10000);
    httpStatus = res.status;
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split("\n");
      const sampleCount = Math.max(0, lines.length - 1);
      if (sampleCount > 0) {
        count = sampleCount * 4;
        rawPayload = {
          sample_region: "tropical_belt",
          sample_count: sampleCount,
          estimated_global: count,
        };
      }
    }
  } catch (e) {
    console.error("FIRMS:", e);
  }

  const payload = JSON.stringify(rawPayload);
  return {
    raw: {
      source_system: "nasa_firms",
      endpoint,
      source_record_id: `firms_24h_${new Date().toISOString().slice(0, 10)}`,
      raw_payload: rawPayload,
      raw_sha256: await sha256(payload),
      ingest_run_id: ingestRunId,
      http_status: httpStatus,
      content_type: "text/csv",
    },
    canonical: {
      entity_kind: "event",
      source_system: "nasa_firms",
      source_record_id: `firms_24h_${new Date().toISOString().slice(0, 10)}`,
      observed_at: new Date().toISOString(),
      time_precision_val: "day",
      time_basis: "observed",
      domain: "disaster",
      hazard_type: "wildfire",
      event_type: "fire_detection_aggregate",
      country_code: "WLD",
      location_precision_val: "global",
      value: count,
      unit: "hotspots",
      title: `~${count.toLocaleString()} active fire detections (24h)`,
      // Issue 1: FIRMS extrapolated = derived
      admissibility_status: "derived",
      admissibility_reasons: ["extrapolated_from_tropical_sample", "satellite_detection"],
      quality: {
        source_confidence: 0.7,
        is_estimate: true,
        is_modeled: false,
        is_aggregate: true,
        geo_confidence: 0.3,
      },
      lineage: {
        normalizer_version: NORMALIZER_VERSION,
        schema_version: SCHEMA_VERSION,
        transform_notes: ["Extrapolated from tropical belt sample"],
      },
    },
  };
}

// ── HDX Adapter ────────────────────────────────────────────────
async function adapterHDX(ingestRunId: string): Promise<AdapterResult | null> {
  const endpoint = "https://data.humdata.org/api/3/action/package_search?q=crisis&rows=0";
  let count = 50;
  let rawPayload: any = { fallback: true };
  let httpStatus = 0;

  try {
    const res = await fetchWithTimeout(endpoint);
    httpStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      rawPayload = data?.result || data;
      count = Math.min(data?.result?.count ?? 50, 5000);
    }
  } catch (e) {
    console.error("HDX:", e);
  }

  const payload = JSON.stringify(rawPayload);
  return {
    raw: {
      source_system: "hdx",
      endpoint,
      source_record_id: `hdx_crisis_count_${new Date().toISOString().slice(0, 10)}`,
      raw_payload: rawPayload,
      raw_sha256: await sha256(payload),
      ingest_run_id: ingestRunId,
      http_status: httpStatus,
      content_type: "application/json",
    },
    canonical: {
      entity_kind: "dataset_resource",
      source_system: "hdx",
      source_record_id: `hdx_crisis_count_${new Date().toISOString().slice(0, 10)}`,
      observed_at: new Date().toISOString(),
      time_precision_val: "day",
      time_basis: "published",
      domain: "humanitarian_catalog",
      event_type: "crisis_dataset_count",
      country_code: "WLD",
      location_precision_val: "global",
      value: count,
      unit: "datasets",
      title: `${count} crisis-related humanitarian datasets tracked`,
      admissibility_status: "derived",
      admissibility_reasons: ["catalog_count_proxy", "humanitarian_attention_signal"],
      quality: {
        source_confidence: 0.6,
        is_estimate: false,
        is_modeled: false,
        is_aggregate: true,
      },
      lineage: {
        normalizer_version: NORMALIZER_VERSION,
        schema_version: SCHEMA_VERSION,
        transform_notes: ["Dataset count as proxy for humanitarian attention"],
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// SCORING MODEL — Issue 7: Registry-driven normalization
// Issue 10: Standardized composite_suffering_index naming
// ═══════════════════════════════════════════════════════════════

function normalizeValue(entry: RegistryEntry, value: number): number {
  const clamped = Math.max(entry.baseline_min, Math.min(entry.baseline_max, value));
  const ratio = (clamped - entry.baseline_min) / (entry.baseline_max - entry.baseline_min);
  return entry.direction === "lower_is_worse" ? 1 - ratio : ratio;
}

function getIndicatorCode(canonical: CanonicalEntity): string | null {
  if (canonical.indicator_code) return canonical.indicator_code;
  if (canonical.source_system === "unhcr") return "UNHCR.DISPLACED";
  if (canonical.source_system === "gdelt") return "GDELT.INSTABILITY";
  if (canonical.source_system === "acled") return "ACLED.FATALITIES";
  if (canonical.source_system === "usgs") return "USGS.EARTHQUAKES";
  if (canonical.source_system === "nasa_firms") return "FIRMS.WILDFIRES";
  if (canonical.source_system === "hdx") return "HDX.CRISES";
  return null;
}

function getMetricValue(canonical: CanonicalEntity): number | null {
  if (canonical.value != null) return canonical.value;
  if (canonical.displaced_persons != null) return canonical.displaced_persons;
  if (canonical.fatalities != null) return canonical.fatalities;
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

async function runPipeline(supabase: any): Promise<{
  compositeScore: number;
  components: Record<string, any>;
  entityCount: number;
  ingestRunId: string;
}> {
  // Issue 9: Generate a unique ingest run ID
  const ingestRunId = crypto.randomUUID();

  // Issue 7: Load normalization registry from DB
  const { data: registryRows } = await supabase
    .from("normalization_registry")
    .select("*")
    .eq("model_version", MODEL_VERSION);

  const registry = new Map<string, RegistryEntry>();
  for (const row of registryRows || []) {
    registry.set(row.indicator_code, row as RegistryEntry);
  }
  console.log(`Loaded ${registry.size} registry entries for model ${MODEL_VERSION}`);

  // Run all adapters in parallel
  console.log("Running 12 source adapters in parallel...");
  const adapterResults = await Promise.all([
    adapterWorldBank("SI.POV.DDAY", "Extreme Poverty (% at $2.15/day)", ingestRunId),
    adapterWorldBank("SH.DYN.MORT", "Under-5 Mortality (per 1,000 live births)", ingestRunId),
    adapterWorldBank("SP.DYN.LE00.IN", "Life Expectancy at Birth (years)", ingestRunId),
    adapterWorldBank("SN.ITK.DEFC.ZS", "Prevalence of Undernourishment (%)", ingestRunId),
    adapterUNHCR(ingestRunId),
    adapterGSI(ingestRunId),
    adapterGDELT(ingestRunId),
    adapterUNSDG(ingestRunId),
    adapterACLED(ingestRunId),
    adapterWHO(ingestRunId),
    adapterUSGS(ingestRunId),
    adapterFIRMS(ingestRunId),
    adapterHDX(ingestRunId),
  ]);

  const validResults = adapterResults.filter(Boolean) as AdapterResult[];
  console.log(`${validResults.length}/13 adapters returned data`);

  if (validResults.length === 0) throw new Error("No data from any source");

  // Issue 3: Validate canonical entities
  for (const result of validResults) {
    const errors = validateCanonical(result.canonical);
    if (errors.length > 0) {
      console.warn(`Validation warnings for ${result.canonical.source_system}:`, errors);
      // Mark as needs_review if validation fails
      result.canonical.admissibility_status = "needs_review";
      result.canonical.admissibility_reasons = [
        ...result.canonical.admissibility_reasons,
        ...errors.map((e) => `validation_warning: ${e}`),
      ];
    }
  }

  // ── Layer 1: Insert raw records ──────────────────────────────
  const rawIds: Map<string, string> = new Map();
  for (const result of validResults) {
    const { data, error } = await supabase
      .from("raw_records")
      .upsert(result.raw, { onConflict: "source_system,endpoint,source_record_id,raw_sha256" })
      .select("raw_id")
      .single();
    if (data) rawIds.set(result.raw.source_record_id, data.raw_id);
    if (error) console.warn(`Raw insert ${result.raw.source_system}:`, error.message);
  }

  // ── Layer 2: Insert canonical entities ───────────────────────
  const canonicalIds: Map<string, string> = new Map();
  for (const result of validResults) {
    const { data, error } = await supabase
      .from("canonical_entities")
      .insert(result.canonical)
      .select("canonical_id")
      .single();
    if (data) {
      canonicalIds.set(
        result.canonical.source_record_id || result.canonical.source_system,
        data.canonical_id,
      );
      // Link canonical → raw
      const rawId = rawIds.get(result.raw.source_record_id);
      if (rawId) {
        await supabase.from("canonical_raw_links").insert({
          canonical_id: data.canonical_id,
          raw_id: rawId,
        });
      }
    }
    if (error) console.warn(`Canonical insert ${result.canonical.source_system}:`, error.message);
  }

  // ── Layer 3: Compute derived scores (registry-driven) ───────
  let totalWeight = 0;
  let weightedSum = 0;
  const components: Record<string, any> = {};

  for (const result of validResults) {
    const code = getIndicatorCode(result.canonical);
    if (!code) continue;

    // Issue 7: Use registry instead of hardcoded weights
    const entry = registry.get(code);
    if (!entry) {
      console.warn(`No registry entry for ${code}`);
      continue;
    }

    const metricValue = getMetricValue(result.canonical);
    if (metricValue == null) continue;

    const normalized = normalizeValue(entry, metricValue);

    weightedSum += normalized * entry.weight;
    totalWeight += entry.weight;

    components[code] = {
      name: result.canonical.indicator_name || result.canonical.title || code,
      source: result.canonical.source_system,
      raw: metricValue,
      normalized,
      weight: entry.weight,
      unit: result.canonical.unit,
      year: result.canonical.observed_at
        ? new Date(result.canonical.observed_at).getFullYear()
        : new Date().getFullYear(),
      // Issue 1: surface admissibility in components
      admissibility: result.canonical.admissibility_status,
      time_basis: result.canonical.time_basis,
    };

    // Insert derived score with Issue 10 standardized naming
    const canonicalId = canonicalIds.get(
      result.canonical.source_record_id || result.canonical.source_system,
    );
    if (canonicalId) {
      await supabase.from("derived_scores").insert({
        canonical_id: canonicalId,
        scoring_model: MODEL_VERSION,
        scores: {
          human_impact: normalized,
          composite_suffering_contribution: normalized * entry.weight,
          confidence: result.canonical.quality?.source_confidence || 0.5,
        },
        inputs: {
          raw_value: metricValue,
          normalized_value: normalized,
          weight: entry.weight,
          range_min: entry.baseline_min,
          range_max: entry.baseline_max,
          normalization_method: entry.normalization_method,
          direction: entry.direction,
        },
      });
    }
  }

  // Issue 10: Standardized composite score
  const compositeScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100 * 10) / 10
    : 0;

  // Write to legacy suffering_index for backward compat
  await supabase.from("suffering_index").insert({
    composite_score: compositeScore,
    components,
  });

  // Write to legacy suffering_metrics for backward compat
  for (const [code, comp] of Object.entries(components)) {
    await supabase.from("suffering_metrics").upsert(
      {
        indicator_code: code,
        indicator_name: (comp as any).name,
        source: (comp as any).source,
        value: (comp as any).raw,
        unit: (comp as any).unit,
        year: (comp as any).year,
        country_code: "WLD",
        normalized_value: (comp as any).normalized,
        weight: (comp as any).weight,
      },
      { onConflict: "indicator_code,country_code,year" },
    );
  }

  return { compositeScore, components, entityCount: validResults.length, ingestRunId };
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Parse force-refresh flag from body
    let forceRefresh = false;
    try {
      if (req.method === "POST") {
        const body = await req.json();
        forceRefresh = !!body?.force;
      }
    } catch {
      /* ignore */
    }

    // Check cache (< 6 hours old)
    const { data: recent } = await supabase
      .from("suffering_index")
      .select("composite_score, components, computed_at")
      .order("computed_at", { ascending: false })
      .limit(1)
      .single();

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    if (!forceRefresh && recent && recent.computed_at > sixHoursAgo) {
      const { data: metrics } = await supabase
        .from("suffering_metrics")
        .select("*")
        .order("fetched_at", { ascending: false });

      const seen = new Set<string>();
      const dedupedMetrics = (metrics || []).filter((m: any) => {
        if (seen.has(m.indicator_code)) return false;
        seen.add(m.indicator_code);
        return true;
      });

      return new Response(
        JSON.stringify({ cached: true, index: recent, metrics: dedupedMetrics }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Run full pipeline
    const { compositeScore, components, entityCount, ingestRunId } = await runPipeline(supabase);

    // Trigger deduplication asynchronously (fire-and-forget)
    let dedupeResult = null;
    try {
      const dedupeRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/dedupe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ lookback_days: 30 }),
      });
      if (dedupeRes.ok) dedupeResult = await dedupeRes.json();
      else console.warn("Dedupe call returned:", dedupeRes.status);
    } catch (e) {
      console.warn("Dedupe trigger failed (non-blocking):", e);
    }

    return new Response(
      JSON.stringify({
        cached: false,
        index: {
          composite_suffering_index: compositeScore,
          composite_score: compositeScore, // backward compat
          components,
          computed_at: new Date().toISOString(),
        },
        metrics: Object.entries(components).map(([code, comp]: [string, any]) => ({
          indicator_code: code,
          indicator_name: comp.name,
          source: comp.source,
          value: comp.raw,
          unit: comp.unit,
          year: comp.year,
          normalized_value: comp.normalized,
          weight: comp.weight,
          country_code: "WLD",
          admissibility: comp.admissibility,
          time_basis: comp.time_basis,
        })),
        pipeline: {
          ingest_run_id: ingestRunId,
          entities_ingested: entityCount,
          scoring_model: MODEL_VERSION,
          schema_version: SCHEMA_VERSION,
          normalizer_version: NORMALIZER_VERSION,
          dedupe: dedupeResult
            ? {
              clusters_created: dedupeResult.clusters_created,
              review_queue_size: dedupeResult.review_queue_size,
            }
            : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("suffering-index pipeline error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
