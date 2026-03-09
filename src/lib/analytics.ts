import { usePreferencesStore } from "@/stores/usePreferencesStore.ts";

const GA_MEASUREMENT_ID = "G-2FDVE014T8";
const GTAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

let gtagScriptLoaded = false;

function ensureGtagScript() {
  if (gtagScriptLoaded) return;
  gtagScriptLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = GTAG_SRC;
  document.head.appendChild(script);
  globalThis.gtag?.("js", new Date());
  globalThis.gtag?.("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  const analyticsConsent = usePreferencesStore.getState().analyticsConsent;
  if (!analyticsConsent || typeof globalThis.gtag !== "function") {
    return;
  }

  ensureGtagScript();

  globalThis.gtag("event", eventName, {
    ...params,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackPageView(pagePath: string) {
  trackEvent("page_view", {
    page_title: document.title,
    page_location: globalThis.location.href,
    page_path: pagePath,
  });
}
