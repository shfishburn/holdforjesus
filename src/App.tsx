import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { Toaster } from "@/components/ui/toaster.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { isReactSnap } from "@/integrations/supabase/client.ts";
import { trackPageView } from "@/lib/analytics.ts";
import { useFontSizeStore } from "@/stores/useFontSizeStore.ts";
import { usePreferencesStore } from "@/stores/usePreferencesStore.ts";
import AnalyticsConsentBanner from "./components/AnalyticsConsentBanner.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import Footer from "./components/Footer.tsx";
import Header from "./components/Header.tsx";
import LandingPage from "./pages/LandingPage.tsx";

// Lazy-loaded routes for code splitting
const PrayerPage = lazy(() => import("./pages/PrayerPage.tsx"));
const CrisisPage = lazy(() => import("./pages/CrisisPage.tsx"));
const CommunityPage = lazy(() => import("./pages/CommunityPage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.tsx"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));
const ObservatoryPage = lazy(() => import("./pages/ObservatoryPage.tsx"));
const TransparencyPage = lazy(() => import("./pages/TransparencyPage.tsx"));
const IncidentsPage = lazy(() => import("./pages/IncidentsPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex-1 flex items-center justify-center py-20">
    <div className="text-sm text-muted-foreground animate-pulse">Connecting to the hotline…</div>
  </div>
);

const AnalyticsTracker = () => {
  const location = useLocation();
  const analyticsConsent = usePreferencesStore((s) => s.analyticsConsent);

  useEffect(() => {
    if (!analyticsConsent) return;
    // Delay one frame so react-helmet-async can flush <title> before we read it
    const id = requestAnimationFrame(() => {
      const pagePath = `${location.pathname}${location.search}`;
      trackPageView(pagePath);
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.search, analyticsConsent]);

  return null;
};

const App = () => {
  const fontSize = useFontSizeStore((s) => s.fontSize);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("font-sm", "font-default", "font-lg");
    root.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnalyticsTracker />
              <div className="min-h-screen flex flex-col">
                <AnalyticsConsentBanner />
                <Header />
                <main id="main-content" className="flex-1">
                  <ErrorBoundary>
                    <Suspense fallback={<PageFallback />}>
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/pray" element={<PrayerPage />} />
                        <Route path="/community" element={<CommunityPage />} />
                        <Route path="/crisis" element={<CrisisPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/observatory" element={<ObservatoryPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/transparency" element={<TransparencyPage />} />
                        <Route path="/incidents" element={<IncidentsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
                <Footer />
              </div>
              {!isReactSnap && <Analytics />}
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
