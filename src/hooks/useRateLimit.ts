import { useCallback, useRef, useState } from "react";

const RATE_LIMIT = 5;
const WINDOW_MS = 60_000; // 1 minute

export function useRateLimit() {
  const timestamps = useRef<number[]>([]);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    // Prune old timestamps
    timestamps.current = timestamps.current.filter((t) => now - t < WINDOW_MS);

    if (timestamps.current.length >= RATE_LIMIT) {
      const oldest = timestamps.current[0];
      setCooldownEnd(oldest + WINDOW_MS);
      return false;
    }

    timestamps.current.push(now);
    setCooldownEnd(null);
    return true;
  }, []);

  const secondsRemaining =
    cooldownEnd && cooldownEnd > Date.now() ? Math.ceil((cooldownEnd - Date.now()) / 1000) : 0;

  return { checkLimit, secondsRemaining, isLimited: secondsRemaining > 0 };
}
