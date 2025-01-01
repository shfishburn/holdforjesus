import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  isSupabaseConfigured,
  missingSupabaseEnvMessage,
  supabase,
} from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";

const SESSION_ID = getSessionId();

const REACTIONS = [
  { type: "candle", emoji: "🕯️", label: "Light a Candle" },
  { type: "pray", emoji: "🙏", label: "Pray" },
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "leaf", emoji: "🌿", label: "Peace" },
] as const;

const CANDLE_MESSAGES = [
  "Your candle has been added.\nMay the light travel farther than the worry.",
  "A candle has been lit.\nSometimes light is the only prayer that fits.",
  "Your light joins the others.\nSmall flames, together, illuminate.",
];

const PROFANITY_PATTERNS =
  /\b(fuck|shit|damn|ass|bitch|cunt|dick|cock|pussy|nigger|faggot|retard)\b/i;
const CRISIS_PATTERNS =
  /\b(kill\s*(my|him|her|them)?self|end\s*my\s*life|want\s*to\s*die|suicid|self[- ]?harm|no\s*reason\s*to\s*live|hopeless)\b/i;

interface WallPrayer {
  id: string;
  prayer_text: string;
  category: string | null;
  faith: string | null;
  reactions_pray: number;
  reactions_heart: number;
  reactions_leaf: number;
  reactions_candle: number;
  created_at: string;
}

const PrayerWall = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [prayers, setPrayers] = useState<WallPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [reactedSet, setReactedSet] = useState<Set<string>>(new Set());
  const [candleFlash, setCandleFlash] = useState<string | null>(null);
  const [candlesToday, setCandlesToday] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchCandlesToday = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Prayer wall is unavailable until Supabase environment variables are configured.");
      setLoading(false);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from("prayer_wall_reactions")
      .select("*", { count: "exact", head: true })
      .eq("reaction_type", "candle")
      .gte("created_at", todayStart.toISOString());

    if (countError) {
      setError("Unable to load live candle count right now.");
      return;
    }

    if (count !== null) setCandlesToday(count);
  }, []);

  const fetchPrayers = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Prayer wall is unavailable until Supabase environment variables are configured.");
      setLoading(false);
      return;
    }

    const { data, error: prayersError } = await supabase
      .from("prayer_wall")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (prayersError) {
      setError("Unable to load prayers right now. Please try again later.");
      setLoading(false);
      return;
    }

    if (data) {
      setPrayers(data as WallPrayer[]);
      setError(null);
    }

    setLoading(false);
  }, []);

  const fetchMyReactions = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { data, error: reactionsError } = await supabase
      .from("prayer_wall_reactions")
      .select("prayer_id, reaction_type")
      .eq("session_id", SESSION_ID);

    if (reactionsError) return;

    if (data)
      setReactedSet(
        new Set(
          data.map(
            (r: { prayer_id: string; reaction_type: string }) =>
              `${r.prayer_id}:${r.reaction_type}`,
          ),
        ),
      );
  }, []);

  useEffect(() => {
    fetchPrayers();
    fetchMyReactions();
    fetchCandlesToday();
  }, [fetchPrayers, fetchMyReactions, fetchCandlesToday]);

  const handleSubmit = async () => {
    if (!isSupabaseConfigured) {
      toast({
        title: "Service unavailable",
        description: missingSupabaseEnvMessage,
        variant: "destructive",
      });
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 300) {
      toast({
        title: "Too long",
        description: "Keep it under 300 characters.",
        variant: "destructive",
      });
      return;
    }
    if (CRISIS_PATTERNS.test(trimmed)) {
      toast({
        title: "Immediate help available",
        description: "If this is urgent, call or text 988 now. Opening crisis resources.",
        variant: "destructive",
      });
      navigate("/crisis");
      return;
    }
    if (PROFANITY_PATTERNS.test(trimmed)) {
      toast({
        title: "Content filtered",
        description: "Please keep your prayer respectful.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("prayer_wall").insert({ prayer_text: trimmed });
    if (error) {
      toast({
        title: "Error",
        description: "Couldn't share your prayer. Try again.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Shared 🙏", description: "Your prayer is on the wall." });
      setText("");
      setShowForm(false);
      fetchPrayers();
    }
    setSubmitting(false);
  };

  const getReactionCount = (prayer: WallPrayer, reactionType: string): number => {
    const key = `reactions_${reactionType}` as keyof WallPrayer;
    return (prayer[key] as number) || 0;
  };

  const handleReact = async (prayerId: string, reactionType: string) => {
    if (!isSupabaseConfigured) {
      toast({
        title: "Service unavailable",
        description: "Reactions are unavailable until backend configuration is restored.",
        variant: "destructive",
      });
      return;
    }

    const key = `${prayerId}:${reactionType}`;
    if (reactedSet.has(key)) return;

    // Optimistic update
    const prevReactedSet = new Set(reactedSet);
    const prevPrayers = [...prayers];
    const prevCandlesToday = candlesToday;

    setReactedSet((prev) => new Set(prev).add(key));
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === prayerId
          ? { ...p, [`reactions_${reactionType}`]: getReactionCount(p, reactionType) + 1 }
          : p,
      ),
    );
    if (reactionType === "candle") {
      setCandleFlash(prayerId);
      setCandlesToday((c) => c + 1);
      setTimeout(() => setCandleFlash(null), 3500);
    }

    const { error: insertError } = await supabase
      .from("prayer_wall_reactions")
      .insert({ prayer_id: prayerId, session_id: SESSION_ID, reaction_type: reactionType });

    if (insertError) {
      // Revert optimistic update on failure
      setReactedSet(prevReactedSet);
      setPrayers(prevPrayers);
      setCandlesToday(prevCandlesToday);
      toast({
        title: "Error",
        description: "Couldn't save your reaction. Try again.",
        variant: "destructive",
      });
      return;
    }

    await supabase.rpc("increment_prayer_reaction", {
      p_prayer_id: prayerId,
      p_reaction_type: reactionType,
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      className="w-full max-w-lg space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wider font-special-elite">
          🕯️ Prayer Wall
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs"
        >
          {showForm ? "Cancel" : "✏️ Share a Prayer"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Anonymous prayers shared by visitors. No accounts, no tracking.
        <br />
        <span className="text-muted-foreground/60">Prayers fade after 24 hours.</span>
      </p>

      <motion.div
        className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary/5 border border-primary/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-lg">🕯️</span>
        <span className="text-sm font-semibold text-foreground">
          {candlesToday.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">
          candle{candlesToday !== 1 ? "s" : ""} lit today
        </span>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="space-y-3 bg-card border border-border rounded-lg p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              placeholder="Share a prayer or reflection anonymously…"
              className="resize-none text-sm"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{text.length}/300</span>
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !text.trim()}>
                {submitting ? "Sharing…" : "Share Anonymously"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">
          Loading prayers…
        </div>
      ) : error ? (
        <div className="text-center py-8 text-sm text-destructive">{error}</div>
      ) : prayers.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No prayers yet. Be the first to share.
        </div>
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <motion.div
              key={prayer.id}
              className="bg-card border border-border rounded-lg p-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm text-foreground leading-relaxed italic">
                "{prayer.prayer_text}"
              </p>
              {(prayer.reactions_candle || 0) > 0 && (
                <p className="text-[10px] text-muted-foreground/70 font-mono">
                  🕯️ {prayer.reactions_candle} candle{prayer.reactions_candle !== 1 ? "s" : ""} lit
                </p>
              )}
              <AnimatePresence>
                {candleFlash === prayer.id && (
                  <motion.div
                    className="bg-primary/5 border border-primary/20 rounded-md p-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <p className="text-[10px] text-foreground/70 whitespace-pre-line leading-relaxed text-center font-special-elite">
                      {CANDLE_MESSAGES[Math.floor(Math.random() * CANDLE_MESSAGES.length)]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Anonymous • {timeAgo(prayer.created_at)}
                </span>
                <div className="flex items-center gap-1">
                  {REACTIONS.map((r) => {
                    const count = getReactionCount(prayer, r.type);
                    const reacted = reactedSet.has(`${prayer.id}:${r.type}`);
                    return (
                      <button
                        key={r.type}
                        type="button"
                        onClick={() => handleReact(prayer.id, r.type)}
                        disabled={reacted}
                        className={`flex items-center gap-0.5 text-xs px-2 py-1 rounded-full border transition-colors ${reacted ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                        aria-label={`${r.label} (${count})`}
                      >
                        <span>{r.emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PrayerWall;
