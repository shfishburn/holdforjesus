type RouteMeta = {
  title: string;
  description: string;
};

type ResolvedRouteMeta = {
  isKnownRoute: boolean;
  meta: RouteMeta;
};

export const config = {
  matcher:
    "/((?!api/|assets/|_vite/|favicon.ico|favicon.png|manifest.json|robots.txt|sitemap.xml|sw.js|.*\\..*).*)",
};

const SITE_NAME = "Hold for Jesus";
const DEFAULT_IMAGE_ALT =
  "Hold for Jesus — dynamic preview card for the divine customer service hotline";
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slackbot|discordbot|twitterbot|whatsapp|telegrambot|facebookexternalhit|linkedinbot|applebot|embedly|quora link preview|pinterest|skypeuripreview|googlebot|bingbot/i;
const NOT_FOUND_META: RouteMeta = {
  title: "404 / 666 — Page Not Found",
  description:
    "The requested page does not exist. Return to Hold for Jesus home or visit crisis resources for real support.",
};

const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "Hold for Jesus — AI Prayer Experience",
    description:
      "A satirical AI prayer experience exploring how chatbots should — and shouldn't — handle spiritual questions.",
  },
  "/about": {
    title: "About — Hold for Jesus",
    description:
      "Hold for Jesus is a satirical AI prayer hotline exploring how chatbots should handle spiritual questions, grounded by real crisis resources and the Global Pain Index.",
  },
  "/community": {
    title: "Community — Prayer Wall & Global Board",
    description:
      "Anonymous Prayer Wall and Global Prayer Board. Light candles, share reflections, and add your voice.",
  },
  "/crisis": {
    title: "Crisis Resources — Real Help When You Need It",
    description:
      "If you or someone you know is in crisis, these resources provide real and immediate support. Free, confidential, and available 24/7.",
  },
  "/history": {
    title: "Call History — Hold for Jesus",
    description:
      "Review your local call history, revisit past prayers, and jump back into the hotline flow.",
  },
  "/incidents": {
    title: "Why We Built This — AI Incident Archive | Hold for Jesus",
    description:
      "Nearly 40% of documented AI incidents harm vulnerable populations. Explore real AI failures mapped to communities represented on our Crisis Resources page.",
  },
  "/observatory": {
    title: "Global Pain Index | Hold for Jesus",
    description:
      "Regularly refreshed global indicators of human pain: poverty, hunger, displacement, conflict, and mortality drawn from multiple authoritative source systems.",
  },
  "/pray": {
    title: "Hold for Jesus — Call In | 1-800-JESUS",
    description:
      "Submit a prayer to the hotline and receive a satirical AI response with safety guardrails and crisis redirects when needed.",
  },
  "/privacy": {
    title: "Privacy Policy — Hold for Jesus",
    description:
      "Privacy policy for Hold for Jesus, including what metadata is processed, what stays local, and how community submissions are handled.",
  },
  "/terms": {
    title: "Terms of Service — Hold for Jesus",
    description:
      "Terms of service for Hold for Jesus, including acceptable use, limitations, data handling, and community content responsibilities.",
  },
  "/transparency": {
    title: "How It Works — Hold for Jesus",
    description:
      "Architecture, moderation, AI workflow, data pipelines, and privacy: everything about how Hold for Jesus works under the hood.",
  },
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildOgImageUrl(baseUrl: string, pathname: string): string {
  const slug = pathname === "/" ? "home" : pathname.replace(/^\//, "").replace(/\//g, "-");
  return `${baseUrl}/og/${slug}.png`;
}

export function isBotUserAgent(userAgent: string | null): boolean {
  return BOT_USER_AGENT_PATTERN.test(userAgent || "");
}

export function shouldRewriteMetadata(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false;
  }

  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return false;
  }

  if (isBotUserAgent(request.headers.get("user-agent"))) {
    return true;
  }

  const purpose =
    `${request.headers.get("purpose") || ""} ${request.headers.get("x-purpose") || ""}`.toLowerCase();
  if (purpose.includes("preview")) {
    return true;
  }

  return (
    !request.headers.has("sec-fetch-dest") &&
    !request.headers.has("sec-fetch-mode") &&
    !request.headers.has("sec-fetch-user")
  );
}

export function getRouteMeta(pathname: string): ResolvedRouteMeta {
  const normalizedPath = normalizePathname(pathname);
  return {
    isKnownRoute: normalizedPath in ROUTE_META,
    meta: ROUTE_META[normalizedPath] || NOT_FOUND_META,
  };
}

export function stripManagedHeadTags(html: string): string {
  const patterns = [
    /<title>[\s\S]*?<\/title>/gi,
    /<link[^>]*rel=["']canonical["'][^>]*>/gi,
    /<meta[^>]*name=["']description["'][^>]*>/gi,
    /<meta[^>]*property=["']og:title["'][^>]*>/gi,
    /<meta[^>]*property=["']og:description["'][^>]*>/gi,
    /<meta[^>]*property=["']og:type["'][^>]*>/gi,
    /<meta[^>]*property=["']og:url["'][^>]*>/gi,
    /<meta[^>]*property=["']og:image["'][^>]*>/gi,
    /<meta[^>]*property=["']og:image:secure_url["'][^>]*>/gi,
    /<meta[^>]*property=["']og:image:type["'][^>]*>/gi,
    /<meta[^>]*property=["']og:image:width["'][^>]*>/gi,
    /<meta[^>]*property=["']og:image:height["'][^>]*>/gi,
    /<meta[^>]*property=["']og:image:alt["'][^>]*>/gi,
    /<meta[^>]*property=["']og:site_name["'][^>]*>/gi,
    /<meta[^>]*property=["']og:locale["'][^>]*>/gi,
    /<meta[^>]*name=["']twitter:card["'][^>]*>/gi,
    /<meta[^>]*name=["']twitter:title["'][^>]*>/gi,
    /<meta[^>]*name=["']twitter:description["'][^>]*>/gi,
    /<meta[^>]*name=["']twitter:image["'][^>]*>/gi,
    /<meta[^>]*name=["']twitter:image:alt["'][^>]*>/gi,
  ];

  return patterns.reduce((output, pattern) => output.replace(pattern, ""), html);
}

export function buildManagedHeadTags(baseUrl: string, pathname: string): string {
  const normalizedPath = normalizePathname(pathname);
  const { isKnownRoute, meta } = getRouteMeta(normalizedPath);
  const canonicalUrl = `${baseUrl}${normalizedPath === "/" ? "" : normalizedPath}`;
  const imageUrl = buildOgImageUrl(baseUrl, isKnownRoute ? normalizedPath : "/");
  const canonicalTag = isKnownRoute
    ? `\n    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
    : "";
  const robotsTag = isKnownRoute ? "" : '\n    <meta name="robots" content="noindex, nofollow" />';

  return `
    <title>${escapeHtml(meta.title)}</title>
    ${canonicalTag}
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(DEFAULT_IMAGE_ALT)}" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(DEFAULT_IMAGE_ALT)}" />
    ${robotsTag}`;
}

async function fetchPageHtml(baseUrl: string, pathname: string): Promise<Response> {
  const staticPath = pathname === "/" ? "/index.html" : `${pathname}/index.html`;
  const routeResponse = await fetch(`${baseUrl}${staticPath}`);
  if (routeResponse.ok) return routeResponse;
  return fetch(`${baseUrl}/index.html`);
}

export default async function middleware(request: Request) {
  if (!shouldRewriteMetadata(request)) {
    return fetch(request);
  }

  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  const baseUrl = `${url.protocol}//${url.host}`;
  const { isKnownRoute } = getRouteMeta(pathname);

  const response = await fetchPageHtml(baseUrl, pathname);
  const sourceHtml = await response.text();
  const managedHtml = stripManagedHeadTags(sourceHtml);
  const tags = buildManagedHeadTags(baseUrl, pathname);

  const html = managedHtml.includes("</head>")
    ? managedHtml.replace("</head>", `${tags}\n</head>`)
    : managedHtml;

  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  if (!isKnownRoute) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return new Response(html, {
    status: isKnownRoute ? response.status : 404,
    headers,
  });
}
