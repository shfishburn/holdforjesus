import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isReactSnap, supabase } from "@/integrations/supabase/client";

export default function SufferingTicker() {
  const [score, setScore] = useState<number | null>(null);
  const [_updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (isReactSnap) return;

    async function fetch() {
      try {
        // Try cached DB first for instant load
        const { data } = await supabase
          .from("suffering_index")
          .select("composite_score, computed_at")
          .order("computed_at", { ascending: false })
          .limit(1)
          .single();
        if (data) {
          setScore(data.composite_score);
          setUpdatedAt(data.computed_at);
        }
      } catch {
        // silently fail — ticker is non-critical
      }
    }
    fetch();
  }, []);

  if (score === null) return null;

  return (
    <Link to="/observatory">
      <motion.div
        className="w-full max-w-lg bg-card/60 border border-border/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors cursor-pointer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2.5">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Global Pain Index
            </p>
            <p className="text-[10px] text-muted-foreground/60">Live data · World Bank</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "'Courier Prime', monospace" }}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted-foreground ml-1">/100</span>
        </div>
      </motion.div>
    </Link>
  );
}
