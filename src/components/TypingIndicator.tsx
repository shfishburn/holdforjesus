import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

/** Procedural typewriter clacking via Web Audio API */
function startTypewriterSound(ctx: AudioContext): () => void {
  let stopped = false;
  const schedule = () => {
    if (stopped) return;

    const now = ctx.currentTime;
    // Short noise burst = key clack
    const bufferSize = ctx.sampleRate * 0.03; // 30ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass to make it sound more like a key
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800 + Math.random() * 1200;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = 0.08 + Math.random() * 0.06;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);

    // Random interval between keystrokes: 50-120ms
    const delay = 50 + Math.random() * 70;
    setTimeout(schedule, delay);
  };

  schedule();
  return () => {
    stopped = true;
  };
}

const TypingIndicator = () => {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const ctx = new AudioContext();
      stopRef.current = startTypewriterSound(ctx);
      return () => {
        stopRef.current?.();
        stopRef.current = null;
        ctx.close();
      };
    } catch {
      // Audio not supported
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
      <motion.div
        className="text-5xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        👼
      </motion.div>
      <p className="text-xl text-primary font-bold font-special-elite">The angel is typing…</p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
