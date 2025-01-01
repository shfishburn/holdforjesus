import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STAMPS = [
  { title: "🛡️ Satan-Proof Soul™", subtitle: "The Devil can't get in — guaranteed since Eden" },
  { title: "✨ Miracle Pending™", subtitle: "Your request is in the queue" },
  { title: "🕊️ Grace Covered™", subtitle: "Pre-approved for mercy since day one" },
  { title: "🔮 Dept. of Mysterious Ways™", subtitle: "Resolution pending — as always" },
];

const SatanProofSole = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * STAMPS.length));

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % STAMPS.length);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const stamp = STAMPS[index];

  return (
    <motion.div
      className="flex flex-col items-center gap-1 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className="relative px-6 py-3 border-2 border-dashed border-muted-foreground/30 rounded-lg">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-background px-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
            Certified
          </span>
        </div>
        <motion.div
          key={index}
          className="text-center space-y-0.5"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-special-elite">
            {stamp.title}
          </p>
          <p className="text-[10px] text-muted-foreground/60 italic">{stamp.subtitle}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SatanProofSole;
