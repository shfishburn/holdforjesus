import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type MusicStyle, useHoldMusic } from "@/hooks/useHoldMusic";
import type { FaithConfig } from "@/lib/faiths";

const MUSIC_STYLES: { id: MusicStyle; label: string; emoji: string }[] = [
  { id: "harps", label: "Harps", emoji: "🎵" },
  { id: "gospel", label: "Gospel", emoji: "🎶" },
  { id: "chant", label: "Gregorian", emoji: "🎼" },
];

const HOLD_DURATION_MS = 6000;
const MESSAGE_INTERVAL_MS = 2500;
const DEVIL_DELAY_MS = 3000;
const DEVIL_DURATION_MS = 2500;
const DEVIL_CHANCE = 0.4;

interface HoldScreenProps {
  onComplete: () => void;
  faith: FaithConfig;
}

// Eased progress: fast start, stall in the middle, quick finish
function ease(t: number): number {
  if (t < 0.3) return t * 1.6;
  if (t < 0.7) return 0.48 + (t - 0.3) * 0.65;
  return 0.74 + (t - 0.7) * 0.867;
}

const HoldScreen = ({ onComplete, faith }: HoldScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");
  const [muted, setMuted] = useState(false);
  const [musicStyle, setMusicStyle] = useState<MusicStyle>("harps");
  const [devilAppeared, setDevilAppeared] = useState(false);

  useHoldMusic(!muted, musicStyle);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % faith.holdMessages.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(msgInterval);
  }, [faith.holdMessages.length]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : `${prev}.`));
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const linear = Math.min(elapsed / HOLD_DURATION_MS, 1);
      const pct = Math.min(ease(linear) * 100, 100);
      setProgress(pct);
      if (linear >= 1) {
        clearInterval(tick);
        onComplete();
      }
    }, 100);
    return () => clearInterval(tick);
  }, [onComplete]);

  // Devil easter egg — random chance of appearance
  useEffect(() => {
    const devilTimer = setTimeout(() => {
      if (Math.random() < DEVIL_CHANCE) {
        setDevilAppeared(true);
        setTimeout(() => setDevilAppeared(false), DEVIL_DURATION_MS);
      }
    }, DEVIL_DELAY_MS);
    return () => clearTimeout(devilTimer);
  }, []);

  return (
    <section
      aria-label="Please hold"
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
    >
      <motion.div
        className="text-6xl"
        animate={{
          rotate: [0, 15, -15, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        📞
      </motion.div>

      <h2 className="text-2xl md:text-3xl font-bold text-primary font-special-elite">
        {faith.holdTitle}
        {dots}
      </h2>

      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          className="text-lg text-muted-foreground text-center max-w-md italic"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          "{faith.holdMessages[messageIndex]}"
        </motion.p>
      </AnimatePresence>

      <div
        className="w-full max-w-xs"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Progress value={progress} className="h-3" />
      </div>

      <motion.div
        className="flex items-center gap-2 text-xs text-muted-foreground"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🎵 ♪{" "}
        <em>
          elevator {musicStyle === "harps" ? "harp" : musicStyle === "gospel" ? "gospel" : "chant"}{" "}
          intensifies
        </em>{" "}
        ♪ 🎵
      </motion.div>

      <div className="flex items-center gap-2" role="radiogroup" aria-label="Hold music style">
        {MUSIC_STYLES.map((ms) => (
          <Button
            key={ms.id}
            variant={musicStyle === ms.id ? "default" : "outline"}
            size="sm"
            onClick={() => setMusicStyle(ms.id)}
            className="text-xs gap-1"
            aria-pressed={musicStyle === ms.id}
          >
            {ms.emoji} {ms.label}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMuted((m) => !m)}
        className="text-xs text-muted-foreground"
        aria-label={muted ? "Unmute hold music" : "Mute hold music"}
      >
        {muted ? "🔇 Unmute hold music" : "🔊 Mute hold music"}
      </Button>

      {/* Devil easter egg */}
      <AnimatePresence>
        {devilAppeared && (
          <motion.div
            className="fixed bottom-8 right-8 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center max-w-xs"
            initial={{ opacity: 0, x: 100, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: 100, rotate: -10 }}
            transition={{ type: "spring", stiffness: 300 }}
            role="alert"
          >
            <motion.div
              className="text-4xl mb-1"
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              😈
            </motion.div>
            <p className="text-xs text-destructive font-bold font-special-elite">
              The Devil tried to intercept your call!
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Connection secured. Satan-Proof Sole™ activated.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HoldScreen;
