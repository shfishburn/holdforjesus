import { motion } from "framer-motion";
import type { FaithConfig } from "@/lib/faiths";

interface VerseOfTheDayProps {
  faith: FaithConfig;
}

const VerseOfTheDay = ({ faith }: VerseOfTheDayProps) => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const verse = faith.verses[dayOfYear % faith.verses.length];

  return (
    <motion.div
      className="w-full max-w-lg bg-card/60 border border-border rounded-lg p-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
        {faith.emoji} Wisdom of the Day
      </div>
      <p className="text-sm text-foreground italic leading-relaxed">"{verse.text}"</p>
      <p className="text-xs text-muted-foreground mt-1 font-semibold">— {verse.ref}</p>
    </motion.div>
  );
};

export default VerseOfTheDay;
