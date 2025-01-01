import { motion } from "framer-motion";
import GlobalPrayerBoard from "@/components/GlobalPrayerBoard";
import PrayerWall from "@/components/PrayerWall";
import Seo from "@/components/Seo.tsx";

const CommunityPage = () => {
  return (
    <>
      <Seo
        title="Community — Prayer Wall & Global Board"
        description="Anonymous Prayer Wall and Global Prayer Board. Light candles, share reflections, and add your voice."
        path="/community"
      />

      <div className="flex flex-col">
        <motion.section
          className="flex flex-col items-center px-6 pt-10 pb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-primary uppercase tracking-wider font-special-elite">
            🕯️ Community Board
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Quiet reflection, anonymous prayers, and global causes. No accounts, minimal data.
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1.5 max-w-sm italic">
            This is a sincere space — not part of the satire. What you share here is treated with
            respect.
          </p>
        </motion.section>

        <section className="flex justify-center px-6 py-8">
          <PrayerWall />
        </section>

        <div className="flex items-center justify-center gap-4 px-10 py-2">
          <motion.div
            className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-border"
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.span
            className="text-muted-foreground/40 text-lg"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            ✦
          </motion.span>
          <motion.div
            className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-border"
            initial={{ scaleX: 0, originX: 1 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <section className="flex justify-center px-6 py-8">
          <GlobalPrayerBoard />
        </section>
      </div>
    </>
  );
};

export default CommunityPage;
