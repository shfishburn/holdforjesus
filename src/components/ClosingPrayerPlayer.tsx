import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { type PlaybackState, useTtsPlayer } from "@/hooks/useTtsPlayer";

const STATUS_MESSAGES: Record<PlaybackState, string> = {
  idle: "",
  loading: "📞 Operator offering a closing prayer…",
  playing: "📞 Closing prayer…",
  done: "📞 Prayer concluded.",
  error: "📞 Could not play the closing prayer. Please try again.",
};

interface ClosingPrayerPlayerProps {
  closingPrayer: string;
  department: string;
  faith: string;
}

const ClosingPrayerPlayer = ({ closingPrayer, department, faith }: ClosingPrayerPlayerProps) => {
  const { state, prefetching, prefetchReady, handlePlay, handleStop } = useTtsPlayer({
    text: closingPrayer,
    department,
    faith,
    type: "prayer",
  });

  const statusMsg = STATUS_MESSAGES[state];

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex gap-2">
        {state === "playing" ? (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={handleStop}
              className="gap-2"
              aria-label="Stop closing prayer"
            >
              🔇 Stop Prayer
            </Button>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
            <Button
              variant="outline"
              onClick={handlePlay}
              disabled={state === "loading"}
              className={`gap-2 relative overflow-hidden ${prefetching && state === "idle" ? "animate-pulse" : ""}`}
              aria-label={
                state === "done" ? "Replay closing prayer audio" : "Hear closing prayer audio"
              }
            >
              🙏 {state === "done" ? "Replay Closing Prayer" : "Hear Closing Prayer"}
              {prefetching && state === "idle" && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent animate-[shimmer_1.5s_infinite] pointer-events-none" />
              )}
            </Button>
            {prefetchReady && state === "idle" && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm"
                aria-label="Audio ready"
              >
                ✓
              </motion.span>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {statusMsg && (
          <motion.p
            key={state}
            className="text-xs text-muted-foreground italic"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            aria-live="polite"
          >
            {statusMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ClosingPrayerPlayer;
