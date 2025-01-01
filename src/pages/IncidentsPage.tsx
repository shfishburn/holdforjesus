import { motion } from "framer-motion";
import { ExternalLink, Info, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import IncidentBrowser from "@/components/IncidentBrowser";
import Seo from "@/components/Seo.tsx";
import { isReactSnap, supabase } from "@/integrations/supabase/client";

// Category key → display metadata
const CATEGORY_META: Record<string, { group: string; crisis: string }> = {
  children: { group: "Children", crisis: "Youth mental health" },
  racial_ethnic_minorities: { group: "Racial & ethnic minorities", crisis: "Human rights" },
  women_gender: { group: "Women & gender-based harm", crisis: "Domestic violence" },
  patients_health: { group: "Patients & health system failures", crisis: "Mental health" },
  incarcerated: { group: "People in the criminal justice system", crisis: "Human rights" },
  mental_health_substance: {
    group: "People with mental health conditions",
    crisis: "Mental health / Substance abuse",
  },
  poverty_homelessness: {
    group: "People experiencing poverty or homelessness",
    crisis: "Hunger / Homelessness",
  },
  disability: { group: "People with disabilities", crisis: "Mental health" },
  veterans_military: { group: "Veterans", crisis: "Veterans" },
  elderly: { group: "Elderly & older adults", crisis: "Mental health" },
  lgbtq: { group: "LGBTQ+ communities", crisis: "LGBTQ+ Youth" },
  refugees_migrants: { group: "Refugees & migrants", crisis: "Human rights" },
};

// Fallback data if API unavailable
const FALLBACK_DATA = [
  { group: "Children", incidents: 190, crisis: "Youth mental health", crisisLink: "/crisis" },
  {
    group: "Racial & ethnic minorities",
    incidents: 130,
    crisis: "Human rights",
    crisisLink: "/crisis",
  },
  {
    group: "Women & gender-based harm",
    incidents: 111,
    crisis: "Domestic violence",
    crisisLink: "/crisis",
  },
  {
    group: "Patients & health system failures",
    incidents: 60,
    crisis: "Mental health",
    crisisLink: "/crisis",
  },
  {
    group: "People in the criminal justice system",
    incidents: 41,
    crisis: "Human rights",
    crisisLink: "/crisis",
  },
  {
    group: "People with mental health conditions",
    incidents: 38,
    crisis: "Mental health / Substance abuse",
    crisisLink: "/crisis",
  },
  {
    group: "People experiencing poverty or homelessness",
    incidents: 28,
    crisis: "Hunger / Homelessness",
    crisisLink: "/crisis",
  },
  {
    group: "People with disabilities",
    incidents: 24,
    crisis: "Mental health",
    crisisLink: "/crisis",
  },
  { group: "Veterans", incidents: 23, crisis: "Veterans", crisisLink: "/crisis" },
  {
    group: "Elderly & older adults",
    incidents: 22,
    crisis: "Mental health",
    crisisLink: "/crisis",
  },
  { group: "LGBTQ+ communities", incidents: 17, crisis: "LGBTQ+ Youth", crisisLink: "/crisis" },
  { group: "Refugees & migrants", incidents: 9, crisis: "Human rights", crisisLink: "/crisis" },
];

const LAYERS = [
  {
    layer: "The Hotline",
    what: "Satirizes AI authority over sacred questions",
    tone: "Comedy",
    emoji: "🎭",
  },
  {
    layer: "The Observatory",
    what: "Tracks global suffering in real time",
    tone: "Data",
    emoji: "🌍",
  },
  {
    layer: "The Incident Archive",
    what: "Documents AI failures affecting real people",
    tone: "Evidence",
    emoji: "📋",
  },
  { layer: "Crisis Resources", what: "Connects to actual help", tone: "Action", emoji: "📞" },
];

export default function IncidentsPage() {
  const [vulnData, setVulnData] = useState(FALLBACK_DATA);
  const [totalIncidents, setTotalIncidents] = useState(1392);
  const [vulnerablePercent, setVulnerablePercent] = useState(37.4);
  const [vulnerableIncidents, setVulnerableIncidents] = useState(520);
  const [trend, setTrend] = useState<string | null>(null);
  const [recent12m, setRecent12m] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (isReactSnap) return;

    async function fetchLiveData() {
      try {
        const { data, error } = await supabase.functions.invoke("ai-incidents");
        if (error || !data?.top_categories) return;

        const liveData = data.top_categories.map((cat: { name: string; count: number }) => {
          const meta = CATEGORY_META[cat.name] || { group: cat.name, crisis: "Human rights" };
          return {
            group: meta.group,
            incidents: cat.count,
            crisis: meta.crisis,
            crisisLink: "/crisis",
          };
        });

        if (liveData.length > 0) {
          setVulnData(liveData);
          setTotalIncidents(data.total_incidents);
          setVulnerablePercent(data.vulnerable_percent);
          if (data.vulnerable_incidents != null) setVulnerableIncidents(data.vulnerable_incidents);
          if (data.trend) setTrend(data.trend);
          if (data.recent_12m_count != null) setRecent12m(data.recent_12m_count);
          if (data.last_fetched_at) setLastFetched(data.last_fetched_at);
          setIsLive(true);
        }
      } catch (err) {
        console.error("[IncidentsPage] Failed to fetch live data:", err);
        // Keep fallback data
      }
    }
    fetchLiveData();
  }, []);

  const maxIncidents = Math.max(...vulnData.map((d) => d.incidents));
  return (
    <>
      <Seo
        title="Why We Built This — AI Incident Archive | Hold for Jesus"
        description="Nearly 40% of documented AI incidents harm vulnerable populations. Explore real AI failures mapped to communities represented on our Crisis Resources page."
        path="/incidents"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ═══ Header ═══ */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              AI Incident Archive
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-special-elite">
            Why We Built This
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The prayer hotline is satire. The numbers behind it are not.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Data status: {isLive ? "Live summary from AIID pipeline" : "Fallback snapshot"}
          </p>
        </motion.div>

        {/* ═══ Context banner ═══ */}
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
            , a satirical AI prayer hotline. The data here is real. The hotline is not.
          </p>
        </motion.div>

        {/* ═══ Summary Card ═══ */}
        <motion.div
          className="bg-card border border-border rounded-lg p-5 sm:p-6 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="grid gap-4 sm:grid-cols-3 mb-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground font-mono">
                {totalIncidents.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Documented Incidents
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive font-mono">{vulnerablePercent}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Affect Vulnerable Populations
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground font-mono">
                {vulnerableIncidents.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Vulnerable-Population Incidents
              </p>
            </div>
          </div>

          {trend && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
              <span>{trend === "increasing" ? "📈" : trend === "decreasing" ? "📉" : "➡️"}</span>
              <span>
                Incident reporting is{" "}
                <strong
                  className={
                    trend === "increasing"
                      ? "text-destructive"
                      : trend === "decreasing"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                  }
                >
                  {trend}
                </strong>
                {recent12m != null && <> ({recent12m} incidents in last 12 months)</>}
              </span>
            </div>
          )}

          {/* Top affected groups */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Most affected populations
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {vulnData.slice(0, 8).map((row) => {
                const pct =
                  totalIncidents > 0 ? ((row.incidents / totalIncidents) * 100).toFixed(1) : "0";
                return (
                  <div key={row.group} className="flex items-center gap-2 text-xs">
                    <span className="text-foreground font-medium truncate">{row.group}</span>
                    <span className="text-muted-foreground ml-auto shrink-0 font-mono">
                      {row.incidents}
                    </span>
                    <span className="text-muted-foreground/60 text-[10px] shrink-0">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              Source:{" "}
              <a
                href="https://incidentdatabase.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                AI Incident Database
              </a>
              {lastFetched && <> · Updated: {new Date(lastFetched).toLocaleDateString()}</>}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {isLive ? "Live" : "Snapshot"}
            </span>
          </div>
        </motion.div>

        {/* ═══ The Evidence ═══ */}
        <motion.section
          className="space-y-4 mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-foreground font-special-elite">Who Gets Harmed</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              The{" "}
              <a
                href="https://incidentdatabase.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                AI Incident Database <ExternalLink className="h-3 w-3" />
              </a>{" "}
              is a curated catalog of real-world AI failures, maintained by the Responsible AI
              Collaborative. Of the {totalIncidents.toLocaleString()} incidents it has documented,
              nearly{" "}
              <strong className="text-foreground">
                {vulnerablePercent}% involve harm to vulnerable populations
              </strong>{" "}
              — children, racial and ethnic minorities, patients, the elderly, people with
              disabilities, and people living in poverty.
            </p>
            <p>
              These are the same communities represented on our{" "}
              <Link to="/crisis" className="text-primary hover:underline font-medium">
                Crisis Resources
              </Link>{" "}
              page. The table below maps each affected group to the number of documented incidents
              and the corresponding resource we provide.
            </p>
          </div>

          {/* Vulnerability table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Desktop header — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-[1fr_60px_180px] gap-x-4 px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Affected Population
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">
                Incidents
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">
                Related Resource
              </span>
            </div>
            {vulnData.map((row, i) => (
              <motion.div
                key={row.group}
                className="px-4 py-3 sm:py-2.5 border-b border-border/50 last:border-b-0 sm:grid sm:grid-cols-[1fr_60px_180px] sm:gap-x-4 sm:items-center"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">{row.group}</p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-destructive/60 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(row.incidents / maxIncidents) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.03 }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between sm:contents mt-1.5 sm:mt-0">
                  <span className="text-xs font-mono text-foreground tabular-nums sm:text-right">
                    {row.incidents}
                    <span className="sm:hidden text-muted-foreground font-sans"> incidents</span>
                  </span>
                  <Link
                    to={row.crisisLink}
                    className="text-[11px] text-primary hover:underline sm:text-right"
                  >
                    {row.crisis} →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══ Incident Browser ═══ */}
        <motion.section
          className="space-y-4 mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-foreground font-special-elite">Incident Archive</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Individual incidents from the AIID involving vulnerable populations. Search by keyword
            or filter by affected group.
          </p>
          <IncidentBrowser />
        </motion.section>

        <motion.section
          className="space-y-4 mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-foreground font-special-elite">
            What This Project Asks
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              What happens when systems meant to help people fail them?
            </strong>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The prayer hotline explores that question through comedy — a divine helpdesk where
            you're always on hold. The{" "}
            <Link to="/observatory" className="text-primary hover:underline font-medium">
              Global Pain Index
            </Link>{" "}
            measures it through data — real-time indicators of poverty, hunger, displacement, and
            conflict. This page documents it through evidence — specific, recorded cases where AI
            caused harm to the people least equipped to absorb it.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Together, these layers form a single argument: that the gap between what systems promise
            and what they deliver is worth examining — and worth laughing about, honestly.
          </p>

          {/* Four layers */}
          <div className="grid gap-2 sm:grid-cols-2">
            {LAYERS.map((l) => (
              <div
                key={l.layer}
                className="flex items-start gap-3 bg-card border border-border/50 rounded-lg p-3"
              >
                <span className="text-lg">{l.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{l.layer}</p>
                  <p className="text-[11px] text-muted-foreground">{l.what}</p>
                  <p className="text-[10px] text-muted-foreground/60 italic">{l.tone}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ═══ Data Methodology ═══ */}
        <motion.section
          className="space-y-4 mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-foreground font-special-elite">
            Data & Methodology
          </h2>
          <div className="bg-card border border-border rounded-lg p-5 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Source:</strong>{" "}
              <a
                href="https://incidentdatabase.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                AI Incident Database <ExternalLink className="h-3 w-3" />
              </a>{" "}
              — incidents are reported, reviewed, and published by the Responsible AI Collaborative.
              The database is curated, not exhaustive.
            </p>
            <p>
              <strong className="text-foreground">Vulnerability classification:</strong> We applied
              keyword-based mapping to incident descriptions and harmed-party fields to identify
              which incidents affected vulnerable populations. This classification is our own — not
              an official AIID taxonomy.
            </p>
            <p>
              <strong className="text-foreground">Limitations:</strong> The AIID is not a census of
              all AI systems or a statistical sample. The {vulnerablePercent}% figure represents the
              proportion of <em>recorded incidents</em> involving vulnerable populations — not a
              probability that any given AI system will cause harm.
            </p>
            <p>
              <strong className="text-foreground">Admissibility:</strong> Following the same
              methodology as our Global Pain Index, we classify the AIID source data as{" "}
              <span
                className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "hsl(var(--badge-authoritative) / 0.15)",
                  color: "hsl(var(--badge-authoritative-fg))",
                }}
              >
                Authoritative
              </span>{" "}
              and our vulnerability layer as{" "}
              <span
                className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "hsl(var(--badge-derived) / 0.15)",
                  color: "hsl(var(--badge-derived-fg))",
                }}
              >
                Derived
              </span>
              .
            </p>
          </div>
        </motion.section>

        {/* ═══ Why Both Tones ═══ */}
        <motion.section
          className="space-y-4 mb-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-foreground font-special-elite">
            Why Satire and Sincerity Belong Together
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <strong className="text-foreground">
                The comedy works <em>because</em> the data is real.
              </strong>
            </p>
            <p>
              A prayer hotline where God puts you on hold is funny precisely because real systems —
              healthcare algorithms, predictive policing tools, content recommendation engines — are
              already putting vulnerable people on hold. The joke isn't about faith. It's about the
              distance between what technology promises and what it delivers.
            </p>
            <p>
              The data pages exist as moral counterweights. The numbers make the satire necessary.
              The resources make it responsible. And the evidence makes it honest.
            </p>
          </div>
        </motion.section>

        {/* ═══ Closing ═══ */}
        <motion.div
          className="text-center py-6 space-y-4 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground italic max-w-lg mx-auto leading-relaxed">
            The satire names the absurdity. The data measures its cost. The resources offer a way
            through. That's the whole project.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
            <Link
              to="/crisis"
              className="text-primary font-semibold hover:underline transition-colors"
            >
              📞 Crisis Resources
            </Link>
            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
            <Link
              to="/observatory"
              className="text-primary font-semibold hover:underline transition-colors"
            >
              🌍 Global Pain Index
            </Link>
            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              🎭 Back to the Hotline
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
