import { motion } from "framer-motion";
import { FAITHS, type FaithId } from "@/lib/faiths";

interface FaithSelectorProps {
  value: FaithId;
  onChange: (faith: FaithId) => void;
}

const FaithSelector = ({ value, onChange }: FaithSelectorProps) => {
  return (
    <motion.div
      className="w-full max-w-2xl space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center block">
        Pick Your Doctrinal Foundation
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FAITHS.map((faith) => (
          <motion.button
            key={faith.id}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(faith.id)}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
              value === faith.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
            aria-label={`Select ${faith.name} (${faith.phoneNumber})`}
            aria-pressed={value === faith.id}
          >
            <span className="text-2xl">{faith.emoji}</span>
            <span className="text-xs font-bold">{faith.name}</span>
            <span className="text-[10px] opacity-70">{faith.phoneNumber}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default FaithSelector;
