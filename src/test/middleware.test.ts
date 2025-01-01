import { describe, expect, it } from "vitest";
import {
  buildManagedHeadTags,
  isBotUserAgent,
  shouldRewriteMetadata,
  stripManagedHeadTags,
} from "../../middleware";

describe("middleware metadata helpers", () => {
  it("detects crawler and preview traffic", () => {
    expect(isBotUserAgent("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 Safari/605.1.15")).toBe(false);

    const botRequest = new Request("https://holdforjesus.com/about", {
      headers: {
        accept: "text/html",
        "user-agent": "facebookexternalhit/1.1",
      },
    });

    const browserRequest = new Request("https://holdforjesus.com/about", {
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
      },
    });

    expect(shouldRewriteMetadata(botRequest)).toBe(true);
    expect(shouldRewriteMetadata(browserRequest)).toBe(false);
  });

  it("builds noindex tags for unknown routes", () => {
    const tags = buildManagedHeadTags("https://holdforjesus.com", "/missing");

    expect(tags).toContain("666 — Page Not Found");
    expect(tags).toContain('name="robots" content="noindex, nofollow"');
    expect(tags).not.toContain('rel="canonical"');
    expect(tags).toContain("https://holdforjesus.com/og/home.png");
  });

  it("removes existing managed SEO tags before injection", () => {
    const html = `
      <html>
        <head>
          <title>Old title</title>
          <meta name="description" content="Old description" />
          <meta property="og:title" content="Old OG title" />
        </head>
      </html>`;

    const stripped = stripManagedHeadTags(html);

    expect(stripped).not.toContain("Old title");
    expect(stripped).not.toContain("Old description");
    expect(stripped).not.toContain("Old OG title");
  });
});
