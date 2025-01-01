import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const OUTPUT_DIR = path.join(process.cwd(), "public", "og");
const BASE_IMAGE_PATH = path.join(process.cwd(), "public", "og-image.jpg");
const WIDTH = 1200;
const HEIGHT = 630;

const ROUTES = [
  {
    slug: "home",
    label: "Main Line",
    title: "Hold for Jesus",
    description: "Satirical AI prayer hotline and divine customer service.",
    accent: "#e8d7b2",
  },
  {
    slug: "about",
    label: "About",
    title: "About the Divine Hotline",
    description: "Why this satirical prayer hotline exists and what it is actually for.",
    accent: "#dcc6b7",
  },
  {
    slug: "community",
    label: "Community",
    title: "Prayer Wall & Global Board",
    description: "Shared reflections, candles, and a public ledger of human concern.",
    accent: "#ead5c2",
  },
  {
    slug: "crisis",
    label: "Crisis Help",
    title: "Real Help When You Need It",
    description: "Verified crisis lines and support resources. No satire where safety matters.",
    accent: "#f1c2b5",
  },
  {
    slug: "history",
    label: "History",
    title: "Call History",
    description: "Review past calls, saved prayers, and your hotline journey.",
    accent: "#d8cec1",
  },
  {
    slug: "incidents",
    label: "AI Incidents",
    title: "Why We Built This",
    description: "Documented AI failures and the human harms behind them.",
    accent: "#dfb2a9",
  },
  {
    slug: "observatory",
    label: "Pain Index",
    title: "Global Pain Index",
    description: "Live indicators of poverty, hunger, conflict, displacement, and mortality.",
    accent: "#bfd5b7",
  },
  {
    slug: "pray",
    label: "Call In",
    title: "Submit a Prayer",
    description: "Send a request to the hotline and get a guarded, satirical response.",
    accent: "#dfc1a6",
  },
  {
    slug: "privacy",
    label: "Privacy",
    title: "Privacy Policy",
    description:
      "What metadata is processed, what stays local, and how community submissions work.",
    accent: "#bdd1d9",
  },
  {
    slug: "terms",
    label: "Terms",
    title: "Terms of Service",
    description: "Acceptable use, limitations, and community content responsibilities.",
    accent: "#ccc3db",
  },
  {
    slug: "transparency",
    label: "How It Works",
    title: "How It Works",
    description: "Architecture, moderation, AI workflow, and privacy under the hood.",
    accent: "#c8d4bd",
  },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapLine(text, lineLength) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > lineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function renderSvg(route) {
  const titleLines = wrapLine(route.title, 22);
  const descriptionLines = wrapLine(route.description, 38);

  const titleMarkup = titleLines
    .map((line, index) => `<tspan x="94" dy="${index === 0 ? 0 : 68}">${escapeXml(line)}</tspan>`)
    .join("");

  const descriptionMarkup = descriptionLines
    .map((line, index) => `<tspan x="94" dy="${index === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
          <stop stop-color="rgba(30,18,17,0.76)" />
          <stop offset="1" stop-color="rgba(30,18,17,0.16)" />
        </linearGradient>
        <linearGradient id="footer" x1="0" y1="630" x2="0" y2="470" gradientUnits="userSpaceOnUse">
          <stop stop-color="rgba(17,10,10,0.74)" />
          <stop offset="1" stop-color="rgba(17,10,10,0)" />
        </linearGradient>
        <linearGradient id="beam" x1="780" y1="32" x2="1050" y2="590" gradientUnits="userSpaceOnUse">
          <stop stop-color="${route.accent}" stop-opacity="0.34" />
          <stop offset="1" stop-color="${route.accent}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="710" height="630" fill="url(#panel)" />
      <rect x="0" y="430" width="1200" height="200" fill="url(#footer)" />
      <circle cx="1038" cy="114" r="178" fill="rgba(255,244,214,0.08)" stroke="rgba(255,244,214,0.16)" stroke-width="2" />
      <circle cx="1040" cy="114" r="140" fill="rgba(30,18,17,0.16)" />
      <circle cx="112" cy="586" r="144" fill="rgba(255,244,214,0.08)" />
      <rect x="756" y="0" width="220" height="630" fill="url(#beam)" transform="rotate(12 756 0)" />
      <rect x="94" y="74" rx="999" ry="999" width="168" height="30" fill="rgba(255,244,214,0.1)" stroke="rgba(255,244,214,0.22)" />
      <text x="178" y="94" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" letter-spacing="2.6" fill="#F7E6C6">HOLD FOR JESUS</text>
      <text x="94" y="126" font-family="Arial, sans-serif" font-size="15" letter-spacing="1.1" fill="rgba(255,247,230,0.72)">Divine Customer Service</text>
      <rect x="932" y="72" rx="999" ry="999" width="166" height="34" fill="rgba(30,18,17,0.24)" stroke="rgba(255,244,214,0.26)" />
      <text x="1015" y="94" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="1.8" fill="#FFF1C7">${escapeXml(route.label.toUpperCase())}</text>
      <text x="94" y="238" font-family="Georgia, serif" font-size="78" font-weight="700" fill="#FFF7E6">${titleMarkup}</text>
      <text x="94" y="404" font-family="Arial, sans-serif" font-size="25" fill="rgba(255,247,230,0.9)">${descriptionMarkup}</text>
      <text x="94" y="518" font-family="Arial, sans-serif" font-size="18" letter-spacing="1.8" fill="rgba(255,247,230,0.68)">1-800-JESUS</text>
      <text x="94" y="580" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="${route.accent}">${escapeXml(route.label)}</text>
      <text x="946" y="580" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,247,230,0.78)">holdforjesus.com</text>
    </svg>`;
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });

const baseImage = await sharp(BASE_IMAGE_PATH)
  .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
  .modulate({ brightness: 0.96, saturation: 0.9 })
  .toBuffer();

for (const route of ROUTES) {
  const overlay = Buffer.from(renderSvg(route));
  const outputPath = path.join(OUTPUT_DIR, `${route.slug}.png`);
  await sharp(baseImage)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(outputPath);
}

console.log(`Generated ${ROUTES.length} OG images in ${OUTPUT_DIR}`);
