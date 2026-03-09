import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { usePreferencesStore } from "@/stores/usePreferencesStore.ts";

const AnalyticsConsentBanner = () => {
  const analyticsConsentPrompted = usePreferencesStore((s) => s.analyticsConsentPrompted);
  const setAnalyticsConsent = usePreferencesStore((s) => s.setAnalyticsConsent);

  if (analyticsConsentPrompted) {
    return null;
  }

  return (
    <div className="border-b border-border bg-card/95">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground">
          Allow anonymous analytics to help improve the hotline experience? No ad trackers.
          <Link to="/privacy" className="ml-1 underline hover:text-foreground">
            Learn more
          </Link>
          .
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnalyticsConsent(false)}>
            Decline
          </Button>
          <Button size="sm" onClick={() => setAnalyticsConsent(true)}>
            Allow Analytics
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsConsentBanner;
