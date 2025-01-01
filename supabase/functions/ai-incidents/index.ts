import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════
// AIID ADAPTER v2 — AI Incident Database → canonical pipeline
// Source: https://incidentdatabase.ai/api/graphql
// Pattern: fetch → raw_records → canonical_entities → summary
//
// Review improvements (v2):
//   1. time_basis: 'reported' (explicit)
//   2. Preserve raw AIID taxonomy in lineage
//   3. classification_reason field
//   4. Max 3 vulnerability categories per incident
//   5. harm_domain secondary classification
//   6. incident_severity_signal
//   + Idempotency via raw_sha256 check
//   + Retry with exponential backoff
//   + Max fetch guard (5000)
//   + Trend calculation
// ═══════════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCHEMA_VERSION = "2.0.0";
const NORMALIZER_VERSION = "aiid-adapter-v2";
const BATCH_SIZE = 200;
const BATCH_DELAY_MS = 250; // 250ms — safe for GraphQL
const MAX_FETCH = 5000; // Guard against runaway pagination
const MAX_CATEGORIES_PER_INCIDENT = 3;
const MAX_RETRIES = 3;

// ── Helpers ────────────────────────────────────────────────────
async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.ok || attempt === retries) return res;
      // Retry on 429 or 5xx
      if (res.status === 429 || res.status >= 500) {
        const backoff = 2 ** attempt * 500;
        console.warn(
          `AIID retry ${attempt + 1}/${retries} after ${res.status}, waiting ${backoff}ms`,
        );
        await sleep(backoff);
        continue;
      }
      return res; // 4xx (not 429) — don't retry
    } catch (e) {
      if (attempt === retries) throw e;
      const backoff = 2 ** attempt * 500;
      console.warn(`AIID fetch error, retry ${attempt + 1}/${retries}, waiting ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw new Error("Exhausted retries");
}

// ── Vulnerability Taxonomy ─────────────────────────────────────
const VULNERABILITY_TAXONOMY: Record<
  string,
  { keywords: RegExp[]; crisisCategory: string; weight: number }
> = {
  children: {
    keywords: [
      /\bchild(ren)?\b/i,
      /\bkid(s)?\b/i,
      /\bminor(s)?\b/i,
      /\byouth\b/i,
      /\bteen(ager)?\b/i,
      /\bstudent(s)?\b/i,
      /\binfant\b/i,
      /\bpediatric\b/i,
      /\bschool\b/i,
    ],
    crisisCategory: "Mental Health / LGBTQ+ Youth",
    weight: 10,
  },
  racial_ethnic_minorities: {
    keywords: [
      /\braci(al|sm|st)\b/i,
      /\bblack\b/i,
      /\bafrican.american\b/i,
      /\blatino\b/i,
      /\bhispanic\b/i,
      /\basian\b/i,
      /\bindigenous\b/i,
      /\bminority\b/i,
      /\bethnic\b/i,
      /\bpeople of color\b/i,
      /\bdark.skin\b/i,
      /\bskin.tone\b/i,
    ],
    crisisCategory: "Human Rights",
    weight: 9,
  },
  women_gender: {
    keywords: [
      /\bwomen\b/i,
      /\bwoman\b/i,
      /\bfemale\b/i,
      /\bgender\s+bias\b/i,
      /\bsex(ism|ist)\b/i,
      /\bdomestic\s+violence\b/i,
      /\bmisogyn/i,
    ],
    crisisCategory: "Domestic Violence",
    weight: 8,
  },
  mental_health_substance: {
    keywords: [
      /\bmental\s+health\b/i,
      /\bsuicid/i,
      /\bself.harm\b/i,
      /\bdepression\b/i,
      /\bPTSD\b/i,
      /\btrauma\b/i,
      /\bsubstance\s+abuse\b/i,
      /\baddiction\b/i,
      /\bopioid\b/i,
    ],
    crisisCategory: "Mental Health / Substance Abuse",
    weight: 7,
  },
  poverty_homelessness: {
    keywords: [
      /\bpover(ty|tized)\b/i,
      /\bhomeless\b/i,
      /\blow.income\b/i,
      /\bwelfare\b/i,
      /\bfood\s+(insecurity|stamp)\b/i,
      /\bunhoused\b/i,
    ],
    crisisCategory: "Hunger / Homelessness",
    weight: 6,
  },
  disability: {
    keywords: [
      /\bdisab(led|ility)\b/i,
      /\bblind\b/i,
      /\bdeaf\b/i,
      /\bwheelchair\b/i,
      /\bautis(m|tic)\b/i,
      /\baccessib/i,
    ],
    crisisCategory: "Mental Health",
    weight: 5,
  },
  lgbtq: {
    keywords: [
      /\blgbt(q)?\b/i,
      /\btransgender\b/i,
      /\bqueer\b/i,
      /\bsexual orientation\b/i,
      /\bgender identity\b/i,
    ],
    crisisCategory: "LGBTQ+ Youth",
    weight: 5,
  },
  elderly: {
    keywords: [
      /\belderly\b/i,
      /\bolder adult\b/i,
      /\bsenior citizen\b/i,
      /\bdementia\b/i,
      /\balzheimer\b/i,
      /\bnursing home\b/i,
    ],
    crisisCategory: "Mental Health",
    weight: 4,
  },
  refugees_migrants: {
    keywords: [
      /\brefugee\b/i,
      /\basylum\b/i,
      /\bmigrant\b/i,
      /\bdeport/i,
      /\bstateless\b/i,
      /\btraffick/i,
    ],
    crisisCategory: "Human Rights",
    weight: 4,
  },
  veterans_military: {
    keywords: [
      /\bveteran\b/i,
      /\bmilitary\b/i,
      /\bsoldier\b/i,
      /\bVA\s+(hospital|system|benefits)\b/i,
    ],
    crisisCategory: "Veterans",
    weight: 3,
  },
  incarcerated: {
    keywords: [
      /\bprison\b/i,
      /\bincarcer/i,
      /\bdetain/i,
      /\bpredictive\s+policing\b/i,
      /\brecidiv/i,
      /\bsentenc/i,
    ],
    crisisCategory: "Human Rights",
    weight: 6,
  },
  patients_health: {
    keywords: [
      /\bpatient\b/i,
      /\bhealthcare\b/i,
      /\bmedical\b/i,
      /\bdiagnos/i,
      /\bhospital\b/i,
      /\binsurance\s+denial\b/i,
    ],
    crisisCategory: "Mental Health",
    weight: 7,
  },
};

// ── Improvement #5: Harm Domain Classifier ─────────────────────
type HarmDomain =
  | "algorithmic_bias"
  | "content_recommendation"
  | "decision_support"
  | "surveillance"
  | "automation_error"
  | "unknown";

const HARM_DOMAIN_PATTERNS: Array<{ domain: HarmDomain; keywords: RegExp[] }> = [
  {
    domain: "algorithmic_bias",
    keywords: [
      /\bbias(ed)?\b/i,
      /\bdiscriminat/i,
      /\bfairness\b/i,
      /\bdisproportionat/i,
      /\bequity\b/i,
      /\bprejudic/i,
    ],
  },
  {
    domain: "content_recommendation",
    keywords: [
      /\brecommend/i,
      /\bcontent\s+(moderat|filter)/i,
      /\balgorithm/i,
      /\bnews\s+feed\b/i,
      /\bsocial\s+media\b/i,
      /\bplatform\b/i,
      /\bmisinformation\b/i,
      /\bdeepfake\b/i,
    ],
  },
  {
    domain: "decision_support",
    keywords: [
      /\bdecision\b/i,
      /\bscoring\b/i,
      /\brisk\s+assess/i,
      /\bloan\b/i,
      /\bcredit\b/i,
      /\bhiring\b/i,
      /\brecruit/i,
      /\binsurance\b/i,
      /\bsentenc/i,
      /\bparole\b/i,
    ],
  },
  {
    domain: "surveillance",
    keywords: [
      /\bsurveill/i,
      /\bfacial\s+recogn/i,
      /\btracking\b/i,
      /\bprivacy\b/i,
      /\bmonitor/i,
      /\bbiometric\b/i,
    ],
  },
  {
    domain: "automation_error",
    keywords: [
      /\bmalfunction\b/i,
      /\bcrash(ed)?\b/i,
      /\bself.driving\b/i,
      /\bautonomous\b/i,
      /\baccident\b/i,
      /\brobot/i,
      /\bhallucin/i,
      /\berror\b/i,
    ],
  },
];

function classifyHarmDomain(text: string): HarmDomain {
  for (const { domain, keywords } of HARM_DOMAIN_PATTERNS) {
    if (keywords.some((re) => re.test(text))) return domain;
  }
  return "unknown";
}

// ── Improvement #6: Severity Signal ────────────────────────────
type SeveritySignal = "low" | "medium" | "high";

const HIGH_SEVERITY_PATTERNS = [
  /\bdeath(s)?\b/i,
  /\bkilled\b/i,
  /\bfatalit/i,
  /\bsuicid/i,
  /\bwidespread\b/i,
  /\bmillions?\b/i,
  /\bsystemic\b/i,
];
const MEDIUM_SEVERITY_PATTERNS = [
  /\bharm(ed|ful)?\b/i,
  /\binjur/i,
  /\bdamag/i,
  /\bviolat/i,
  /\bfraud\b/i,
  /\bwrongful/i,
  /\bfail(ed|ure)?\b/i,
];

function classifySeverity(text: string, harmedPartyCount: number): SeveritySignal {
  if (HIGH_SEVERITY_PATTERNS.some((re) => re.test(text))) return "high";
  if (harmedPartyCount >= 3) return "high";
  if (MEDIUM_SEVERITY_PATTERNS.some((re) => re.test(text))) return "medium";
  if (harmedPartyCount >= 1) return "medium";
  return "low";
}

// ── Improvement #4: Classifier with max categories ─────────────
interface ClassificationResult {
  categories: string[];
  crisisCategories: string[];
  isVulnerable: boolean;
  // Improvement #3: classification_reason
  classification_reason: "keyword_match" | "none";
  // Improvement #5
  harm_domain: HarmDomain;
  // Improvement #6
  severity_signal: SeveritySignal;
}

function classifyVulnerability(
  title: string,
  description: string,
  harmedParties: string[],
): ClassificationResult {
  const text = [title, description, ...harmedParties].join(" ");

  // Score all matching categories by weight for ranking
  const matches: Array<{ category: string; crisisCategory: string; weight: number }> = [];
  for (
    const [category, { keywords, crisisCategory, weight }] of Object.entries(
      VULNERABILITY_TAXONOMY,
    )
  ) {
    // Count how many keywords match for stronger ranking
    const matchCount = keywords.filter((re) => re.test(text)).length;
    if (matchCount > 0) {
      matches.push({ category, crisisCategory, weight: weight * matchCount });
    }
  }

  // Sort by weighted score, cap at MAX_CATEGORIES_PER_INCIDENT
  matches.sort((a, b) => b.weight - a.weight);
  const topMatches = matches.slice(0, MAX_CATEGORIES_PER_INCIDENT);
  const categories = topMatches.map((m) => m.category);
  const crisisSet = new Set(topMatches.map((m) => m.crisisCategory));

  return {
    categories,
    crisisCategories: Array.from(crisisSet),
    isVulnerable: categories.length > 0,
    classification_reason: categories.length > 0 ? "keyword_match" : "none",
    harm_domain: classifyHarmDomain(text),
    severity_signal: classifySeverity(text, harmedParties.length),
  };
}

// ── GraphQL Fetcher ────────────────────────────────────────────
interface AIIDIncident {
  incident_id: number;
  title: string;
  description: string | null;
  date: string;
  AllegedHarmedOrNearlyHarmedParties: Array<{
    entity_id: string;
    name: string;
  }>;
  AllegedDeployerOfAISystem: Array<{ entity_id: string; name: string }>;
  AllegedDeveloperOfAISystem: Array<{ entity_id: string; name: string }>;
}

const AIID_QUERY = `
query FetchIncidents($skip: Int!, $limit: Int!) {
  incidents(pagination: { limit: $limit, skip: $skip }) {
    incident_id
    title
    description
    date
    AllegedHarmedOrNearlyHarmedParties {
      entity_id
      name
    }
    AllegedDeployerOfAISystem {
      entity_id
      name
    }
    AllegedDeveloperOfAISystem {
      entity_id
      name
    }
  }
}
`;

async function fetchAllIncidents(): Promise<AIIDIncident[]> {
  const all: AIIDIncident[] = [];
  let skip = 0;

  while (all.length < MAX_FETCH) {
    console.log(
      `Fetching AIID batch: skip=${skip}, limit=${BATCH_SIZE} (total so far: ${all.length})`,
    );
    const res = await fetchWithRetry("https://incidentdatabase.ai/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://incidentdatabase.ai",
        Referer: "https://incidentdatabase.ai/",
      },
      body: JSON.stringify({
        query: AIID_QUERY,
        variables: { skip, limit: BATCH_SIZE },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AIID API error [${res.status}]: ${body}`);
      if (all.length > 0) break;
      throw new Error(`AIID API returned ${res.status}`);
    }

    const json = await res.json();
    const incidents: AIIDIncident[] = json?.data?.incidents || [];

    if (incidents.length === 0) break;
    all.push(...incidents);
    skip += BATCH_SIZE;

    if (incidents.length === BATCH_SIZE) {
      await sleep(BATCH_DELAY_MS);
    } else {
      break;
    }
  }

  if (all.length >= MAX_FETCH) {
    console.warn(`Hit MAX_FETCH guard (${MAX_FETCH}), stopping pagination`);
  }
  console.log(`Fetched ${all.length} total AIID incidents`);
  return all;
}

// ── Pipeline ───────────────────────────────────────────────────
async function runPipeline(supabase: any) {
  const ingestRunId = crypto.randomUUID();
  const incidents = await fetchAllIncidents();

  if (incidents.length === 0) {
    throw new Error("No incidents returned from AIID");
  }

  // Classify all incidents
  const classified = incidents.map((inc) => {
    const harmedNames = (inc.AllegedHarmedOrNearlyHarmedParties || []).map((p) => p.name);
    const classification = classifyVulnerability(
      inc.title || "",
      inc.description || "",
      harmedNames,
    );
    return { incident: inc, ...classification };
  });

  // Aggregate stats
  const totalIncidents = classified.length;
  const vulnerableIncidents = classified.filter((c) => c.isVulnerable).length;
  const vulnerablePercent = totalIncidents > 0
    ? Math.round((vulnerableIncidents / totalIncidents) * 1000) / 10
    : 0;

  // Count by category (all matches, not capped)
  const categoryCounts: Record<string, number> = {};
  for (const c of classified) {
    for (const cat of c.categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  // Harm domain distribution
  const harmDomainCounts: Record<string, number> = {};
  for (const c of classified) {
    harmDomainCounts[c.harm_domain] = (harmDomainCounts[c.harm_domain] || 0) + 1;
  }

  // Severity distribution
  const severityCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };
  for (const c of classified) {
    severityCounts[c.severity_signal]++;
  }

  // Trend calculation: compare last 12 months vs prior 12 months
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const recent12m = incidents.filter((i) => {
    const d = new Date(i.date || "2000-01-01");
    return d >= oneYearAgo && d <= now;
  }).length;

  const prior12m = incidents.filter((i) => {
    const d = new Date(i.date || "2000-01-01");
    return d >= twoYearsAgo && d < oneYearAgo;
  }).length;

  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (prior12m > 0) {
    const changeRate = (recent12m - prior12m) / prior12m;
    if (changeRate > 0.1) trend = "increasing";
    else if (changeRate < -0.1) trend = "decreasing";
  }

  console.log(
    `Classification: ${vulnerableIncidents}/${totalIncidents} (${vulnerablePercent}%) vulnerable | ` +
      `Trend: ${trend} (${recent12m} recent vs ${prior12m} prior) | ` +
      `Severity: ${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low`,
  );

  // ── Idempotency check ────────────────────────────────────────
  const batchFingerprint = `aiid:${totalIncidents}:${
    incidents
      .map((i) => i.incident_id)
      .sort()
      .join(",")
  }`;
  const batchHash = await sha256(batchFingerprint);

  const { data: existingRaw } = await supabase
    .from("raw_records")
    .select("raw_id")
    .eq("source_system", "aiid")
    .eq("raw_sha256", batchHash)
    .limit(1);

  if (existingRaw && existingRaw.length > 0) {
    console.log("Idempotency: identical batch already ingested, skipping raw + canonical inserts");
    // Still update the summary cache (timestamps, trend)
  } else {
    // ── Layer 1: Insert raw record ──────────────────────────────
    const { data: rawData } = await supabase
      .from("raw_records")
      .insert({
        source_system: "aiid",
        endpoint: "https://incidentdatabase.ai/api/graphql",
        source_record_id: `aiid_batch_${new Date().toISOString().slice(0, 10)}`,
        raw_payload: {
          incident_count: totalIncidents,
          vulnerable_count: vulnerableIncidents,
          vulnerable_percent: vulnerablePercent,
          top_categories: topCategories,
          harm_domains: harmDomainCounts,
          severity_distribution: severityCounts,
          trend,
          recent_12m: recent12m,
          prior_12m: prior12m,
        },
        raw_sha256: batchHash,
        ingest_run_id: ingestRunId,
        http_status: 200,
        content_type: "application/json",
        source_version: "graphql-v1",
        license: "CC BY-SA 4.0",
      })
      .select("raw_id")
      .single();

    if (rawData) {
      console.log(`Raw record inserted: ${rawData.raw_id}`);
    }

    // ── Layer 2: Insert canonical entities (top 50 vulnerable) ──
    const vulnerableToStore = classified
      .filter((c) => c.isVulnerable)
      .sort(
        (a, b) =>
          new Date(b.incident.date || "2020-01-01").getTime() -
          new Date(a.incident.date || "2020-01-01").getTime(),
      )
      .slice(0, 50);

    let insertedCount = 0;
    for (const item of vulnerableToStore) {
      const inc = item.incident;
      const harmedNames = (inc.AllegedHarmedOrNearlyHarmedParties || []).map((p) => p.name);
      const deployerNames = (inc.AllegedDeployerOfAISystem || []).map((p) => p.name);
      const developerNames = (inc.AllegedDeveloperOfAISystem || []).map((p) => p.name);

      // Idempotency: check if this incident already exists
      const sourceRecordId = `aiid:incident:${inc.incident_id}`;
      const { data: existing } = await supabase
        .from("canonical_entities")
        .select("canonical_id")
        .eq("source_system", "aiid")
        .eq("source_record_id", sourceRecordId)
        .limit(1);

      if (existing && existing.length > 0) continue; // Already stored

      const { error } = await supabase.from("canonical_entities").insert({
        entity_kind: "ai_harm_observation",
        source_system: "aiid",
        source_record_id: sourceRecordId,
        observed_at: inc.date ? `${inc.date}T00:00:00Z` : null,
        time_precision_val: "day",
        // Improvement #1: explicit time_basis
        time_basis: "reported",
        domain: "other",
        subdomain: "ai_harm",
        event_type: "ai_incident",
        title: inc.title || `AIID Incident #${inc.incident_id}`,
        summary: inc.description ? inc.description.slice(0, 500) : null,
        country_code: "WLD",
        location_precision_val: "global",
        actor_primary: deployerNames.join(", ") || null,
        actor_secondary: developerNames.join(", ") || null,
        affected_population: harmedNames.join(", ") || null,
        admissibility_status: "derived",
        admissibility_reasons: ["aiid_curated_incident", "keyword_vulnerability_classification"],
        quality: {
          source_confidence: "high",
          // Improvement #3: classification_reason
          classification_confidence: "medium",
          classification_reason: item.classification_reason,
          estimate: false,
          model: false,
          aggregate: true,
          vulnerability_categories: item.categories,
          crisis_categories: item.crisisCategories,
          // Improvement #5: harm_domain
          harm_domain: item.harm_domain,
          // Improvement #6: severity_signal
          severity_signal: item.severity_signal,
        },
        lineage: {
          schema_version: SCHEMA_VERSION,
          normalizer_version: NORMALIZER_VERSION,
          transform_notes:
            `Classified ${item.categories.length} vulnerability categories (max ${MAX_CATEGORIES_PER_INCIDENT})`,
          source_url: `https://incidentdatabase.ai/cite/${inc.incident_id}`,
          // Improvement #2: preserve raw AIID taxonomy
          raw_incident_id: inc.incident_id,
          raw_harmed_parties: harmedNames,
          raw_deployers: deployerNames,
          raw_developers: developerNames,
        },
      });

      if (error) {
        if (!error.message?.includes("duplicate")) {
          console.warn(`Canonical insert for incident ${inc.incident_id}:`, error.message);
        }
      } else {
        insertedCount++;
      }
    }
    console.log(`Inserted ${insertedCount} canonical entities`);
  }

  // ── Layer 3: Update summary cache ────────────────────────────
  await supabase
    .from("ai_incident_summary")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const { error: summaryError } = await supabase.from("ai_incident_summary").insert({
    total_incidents: totalIncidents,
    vulnerable_incidents: vulnerableIncidents,
    vulnerable_percent: vulnerablePercent,
    top_categories: topCategories,
    last_fetched_at: new Date().toISOString(),
    ingest_run_id: ingestRunId,
    trend,
    recent_12m_count: recent12m,
  });

  if (summaryError) {
    console.error("Summary insert error:", summaryError.message);
  }

  return {
    total_incidents: totalIncidents,
    vulnerable_incidents: vulnerableIncidents,
    vulnerable_percent: vulnerablePercent,
    top_categories: topCategories,
    harm_domains: harmDomainCounts,
    severity_distribution: severityCounts,
    trend,
    recent_12m_count: recent12m,
    ingest_run_id: ingestRunId,
  };
}

// ═══════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("ai_incident_summary")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        const age = Date.now() - new Date(cached.last_fetched_at).getTime();
        const maxAge = 6 * 60 * 60 * 1000;

        if (age < maxAge) {
          console.log("Returning cached AIID summary");
          return new Response(
            JSON.stringify({
              cached: true,
              total_incidents: cached.total_incidents,
              vulnerable_incidents: cached.vulnerable_incidents,
              vulnerable_percent: cached.vulnerable_percent,
              top_categories: cached.top_categories,
              trend: cached.trend,
              recent_12m_count: cached.recent_12m_count,
              last_fetched_at: cached.last_fetched_at,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }
    }

    console.log("Running AIID pipeline v2...");
    const result = await runPipeline(supabase);

    return new Response(JSON.stringify({ cached: false, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("AIID pipeline error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Graceful degradation: return stale cache on error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: fallback } = await supabase
        .from("ai_incident_summary")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fallback) {
        return new Response(
          JSON.stringify({
            cached: true,
            stale: true,
            error: message,
            total_incidents: fallback.total_incidents,
            vulnerable_incidents: fallback.vulnerable_incidents,
            vulnerable_percent: fallback.vulnerable_percent,
            top_categories: fallback.top_categories,
            trend: fallback.trend,
            recent_12m_count: fallback.recent_12m_count,
            last_fetched_at: fallback.last_fetched_at,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } catch (_) {
      // Ignore fallback errors
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
