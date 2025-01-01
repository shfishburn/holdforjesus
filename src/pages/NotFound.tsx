import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import SatanProofSole from "@/components/SatanProofSole";
import Seo from "@/components/Seo.tsx";

const NotFound = () => {
  const location = useLocation();

  return (
    <>
      <Seo
        title="404 / 666 — Page Not Found"
        description="The requested page does not exist. Return to Hold for Jesus home or visit crisis resources for real support."
        path={location.pathname}
        noindex
      />

      <div className="flex flex-col items-center justify-center gap-6 px-6 py-20">
        <motion.div
          className="text-8xl"
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        >
          😈
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-bold text-destructive font-special-elite">666</h1>

        <p className="text-xl text-muted-foreground text-center max-w-md font-special-elite">
          The Devil intercepted your call. This line doesn't exist.
        </p>

        <p className="text-sm text-muted-foreground italic text-center max-w-sm">
          "The greatest trick the Devil ever pulled was convincing the world this page existed."
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors"
          >
            📞 Return to the Hotline
          </Link>
        </motion.div>

        <SatanProofSole />
      </div>
    </>
  );
};

export default NotFound;
