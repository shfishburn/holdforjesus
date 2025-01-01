import { Link } from "react-router-dom";
import SatanProofSole from "@/components/SatanProofSole";
import { getFaith } from "@/lib/faiths";
import { usePreferencesStore } from "@/stores/usePreferencesStore";

const Footer = () => {
  const { faithId } = usePreferencesStore();
  const faith = getFaith(faithId);

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <SatanProofSole />

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link
            to="/about"
            onClick={() => window.scrollTo({ top: 0 })}
            className="hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            to="/transparency"
            onClick={() => window.scrollTo({ top: 0 })}
            className="hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            to="/privacy"
            onClick={() => window.scrollTo({ top: 0 })}
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            onClick={() => window.scrollTo({ top: 0 })}
            className="hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </nav>

        <p className="text-center text-[10px] text-muted-foreground max-w-sm">
          © AD 0 – Eternity · {faith.hotlineName} · Not affiliated with any deity, religion, or
          celestial bureaucracy. For entertainment purposes only. If you are in crisis, please visit
          our{" "}
          <Link to="/crisis" className="underline hover:text-foreground">
            crisis resources
          </Link>
          .
        </p>
      </div>
    </footer>
  );
};

export default Footer;
