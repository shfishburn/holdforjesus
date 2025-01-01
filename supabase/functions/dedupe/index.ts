import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════
// CROSS-SOURCE DEDUPLICATION ENGINE
// Architecture: Two-stage dedupe → incident_clusters + cluster_members
//
// Stage 1: Hard candidate window (domain + geo radius + time window)
// Stage 2: Semantic merge score (source pair, title/summary, metrics, geo/time)
// ═══════════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──────────────────────────────────────────────────────
interface CanonicalRow {
  canonical_id: string;
  entity_kind: string;
  source_system: string;
  domain: string;
  observed_at: string | null;
  start_at: string | null;
  lat: number | null;
  lon: number | null;
  country_code: string | null;
  event_type: string | null;
  hazard_type: string | null;
  indicator_code: string | null;
  title: string | null;
  summary: string | null;
  fatalities: number | null;
  displaced_persons: number | null;
  affected_persons: number | null;
  magnitude: number | null;
  value: number | null;
  admissibility_status: string;
}

interface CandidatePair {
  a: CanonicalRow;
  b: CanonicalRow;
  score: number;
  signals: string[];
}

interface ClusterCandidate {
  members: CanonicalRow[];
  domain: string;
  centroid_lat: number | null;
  centroid_lon: number | null;
  start_at: string | null;
  end_at: string | null;
  label: string;
  avg_confidence: number;
}

// ── Configuration per domain ───────────────────────────────────
const DOMAIN_CONFIG: Record<
  string,
  { geoRadiusKm: number; timeWindowHours: number; autoClusterThreshold: number }
> = {
  conflict: { geoRadiusKm: 25, timeWindowHours: 48, autoClusterThreshold: 0.85 },
  disaster: { geoRadiusKm: 100, timeWindowHours: 24, autoClusterThreshold: 0.8 },
  health: { geoRadiusKm: 0, timeWindowHours: 8760, autoClusterThreshold: 0.9 }, // country-level, yearly
  displacement: { geoRadiusKm: 0, timeWindowHours: 8760, autoClusterThreshold: 0.95 }, // never auto-merge
  food_security: { geoRadiusKm: 0, timeWindowHours: 8760, autoClusterThreshold: 0.95 },
  slavery: { geoRadiusKm: 0, timeWindowHours: 8760, autoClusterThreshold: 0.95 },
  humanitarian_catalog: { geoRadiusKm: 0, timeWindowHours: 8760, autoClusterThreshold: 0.95 },
  development: { geoRadiusKm: 0, timeWindowHours: 8760, autoClusterThreshold: 0.95 },
  other: { geoRadiusKm: 50, timeWindowHours: 72, autoClusterThreshold: 0.85 },
};

// ── Source pair priors ─────────────────────────────────────────
// Higher = more likely to describe the same incident
const SOURCE_PAIR_PRIOR: Record<string, number> = {
  "acled:gdelt": 0.65,
  "usgs:gdelt": 0.4,
  "nasa_firms:gdelt": 0.35,
  "acled:un_sdg": 0.3,
  "usgs:nasa_firms": 0.2,
  // Same source = never self-dedupe
};

function getSourcePairPrior(a: string, b: string): number {
  if (a === b) return 0; // Same source → don't dedupe
  const key1 = `${a}:${b}`;
  const key2 = `${b}:${a}`;
  return SOURCE_PAIR_PRIOR[key1] || SOURCE_PAIR_PRIOR[key2] || 0.15;
}

// ── Geo helpers ────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Text similarity (Jaccard on bigrams) ───────────────────────
function bigrams(text: string): Set<string> {
  const clean = text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  const result = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    result.add(`${words[i]} ${words[i + 1]}`);
  }
  // Also add unigrams for short texts
  for (const w of words) result.add(w);
  return result;
}

function textSimilarity(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection); // Jaccard
}

// ── Metric proximity ───────────────────────────────────────────
function metricProximity(a: CanonicalRow, b: CanonicalRow): number {
  const pairs: [number | null, number | null][] = [
    [a.fatalities, b.fatalities],
    [a.displaced_persons, b.displaced_persons],
    [a.affected_persons, b.affected_persons],
    [a.magnitude, b.magnitude],
    [a.value, b.value],
  ];

  let totalSim = 0;
  let count = 0;
  for (const [va, vb] of pairs) {
    if (va != null && vb != null && (va > 0 || vb > 0)) {
      const maxVal = Math.max(Math.abs(va), Math.abs(vb));
      totalSim += 1 - Math.abs(va - vb) / maxVal;
      count++;
    }
  }
  return count > 0 ? totalSim / count : 0;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 1: HARD CANDIDATE WINDOW
// ═══════════════════════════════════════════════════════════════

function isCandidate(a: CanonicalRow, b: CanonicalRow): boolean {
  // Must be same domain
  if (a.domain !== b.domain) return false;

  // Must be different sources (no self-dedupe)
  if (a.source_system === b.source_system) return false;

  const config = DOMAIN_CONFIG[a.domain] || DOMAIN_CONFIG.other;

  // Time window check
  const timeA = new Date(a.observed_at || a.start_at || 0).getTime();
  const timeB = new Date(b.observed_at || b.start_at || 0).getTime();
  const timeDiffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
  if (timeDiffHours > config.timeWindowHours) return false;

  // Geo radius check (only if both have coordinates)
  if (config.geoRadiusKm > 0 && a.lat != null && a.lon != null && b.lat != null && b.lon != null) {
    const dist = haversineKm(a.lat, a.lon, b.lat, b.lon);
    if (dist > config.geoRadiusKm) return false;
  }

  // For indicator/population observations, also require matching country
  if (a.entity_kind !== "event" && b.entity_kind !== "event") {
    if (a.country_code !== b.country_code) return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 2: SEMANTIC MERGE SCORE
// ═══════════════════════════════════════════════════════════════

function computeMergeScore(a: CanonicalRow, b: CanonicalRow): CandidatePair {
  const signals: string[] = [];
  let score = 0;

  // 1. Source pair prior (0.20 weight)
  const sourcePrior = getSourcePairPrior(a.source_system, b.source_system);
  score += sourcePrior * 0.2;
  signals.push(`source_pair: ${sourcePrior.toFixed(2)}`);

  // 2. Title/summary similarity (0.25 weight)
  const titleSim = textSimilarity(a.title, b.title);
  const summarySim = textSimilarity(a.summary, b.summary);
  const textScore = Math.max(titleSim, summarySim);
  score += textScore * 0.25;
  if (textScore > 0.3) signals.push(`text_sim: ${textScore.toFixed(2)}`);

  // 3. Event type / hazard type match (0.15 weight)
  let typeScore = 0;
  if (a.event_type && b.event_type && a.event_type === b.event_type) {
    typeScore = 1;
    signals.push("event_type_match");
  } else if (a.hazard_type && b.hazard_type && a.hazard_type === b.hazard_type) {
    typeScore = 0.8;
    signals.push("hazard_type_match");
  } else if (a.indicator_code && b.indicator_code && a.indicator_code === b.indicator_code) {
    typeScore = 1;
    signals.push("indicator_code_match");
  }
  score += typeScore * 0.15;

  // 4. Metric proximity (0.20 weight)
  const metricSim = metricProximity(a, b);
  score += metricSim * 0.2;
  if (metricSim > 0.5) signals.push(`metric_proximity: ${metricSim.toFixed(2)}`);

  // 5. Geo/time closeness (0.20 weight)
  let geoTimeSim = 0;
  // Geo component
  if (a.lat != null && a.lon != null && b.lat != null && b.lon != null) {
    const dist = haversineKm(a.lat, a.lon, b.lat, b.lon);
    const maxDist = (DOMAIN_CONFIG[a.domain] || DOMAIN_CONFIG.other).geoRadiusKm || 100;
    geoTimeSim += (1 - Math.min(dist / maxDist, 1)) * 0.5;
  } else if (a.country_code === b.country_code && a.country_code) {
    geoTimeSim += 0.3; // Same country but no coordinates
    signals.push("same_country");
  }
  // Time component
  const timeA = new Date(a.observed_at || a.start_at || 0).getTime();
  const timeB = new Date(b.observed_at || b.start_at || 0).getTime();
  const maxWindow = (DOMAIN_CONFIG[a.domain] || DOMAIN_CONFIG.other).timeWindowHours;
  const timeDiffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
  geoTimeSim += (1 - Math.min(timeDiffHours / maxWindow, 1)) * 0.5;
  score += geoTimeSim * 0.2;

  return { a, b, score: Math.min(score, 1), signals };
}

// ═══════════════════════════════════════════════════════════════
// CLUSTER FORMATION (Union-Find based)
// ═══════════════════════════════════════════════════════════════

class UnionFind {
  parent: Map<string, string> = new Map();
  rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return;
    const rankX = this.rank.get(rx)!;
    const rankY = this.rank.get(ry)!;
    if (rankX < rankY) this.parent.set(rx, ry);
    else if (rankX > rankY) this.parent.set(ry, rx);
    else {
      this.parent.set(ry, rx);
      this.rank.set(rx, rankX + 1);
    }
  }

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(key);
    }
    return groups;
  }
}

function formClusters(entities: CanonicalRow[], pairs: CandidatePair[]): ClusterCandidate[] {
  const entityMap = new Map<string, CanonicalRow>();
  for (const e of entities) entityMap.set(e.canonical_id, e);

  const uf = new UnionFind();
  // Initialize all entities
  for (const e of entities) uf.find(e.canonical_id);

  // Union entities that exceed the auto-cluster threshold
  for (const pair of pairs) {
    const config = DOMAIN_CONFIG[pair.a.domain] || DOMAIN_CONFIG.other;
    if (pair.score >= config.autoClusterThreshold) {
      uf.union(pair.a.canonical_id, pair.b.canonical_id);
    }
  }

  const groups = uf.getGroups();
  const clusters: ClusterCandidate[] = [];

  // Build pair scores lookup for membership confidence
  const pairScores = new Map<string, number>();
  for (const p of pairs) {
    pairScores.set(`${p.a.canonical_id}:${p.b.canonical_id}`, p.score);
    pairScores.set(`${p.b.canonical_id}:${p.a.canonical_id}`, p.score);
  }

  for (const [_root, memberIds] of groups) {
    if (memberIds.length < 2) continue; // Only multi-entity clusters

    const members = memberIds.map((id) => entityMap.get(id)!).filter(Boolean);
    if (members.length < 2) continue;

    // Compute centroid
    const geoMembers = members.filter((m) => m.lat != null && m.lon != null);
    const centroid_lat = geoMembers.length > 0
      ? geoMembers.reduce((s, m) => s + m.lat!, 0) / geoMembers.length
      : null;
    const centroid_lon = geoMembers.length > 0
      ? geoMembers.reduce((s, m) => s + m.lon!, 0) / geoMembers.length
      : null;

    // Time range
    const times = members
      .map((m) => new Date(m.observed_at || m.start_at || 0).getTime())
      .filter((t) => t > 0)
      .sort((a, b) => a - b);
    const start_at = times.length > 0 ? new Date(times[0]).toISOString() : null;
    const end_at = times.length > 0 ? new Date(times[times.length - 1]).toISOString() : null;

    // Label from most authoritative member
    const authoritative = members.find((m) => m.admissibility_status === "authoritative") ||
      members[0];
    const label = authoritative.title ||
      `${authoritative.domain} cluster: ${members.map((m) => m.source_system).join(" + ")}`;

    // Average confidence from pair scores
    let totalConf = 0,
      confCount = 0;
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const key = `${memberIds[i]}:${memberIds[j]}`;
        if (pairScores.has(key)) {
          totalConf += pairScores.get(key)!;
          confCount++;
        }
      }
    }

    clusters.push({
      members,
      domain: authoritative.domain,
      centroid_lat,
      centroid_lon,
      start_at,
      end_at,
      label,
      avg_confidence: confCount > 0 ? totalConf / confCount : 0,
    });
  }

  return clusters;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════

async function runDedupe(
  supabase: any,
  lookbackDays = 30,
): Promise<{
  entitiesProcessed: number;
  candidatePairs: number;
  clustersCreated: number;
  reviewQueue: CandidatePair[];
}> {
  const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent canonical entities
  const { data: entities, error } = await supabase
    .from("canonical_entities")
    .select(
      "canonical_id, entity_kind, source_system, domain, observed_at, start_at, lat, lon, country_code, event_type, hazard_type, indicator_code, title, summary, fatalities, displaced_persons, affected_persons, magnitude, value, admissibility_status",
    )
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(`Failed to fetch entities: ${error.message}`);
  if (!entities?.length) {
    return { entitiesProcessed: 0, candidatePairs: 0, clustersCreated: 0, reviewQueue: [] };
  }

  console.log(
    `Deduplication: processing ${entities.length} entities from last ${lookbackDays} days`,
  );

  // Stage 1: Find candidate pairs
  const candidatePairs: CandidatePair[] = [];
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      if (isCandidate(entities[i], entities[j])) {
        const pair = computeMergeScore(entities[i], entities[j]);
        if (pair.score > 0.3) {
          // Only keep pairs with some signal
          candidatePairs.push(pair);
        }
      }
    }
  }

  console.log(`Stage 1: ${candidatePairs.length} candidate pairs found`);

  // Sort by score descending
  candidatePairs.sort((a, b) => b.score - a.score);

  // Separate review queue (0.7-threshold) from auto-clusters (>threshold)
  const reviewQueue = candidatePairs.filter((p) => {
    const config = DOMAIN_CONFIG[p.a.domain] || DOMAIN_CONFIG.other;
    return p.score >= 0.7 && p.score < config.autoClusterThreshold;
  });

  // Stage 2: Form clusters
  const clusters = formClusters(entities, candidatePairs);
  console.log(
    `Stage 2: ${clusters.length} clusters formed, ${reviewQueue.length} pairs in review queue`,
  );

  // Persist clusters
  for (const cluster of clusters) {
    const { data: clusterRow, error: clusterErr } = await supabase
      .from("incident_clusters")
      .insert({
        domain: cluster.domain,
        centroid_lat: cluster.centroid_lat,
        centroid_lon: cluster.centroid_lon,
        start_at: cluster.start_at,
        end_at: cluster.end_at,
        label: cluster.label,
      })
      .select("cluster_id")
      .single();

    if (clusterErr) {
      console.warn("Cluster insert error:", clusterErr.message);
      continue;
    }

    // Insert members
    const memberRows = cluster.members.map((m) => ({
      cluster_id: clusterRow.cluster_id,
      canonical_id: m.canonical_id,
      membership_confidence: cluster.avg_confidence,
    }));

    const { error: memberErr } = await supabase.from("cluster_members").insert(memberRows);

    if (memberErr) console.warn("Member insert error:", memberErr.message);
  }

  return {
    entitiesProcessed: entities.length,
    candidatePairs: candidatePairs.length,
    clustersCreated: clusters.length,
    reviewQueue,
  };
}

// ═══════════════════════════════════════════════════════════════
// HTTP HANDLER
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

    // Parse optional lookback from request body
    let lookbackDays = 30;
    try {
      if (req.method === "POST") {
        const body = await req.json();
        if (body?.lookback_days) lookbackDays = Math.min(body.lookback_days, 365);
      }
    } catch {
      /* ignore parse errors, use default */
    }

    const result = await runDedupe(supabase, lookbackDays);

    return new Response(
      JSON.stringify({
        status: "ok",
        entities_processed: result.entitiesProcessed,
        candidate_pairs: result.candidatePairs,
        clusters_created: result.clustersCreated,
        review_queue_size: result.reviewQueue.length,
        review_queue: result.reviewQueue.slice(0, 20).map((p) => ({
          entity_a: { id: p.a.canonical_id, source: p.a.source_system, title: p.a.title },
          entity_b: { id: p.b.canonical_id, source: p.b.source_system, title: p.b.title },
          score: Math.round(p.score * 1000) / 1000,
          signals: p.signals,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Dedupe engine error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
