import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface PrayWithCallerButtonProps {
  /** Unique key for this prayer response, e.g. a hash or timestamp */
  ticketId: string;
}

function getStorageKey(ticketId: string) {
  return `pray-voices:${ticketId}`;
}

function getJoinedKey(ticketId: string) {
  return `pray-joined:${ticketId}`;
}

const PrayWithCallerButton = ({ ticketId }: PrayWithCallerButtonProps) => {
  const [count, setCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(ticketId));
    if (stored) setCount(parseInt(stored, 10) || 0);
    const joined = localStorage.getItem(getJoinedKey(ticketId));
    if (joined === "true") setHasJoined(true);
  }, [ticketId]);

  const handlePray = useCallback(() => {
    if (hasJoined) return;
    const newCount = count + 1;
    setCount(newCount);
    setHasJoined(true);
    localStorage.setItem(getStorageKey(ticketId), String(newCount));
    localStorage.setItem(getJoinedKey(ticketId), "true");
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 5000);
  }, [hasJoined, count, ticketId]);

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <motion.div
        whileHover={{ scale: hasJoined ? 1 : 1.05 }}
        whileTap={{ scale: hasJoined ? 1 : 0.95 }}
      >
        <Button variant="outline" onClick={handlePray} disabled={hasJoined} className="gap-2">
          🙏 {hasJoined ? "Voice Added" : "Pray With This Caller"}
        </Button>
      </motion.div>

      {count > 0 && (
        <motion.p
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          🙏 {count} voice{count !== 1 ? "s" : ""} joined
        </motion.p>
      )}

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className="max-w-xs text-center text-xs text-muted-foreground italic leading-relaxed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            📞 Your voice has been added to this request.
            <br />
            The Heavenly Switchboard assures us that many voices together rarely hurt.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrayWithCallerButton;
