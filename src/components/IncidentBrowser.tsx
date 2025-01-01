import { AnimatePresence, motion } from "framer-motion";
import {
  Baby,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  Cog,
  ExternalLink,
  Eye,
  Gavel,
  Globe,
  Heart,
  HeartPulse,
  Home,
  type LucideIcon,
  Medal,
  Megaphone,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

interface Incident {
  canonical_id: string;
  title: string | null;
  summary: string | null;
  observed_at: string | null;
  quality: {
    vulnerability_categories?: string[];
    classification_confidence?: string;
    crisis_categories?: string[];
    source_confidence?: string;
  };
  lineage: {
    source_url?: string;
    harm_domain?: string;
    severity_signal?: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  children: "Children",
  racial_ethnic_minorities: "Racial & ethnic minorities",
  women_gender: "Women & gender-based harm",
  patients_health: "Patients & health system failures",
  incarcerated: "Criminal justice system",
  mental_health_substance: "Mental health / Substance abuse",
  poverty_homelessness: "Poverty / Homelessness",
  disability: "People with disabilities",
  veterans_military: "Veterans",
  elderly: "Elderly & older adults",
  lgbtq: "LGBTQ+ communities",
  refugees_migrants: "Refugees & migrants",
};

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-destructive/15 text-destructive dark:bg-destructive/25" },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  children: Baby,
  racial_ethnic_minorities: Users,
  women_gender: Shield,
  patients_health: HeartPulse,
  incarcerated: Gavel,
  mental_health_substance: Brain,
  poverty_homelessness: Home,
  disability: Heart,
  veterans_military: Medal,
  elderly: Users,
  lgbtq: Users,
  refugees_migrants: Globe,
};

const HARM_DOMAIN_LABELS: Record<string, string> = {
  algorithmic_bias: "Algorithmic Bias",
  content_recommendation: "Content Recommendation",
  decision_support: "Decision Support",
  surveillance: "Surveillance",
  automation_error: "Automation Error",
  deepfake_misuse: "Deepfake / Misuse",
};

const HARM_DOMAIN_ICONS: Record<string, LucideIcon> = {
  algorithmic_bias: Cog,
  content_recommendation: Megaphone,
  decision_support: Brain,
  surveillance: Eye,
  automation_error: Bot,
  deepfake_misuse: Shield,
};

const PAGE_SIZE = 10;

export default function IncidentBrowser() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetch() {
      if (!isSupabaseConfigured) {
        setError(
          "Incident archive is unavailable until Supabase environment variables are configured.",
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("canonical_entities")
        .select("canonical_id, title, summary, observed_at, quality, lineage")
        .eq("source_system", "aiid")
        .eq("entity_kind", "ai_harm_observation")
        .order("observed_at", { ascending: false });

      if (error) {
        setError(
          "Unable to load the incident archive right now. Summary metrics may still be available.",
        );
      }

      if (data) {
        setIncidents(data as unknown as Incident[]);
        setError(null);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  // Collect unique categories from data
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    incidents.forEach((inc) => {
      (inc.quality?.vulnerability_categories || []).forEach((c) => {
        cats.add(c);
      });
    });
    return Array.from(cats).sort();
  }, [incidents]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = incidents;

    if (categoryFilter) {
      result = result.filter((inc) =>
        (inc.quality?.vulnerability_categories || []).includes(categoryFilter),
      );
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (inc) => inc.title?.toLowerCase().includes(q) || inc.summary?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [incidents, debouncedSearch, categoryFilter]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="space-y-3">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <div key={key} className="bg-card border border-border/50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search incidents…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Category chips — always visible */}
      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categoryFilter && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter(null);
                setVisibleCount(PAGE_SIZE);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <X className="h-2.5 w-2.5" /> Clear
            </button>
          )}
          {allCategories.map((cat) => {
            const count = incidents.filter((inc) =>
              (inc.quality?.vulnerability_categories || []).includes(cat),
            ).length;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => {
                  setCategoryFilter(categoryFilter === cat ? null : cat);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
                <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Result count */}
      <p className="text-[11px] text-muted-foreground">
        Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} incident
        {filtered.length !== 1 ? "s" : ""}
        {categoryFilter && (
          <>
            {" "}
            in{" "}
            <strong className="text-foreground">
              {CATEGORY_LABELS[categoryFilter] || categoryFilter}
            </strong>
          </>
        )}
      </p>

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      {/* Incident cards */}
      <div className="space-y-2">
        {visible.map((inc, i) => {
          const isExpanded = expandedId === inc.canonical_id;
          const severity = inc.lineage?.severity_signal;
          const harmDomain = inc.lineage?.harm_domain;
          const sourceUrl = inc.lineage?.source_url;
          const categories = inc.quality?.vulnerability_categories || [];
          const date = inc.observed_at
            ? new Date(inc.observed_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : null;

          return (
            <motion.div
              key={inc.canonical_id}
              className="bg-card border border-border/50 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : inc.canonical_id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Category chips — top */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {categories.slice(0, 3).map((cat) => {
                        const CatIcon = CATEGORY_ICONS[cat];
                        return (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive/80 dark:bg-destructive/20 dark:text-destructive font-medium"
                          >
                            {CatIcon && <CatIcon className="h-2.5 w-2.5" />}
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                        );
                      })}
                      {categories.length > 3 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          +{categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Date + severity + harm domain */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {date && (
                      <span className="text-[10px] text-muted-foreground font-mono">{date}</span>
                    )}
                    {severity && SEVERITY_CONFIG[severity] && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${SEVERITY_CONFIG[severity].className}`}
                      >
                        {SEVERITY_CONFIG[severity].label}
                      </span>
                    )}
                    {harmDomain &&
                      (() => {
                        const DomainIcon = HARM_DOMAIN_ICONS[harmDomain];
                        return (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {DomainIcon && <DomainIcon className="h-2.5 w-2.5" />}
                            {HARM_DOMAIN_LABELS[harmDomain] || harmDomain}
                          </span>
                        );
                      })()}
                  </div>
                  {/* Title */}
                  <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                    {inc.title || "Untitled Incident"}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-2.5 border-t border-border/30">
                      {inc.summary && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed pt-2.5">
                          {inc.summary}
                        </p>
                      )}

                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mr-1 self-center">
                            Affected:
                          </span>
                          {categories.map((cat) => {
                            const CatIcon = CATEGORY_ICONS[cat];
                            return (
                              <span
                                key={cat}
                                className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive/80 dark:bg-destructive/20 dark:text-destructive font-medium"
                              >
                                {CatIcon && <CatIcon className="h-2.5 w-2.5" />}
                                {CATEGORY_LABELS[cat] || cat}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {inc.quality?.crisis_categories &&
                        inc.quality.crisis_categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mr-1 self-center">
                              Crisis:
                            </span>
                            {inc.quality.crisis_categories.map((crisis) => (
                              <span
                                key={crisis}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium"
                              >
                                {crisis}
                              </span>
                            ))}
                          </div>
                        )}

                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
                        >
                          View on AIID <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full py-2.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg border border-border/50 transition-colors"
        >
          Load more ({filtered.length - visibleCount} remaining)
        </button>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No incidents match your search.
        </div>
      )}
    </div>
  );
}
