import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DarkModeToggle from "@/components/DarkModeToggle";
import FontSizeToggle from "@/components/FontSizeToggle";
import { getFaith } from "@/lib/faiths";
import { usePreferencesStore } from "@/stores/usePreferencesStore";

const SATIRE_NAV = [
  { to: "/pray", label: "Hotline" },
  { to: "/history", label: "History" },
  { to: "/community", label: "Community" },
];

const SERIOUS_NAV = [
  { to: "/crisis", label: "Crisis Help" },
  { to: "/observatory", label: "Pain Index" },
  { to: "/incidents", label: "AI Incidents" },
];

const Header = () => {
  const location = useLocation();
  const { faithId } = usePreferencesStore();
  const faith = getFaith(faithId);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <motion.header
      className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      {/* Row 1: Logo (centered on desktop, space-between on mobile) */}
      <div className="max-w-4xl mx-auto px-4 pt-3 pb-1.5 flex items-center justify-between md:justify-center relative">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0 })}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">{faith.emoji}</span>
          <span className="text-base font-bold text-primary font-special-elite">
            {faith.hotlineName}
          </span>
        </Link>

        {/* Desktop: dark mode positioned absolutely to not break centering */}
        <div className="hidden md:flex items-center gap-1 absolute right-4 top-1/2 -translate-y-1/2">
          <FontSizeToggle />
          <DarkModeToggle />
        </div>

        {/* Mobile: dark mode + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <FontSizeToggle />
          <DarkModeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Row 2: Navigation (desktop, centered) */}
      <nav className="hidden md:flex max-w-4xl mx-auto px-4 pb-2.5 items-center justify-center gap-1">
        {SATIRE_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => window.scrollTo({ top: 0 })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isActive(item.to)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <span className="w-px h-3.5 bg-border mx-1" />
        {SERIOUS_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => window.scrollTo({ top: 0 })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isActive(item.to)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-4 pt-1">
                Satire
              </p>
              {SATIRE_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="h-px bg-border mx-4 my-1" />
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-4 pt-1">
                Sincerity
              </p>
              {SERIOUS_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
