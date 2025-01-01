import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  Flame,
  Globe,
  Heart,
  Info,
  Shield,
  Skull,
  TrendingUp,
  Users,
  Wheat,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo.tsx";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

const INDEX_CACHE_KEY = "observatory_index_cache_v1";
const AIID_CACHE_KEY = "observatory_aiid_cache_v1";

interface IndexData {
  cached: boolean;
  index: {
    composite_score: number;
    components: Record<
      string,
      {
        name: string;
        source?: string;
        raw: number;
        normalized: number;
        weight: number;
        unit?: string;
        year: number;
        admissibility?: string;
        time_basis?: string;
      }
    >;
    computed_at: string;
  };
  metrics: unknown[];
}

interface AIIncidentData {
  total_incidents: number;
  vulnerable_incidents: number;
  vulnerable_percent: number;
  top_categories: Array<{ name: string; count: number }>;
  last_fetched_at: string;
  trend?: "increasing" | "stable" | "decreasing";
  recent_12m_count?: number;
}

// ── Score interpretation bands ─────────────────────────────────
function getScoreBand(score: number): {
  label: string;
  description: string;
  color: string;
  bgClass: string;
} {
  if (score < 20)
    return {
      label: "Low Distress",
      description:
        "Most global indicators are near baseline. Structural suffering still exists, but acute crisis signals are currently limited.",
      color: "hsl(145, 45%, 38%)",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    };

  if (score < 35)
    return {
      label: "Moderate Distress",
      description:
        "Several structural indicators are elevated. Chronic conditions like poverty and food insecurity persist at concerning levels, though acute crises are contained.",
      color: "hsl(80, 50%, 42%)",
      bgClass: "bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-800",
    };
  if (score < 50)
    return {
      label: "Elevated Distress",
      description:
        "Multiple pain dimensions are significantly above baseline. Displacement, conflict mortality, or health indicators are driving the index upward. The world is under measurable strain.",
      color: "hsl(45, 70%, 45%)",
      bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    };
  if (score < 65)
    return {
      label: "High Distress",
      description:
        "Acute humanitarian conditions are widespread. Multiple crises are compounding — high displacement, active conflicts, health system failures, or food emergencies are simultaneously active.",
      color: "hsl(25, 80%, 48%)",
      bgClass: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    };
  if (score < 80)
    return {
      label: "Severe Distress",
      description:
        "The global system is under extraordinary pressure. Major indicators are at or near historical peaks. Humanitarian response capacity is likely strained beyond limits.",
      color: "hsl(5, 75%, 50%)",
      bgClass: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    };
  return {
    label: "Catastrophic",
    description:
      "Pain indicators have reached unprecedented levels across nearly every dimension. This represents a civilizational-scale crisis requiring immediate global mobilization.",
    color: "hsl(350, 80%, 40%)",
    bgClass: "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-700",
  };
}

// ── Category definitions ───────────────────────────────────────
interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  indicators: string[];
  colorClass: string;
}

const CATEGORIES: Category[] = [
  {
    id: "conflict",
    label: "Conflict & Violence",
    icon: <Skull className="h-4 w-4" />,
    description: "Armed conflict, political violence, and intentional harm to human life",
    indicators: ["ACLED.FATALITIES", "SDG.16.1.1", "GDELT.INSTABILITY"],
    colorClass: "text-red-600 dark:text-red-400",
  },
  {
    id: "displacement",
    label: "Displacement & Exploitation",
    icon: <Users className="h-4 w-4" />,
    description: "Forcibly displaced populations and people trapped in modern slavery",
    indicators: ["UNHCR.DISPLACED", "GSI.SLAVERY"],
    colorClass: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "health",
    label: "Health & Mortality",
    icon: <Heart className="h-4 w-4" />,
    description: "Child survival, neonatal mortality, and life expectancy at birth",
    indicators: ["SH.DYN.MORT", "WHO.NEONATAL", "SP.DYN.LE00.IN"],
    colorClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "poverty",
    label: "Poverty & Hunger",
    icon: <Wheat className="h-4 w-4" />,
    description: "Extreme poverty, food insecurity, and inadequate nutrition",
    indicators: ["SI.POV.DDAY", "SN.ITK.DEFC.ZS"],
    colorClass: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "disasters",
    label: "Natural Hazards",
    icon: <Flame className="h-4 w-4" />,
    description: "Earthquakes, wildfires, and environmental threats to human life",
    indicators: ["USGS.EARTHQUAKES", "FIRMS.WILDFIRES"],
    colorClass: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "humanitarian",
    label: "Humanitarian Response",
    icon: <Shield className="h-4 w-4" />,
    description: "Scale of active humanitarian operations and crisis tracking",
    indicators: ["HDX.CRISES"],
    colorClass: "text-blue-600 dark:text-blue-400",
  },
];

const INDICATOR_META: Record<string, { emoji: string; colorClass: string; description: string }> = {
  "SI.POV.DDAY": {
    emoji: "💰",
    colorClass: "text-amber-600 dark:text-amber-400",
    description: "Population living on less than $2.15/day",
  },
  "SH.DYN.MORT": {
    emoji: "👶",
    colorClass: "text-red-600 dark:text-red-400",
    description: "Deaths of children under 5 per 1,000 live births",
  },
  "SP.DYN.LE00.IN": {
    emoji: "⏳",
    colorClass: "text-blue-600 dark:text-blue-400",
    description: "Average years a newborn is expected to live",
  },
  "SN.ITK.DEFC.ZS": {
    emoji: "🍽️",
    colorClass: "text-orange-600 dark:text-orange-400",
    description: "Population without adequate food intake",
  },
  "UNHCR.DISPLACED": {
    emoji: "🏚️",
    colorClass: "text-violet-600 dark:text-violet-400",
    description: "Refugees, asylum seekers, IDPs, and stateless persons worldwide",
  },
  "GSI.SLAVERY": {
    emoji: "⛓️",
    colorClass: "text-rose-600 dark:text-rose-400",
    description: "Forced labor, trafficking, forced marriage — worldwide estimate",
  },
  "GDELT.INSTABILITY": {
    emoji: "📡",
    colorClass: "text-cyan-600 dark:text-cyan-400",
    description: "Global crisis instability signal from real-time news analysis",
  },
  "SDG.16.1.1": {
    emoji: "⚖️",
    colorClass: "text-slate-600 dark:text-slate-400",
    description: "Victims of intentional homicide per 100,000 population",
  },
  "ACLED.FATALITIES": {
    emoji: "💥",
    colorClass: "text-red-700 dark:text-red-300",
    description: "Deaths from political violence and armed conflict events",
  },
  "WHO.NEONATAL": {
    emoji: "🏥",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    description: "Newborn deaths within the first 28 days per 1,000 live births",
  },
  "USGS.EARTHQUAKES": {
    emoji: "🌍",
    colorClass: "text-yellow-700 dark:text-yellow-300",
    description: "Magnitude 5.0+ earthquakes detected in the last 30 days",
  },
  "FIRMS.WILDFIRES": {
    emoji: "🔥",
    colorClass: "text-orange-700 dark:text-orange-300",
    description: "Active fire hotspots detected by satellite in the last 24 hours",
  },
  "HDX.CRISES": {
    emoji: "🆘",
    colorClass: "text-red-600 dark:text-red-400",
    description: "Active humanitarian crisis datasets tracked by UN OCHA",
  },
};

// ── Admissibility badge ────────────────────────────────────────
function AdmissibilityBadge({ status }: { status?: string }) {
  if (!status) return null;
  const config: Record<string, { label: string; className: string }> = {
    authoritative: {
      label: "Authoritative",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    signal_only: {
      label: "Signal",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    derived: {
      label: "Derived",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    needs_review: {
      label: "Review",
      className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    },
  };
  const c = config[status] || config.needs_review;
  return (
    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${c.className}`}>{c.label}</span>
  );
}

// ── Category score computation ─────────────────────────────────
function computeCategoryScore(
  category: Category,
  components: Record<string, { normalized: number; weight: number; [key: string]: unknown }>,
): {
  score: number;
  activeCount: number;
} {
  let totalWeight = 0;
  let weightedSum = 0;
  let activeCount = 0;

  for (const code of category.indicators) {
    const comp = components[code];
    if (comp) {
      weightedSum += comp.normalized * comp.weight;
      totalWeight += comp.weight;
      activeCount++;
    }
  }

  return {
    score: totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0,
    activeCount,
  };
}

export default function ObservatoryPage() {
  const [data, setData] = useState<IndexData | null>(null);
  const [aiidData, setAiidData] = useState<AIIncidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      if (!isSupabaseConfigured) {
        const cachedIndex = localStorage.getItem(INDEX_CACHE_KEY);
        const cachedAiid = localStorage.getItem(AIID_CACHE_KEY);

        if (cachedIndex) {
          setData(JSON.parse(cachedIndex) as IndexData);
          setUsingCachedData(true);
        }
        if (cachedAiid) {
          setAiidData(JSON.parse(cachedAiid) as AIIncidentData);
          setUsingCachedData(true);
        }

        if (!cachedIndex && !cachedAiid) {
          setError(
            "Data services are unavailable until Supabase environment variables are configured.",
          );
        }
        setLoading(false);
        return;
      }

      try {
        const indexResult = await supabase.functions.invoke("suffering-index");
        if (!indexResult.error && indexResult.data) {
          setData(indexResult.data);
          localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(indexResult.data));
        } else {
          const cachedIndex = localStorage.getItem(INDEX_CACHE_KEY);
          if (cachedIndex) {
            setData(JSON.parse(cachedIndex) as IndexData);
            setUsingCachedData(true);
          } else {
            setError(indexResult.error?.message || "Unable to load suffering index data.");
          }
        }

        const aiidResult = await supabase.functions.invoke("ai-incidents");
        if (!aiidResult.error && aiidResult.data) {
          setAiidData(aiidResult.data);
          localStorage.setItem(AIID_CACHE_KEY, JSON.stringify(aiidResult.data));
        } else {
          const cachedAiid = localStorage.getItem(AIID_CACHE_KEY);
          if (cachedAiid) {
            setAiidData(JSON.parse(cachedAiid) as AIIncidentData);
            setUsingCachedData(true);
          }
        }
      } catch (e: unknown) {
        console.error("Observatory fetch error:", e);
        const message = e instanceof Error ? e.message : "Failed to load data";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const score = data?.index?.composite_score ?? 0;
  const components = data?.index?.components ?? {};
  const computedAt = data?.index?.computed_at;
  const band = getScoreBand(score);

  // Determine which indicators to show
  const visibleIndicators = activeCategory
    ? CATEGORIES.find((c) => c.id === activeCategory)?.indicators || []
    : Object.keys(components);

  // Find top drivers (highest normalized * weight contribution)
  const topDrivers = Object.entries(components)
    .map(([code, comp]) => ({ code, contribution: comp.normalized * comp.weight, ...comp }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  return (
    <>
      <Seo
        title="Global Pain Index | Hold for Jesus"
        description="Regularly refreshed global indicators of human pain: poverty, hunger, displacement, conflict, and mortality drawn from multiple authoritative source systems."
        path="/observatory"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Global Pain Index
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-special-elite">
            The State of the World
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Real data. Real pain. These numbers represent human lives — not abstractions. Every data
            point is someone's story.
          </p>
        </motion.div>

        {/* Context banner for direct-landing visitors */}
        <motion.div
          className="flex items-start gap-2.5 bg-card/60 border border-border/50 rounded-lg px-4 py-3 mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This page is part of{" "}
            <Link to="/" className="text-primary hover:underline font-medium">
              Hold for Jesus
            </Link>
            , a satirical AI prayer hotline. The data here is real. The hotline is not. If you need
            help, visit{" "}
            <Link to="/crisis" className="text-primary hover:underline font-medium">
              Crisis Resources
            </Link>
            .
          </p>
        </motion.div>

        {error && data && (
          <div className="max-w-xl mx-auto mb-8 rounded-lg border border-amber-400/40 bg-amber-100/40 px-4 py-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Live refresh is partially unavailable. Showing cached or last-known data where
              possible.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="h-6 w-6 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Fetching global indicators…</p>
          </div>
        ) : error && !data ? (
          <div className="text-center py-20">
            <p className="text-sm text-destructive mb-2">Unable to load data</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            {usingCachedData && (
              <p className="text-xs text-amber-600 mt-3">Displaying cached data where available.</p>
            )}
          </div>
        ) : (
          <>
            {/* ═══ Composite Score + Interpretation ═══ */}
            <motion.div
              className={`border rounded-xl p-5 sm:p-8 text-center mb-6 ${band.bgClass}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Composite Pain Index
              </p>
              <div
                className="text-6xl md:text-7xl font-bold text-foreground mb-1"
                style={{ fontFamily: "'Courier Prime', monospace" }}
              >
                {score.toFixed(1)}
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: band.color }}>
                {band.label}
              </p>
              <p className="text-xs text-muted-foreground mb-5 max-w-lg mx-auto">
                {band.description}
              </p>

              {/* Score bar */}
              <div className="max-w-md mx-auto relative">
                <div
                  className="h-3 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(120, 60%, 45%), hsl(55, 80%, 50%) 40%, hsl(30, 80%, 50%) 60%, hsl(0, 70%, 50%))`,
                  }}
                />
                {/* Gray overlay for unfilled portion */}
                <motion.div
                  className="absolute top-0 right-0 h-3 bg-muted/80 rounded-r-full"
                  initial={{ width: "100%" }}
                  animate={{ width: `${Math.max(100 - score, 0)}%` }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0 — minimal</span>
                  <span className="text-[10px] text-muted-foreground">100 — catastrophic</span>
                </div>
              </div>
            </motion.div>

            {/* ═══ Top Drivers ═══ */}
            {topDrivers.length > 0 && (
              <motion.div
                className="bg-card border border-border rounded-lg p-5 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Top drivers of global pain
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {topDrivers.map((driver) => {
                    const meta = INDICATOR_META[driver.code] || {
                      emoji: "📊",
                      colorClass: "text-foreground",
                    };
                    return (
                      <div key={driver.code} className="flex items-center gap-3">
                        <span className="text-2xl">{meta.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {driver.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(driver.contribution * 100).toFixed(1)}% of total index
                            {driver.admissibility && (
                              <span className="ml-1.5">
                                <AdmissibilityBadge status={driver.admissibility} />
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ Category Tabs ═══ */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    activeCategory === null
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  All Indicators
                </button>
                {CATEGORIES.map((cat) => {
                  const { score: catScore, activeCount } = computeCategoryScore(cat, components);
                  if (activeCount === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                        activeCategory === cat.id
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] font-mono ${activeCategory === cat.id ? "text-background/70" : "text-muted-foreground/60"}`}
                      >
                        {catScore.toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ═══ Category Description ═══ */}
            <AnimatePresence mode="wait">
              {activeCategory && (
                <motion.div
                  key={activeCategory}
                  className="text-center mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.id === activeCategory)?.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ Individual Indicators ═══ */}
            <div className="grid gap-4 md:grid-cols-2 mb-10">
              <AnimatePresence mode="popLayout">
                {Object.entries(components)
                  .filter(([code]) => visibleIndicators.includes(code))
                  .map(([code, comp], i) => {
                    const meta = INDICATOR_META[code] || {
                      emoji: "📊",
                      colorClass: "text-foreground",
                      description: "",
                    };
                    const parentCategory = CATEGORIES.find((cat) => cat.indicators.includes(code));
                    return (
                      <motion.div
                        key={code}
                        className="bg-card border border-border rounded-lg overflow-hidden"
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        {/* Category headline */}
                        {parentCategory && (
                          <div className="px-5 pt-3 pb-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCategory(
                                  activeCategory === parentCategory.id ? null : parentCategory.id,
                                )
                              }
                              className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold ${parentCategory.colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
                            >
                              {parentCategory.icon}
                              {parentCategory.label}
                            </button>
                          </div>
                        )}

                        <div className="p-4 sm:p-5 pt-2">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{comp.name}</p>
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                  {meta.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-7 sm:ml-2">
                              <AdmissibilityBadge status={comp.admissibility} />
                              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                {comp.year}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-end justify-between">
                            <div>
                              <span
                                className={`text-2xl font-bold ${meta.colorClass}`}
                                style={{ fontFamily: "'Courier Prime', monospace" }}
                              >
                                {typeof comp.raw === "number"
                                  ? comp.raw >= 1_000_000
                                    ? `${(comp.raw / 1_000_000).toFixed(1)}M`
                                    : comp.raw >= 1_000
                                      ? `${(comp.raw / 1_000).toFixed(1)}K`
                                      : comp.raw.toFixed(1)
                                  : "—"}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                {comp.unit || "%"}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground">pain weight</p>
                              <p className="text-xs font-medium text-foreground">
                                {(comp.weight * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>

                          {/* Normalized bar */}
                          <div className="mt-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-accent rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(comp.normalized * 100, 100)}%` }}
                                transition={{ duration: 1, delay: 0.4 + i * 0.05 }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>

            {/* ═══ Methodology + Sources ═══ */}
            <motion.div
              className="bg-card/50 border border-border/50 rounded-lg p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Methodology</h2>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  The Composite Pain Index is a weighted average of up to 13 normalized global
                  indicators from <strong>10 organizations/systems</strong>: World Bank, UNHCR,
                  Global Slavery Index, GDELT, UN SDG, ACLED, WHO, USGS, NASA FIRMS, and UN OCHA.
                  Each indicator is scaled to 0–1 based on historical baselines stored in a
                  versioned normalization registry, then weighted by its relative contribution to
                  measurable human pain.
                </p>
                <p>
                  <strong>Score bands:</strong> 0–20 Low Distress · 20–35 Moderate · 35–50 Elevated
                  · 50–65 High · 65–80 Severe · 80–100 Catastrophic. The index adapts to available
                  data — missing sources are excluded from the weighted calculation.
                </p>
                <p>
                  <strong>Data quality:</strong> Each indicator carries an admissibility
                  classification —{" "}
                  <span className="inline-flex items-center">
                    <AdmissibilityBadge status="authoritative" />
                  </span>{" "}
                  for official statistics,{" "}
                  <span className="inline-flex items-center">
                    <AdmissibilityBadge status="signal_only" />
                  </span>{" "}
                  for media-derived signals,{" "}
                  <span className="inline-flex items-center">
                    <AdmissibilityBadge status="derived" />
                  </span>{" "}
                  for extrapolated estimates. Signal sources like GDELT are never treated as ground
                  truth.
                </p>
                <p>
                  <strong>Weights:</strong> Displaced People (12%) · Conflict Fatalities (10%) ·
                  Extreme Poverty (9%) · Modern Slavery (9%) · Undernourishment (8%) · Global
                  Instability (8%) · Neonatal Mortality (7%) · Child Mortality (7%) · Homicide Rate
                  (7%) · Life Expectancy (6%) · Earthquakes (6%) · Wildfires (6%) · Humanitarian
                  Crises (5%)
                </p>
                <p className="flex items-center gap-1 pt-2 border-t border-border/50">
                  <Heart className="h-3 w-3" />
                  <span>
                    Data refreshes every 6 hours · Sources:{" "}
                    <a
                      href="https://data.worldbank.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      World Bank
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://www.unhcr.org/refugee-statistics/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      UNHCR
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://www.walkfree.org/global-slavery-index/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      GSI
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://www.gdeltproject.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      GDELT
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://unstats.un.org/sdgs/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      UN SDG
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://acleddata.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      ACLED
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://www.who.int/data/gho"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      WHO
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://earthquake.usgs.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      USGS
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://firms.modaps.eosdis.nasa.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      NASA
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://data.humdata.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      HDX
                    </a>
                    {computedAt && <> · Last updated: {new Date(computedAt).toLocaleString()}</>}
                  </span>
                </p>
              </div>
            </motion.div>

            {/* ═══ AI Incident Archive link ═══ */}
            <motion.div
              className="bg-card border border-border rounded-lg p-4 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 }}
            >
              <Link
                to="/incidents"
                className="flex items-center justify-between gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Incident Archive</p>
                    <p className="text-[10px] text-muted-foreground">
                      {aiidData
                        ? `${aiidData.total_incidents.toLocaleString()} documented incidents · ${aiidData.vulnerable_percent}% affect vulnerable populations`
                        : "Documented AI failures affecting real people"}
                    </p>
                  </div>
                </div>
                <span className="text-primary text-sm shrink-0">→</span>
              </Link>
            </motion.div>

            {/* ═══ Bridge to prayer / community ═══ */}
            <motion.div
              className="bg-card/60 border border-border/50 rounded-lg p-6 text-center space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                If these numbers move you
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                These numbers describe real lives. If one of these burdens moves you, add your voice
                — or find something you can actually do.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs pt-1">
                <Link
                  to="/community"
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  🕯️ Add your voice → Community Board
                </Link>
                <span className="text-muted-foreground/40 hidden sm:inline">·</span>
                <Link
                  to="/crisis"
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  📞 Do something → Crisis Resources
                </Link>
              </div>
            </motion.div>

            {/* ═══ Closing loop — connect back to the premise ═══ */}
            <motion.div
              className="text-center py-8 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <p className="text-sm text-muted-foreground italic max-w-md mx-auto leading-relaxed">
                This is why we built a comedy hotline. Because sometimes the only honest response to
                numbers like these is to laugh — and then do something.
              </p>
              <Link
                to="/"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                🎭 Back to the Hotline
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
