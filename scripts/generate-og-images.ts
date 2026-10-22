/**
 * Generates the social share (Open Graph) image for each public page, in the
 * site's style, from the headlines in src/content/siteContent.ts.
 *
 *   npx tsx scripts/generate-og-images.ts
 *
 * Writes 1200×630 JPGs to public/images/og/<slug>.jpg. Re-run it after
 * changing a page headline. Blog posts use their own cover image instead.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { OG_PAGES } from "../src/lib/seo";
import { about, blog, freeTools, home, igHealthCheck, marketingPage, servicesHub, websitesPage } from "../src/content/siteContent";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public/images/og");
// Embedded, since a page made with setContent can't load local font files.
const fontUrl = "data:font/woff2;base64," + fs.readFileSync(path.join(root, "public/fonts/baloo2-latin.woff2")).toString("base64");

type Card = { tag: string; title: string; highlight?: string };

const cards: Record<(typeof OG_PAGES)[number], Card> = {
  home: { tag: "Marketing and websites", title: home.hero.titleBefore, highlight: home.hero.titleHighlight },
  services: { tag: "Services", title: servicesHub.title },
  marketing: { tag: marketingPage.tag, title: marketingPage.title },
  websites: { tag: websitesPage.tag, title: websitesPage.title },
  about: { tag: "About", title: about.title },
  blog: { tag: "Blog", title: blog.intro.split(". ")[0] + "." },
  resources: { tag: "Free tools", title: freeTools.page.title },
  ighealthcheck: { tag: "Free tool · in the works", title: igHealthCheck.title },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = (c: Card) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Baloo 2"; src: url(${fontUrl}) format("woff2"); font-weight: 400 700; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #14213D; color: #F5F1E8; font-family: "Baloo 2", sans-serif; padding: 64px 72px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 14px; font-size: 34px; font-weight: 600; }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.tag { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 24px; color: #E8A33D; }
h1 { margin-top: 14px; font-size: ${c.title.length > 60 ? 66 : 76}px; line-height: 1.04; font-weight: 700; max-width: 1000px; }
mark { display: inline-block; line-height: 0.95; background: #E8A33D; color: #14213D; padding: 8px 16px 0; border-radius: 16px; }
.foot { display: flex; justify-content: space-between; align-items: center; font-size: 24px; color: rgba(245,241,232,.7); }
.pill { background: #E8A33D; color: #14213D; font-weight: 600; padding: 10px 26px; border-radius: 999px; }
</style></head><body>
<div class="brand"><svg width="40" height="52" viewBox="10 10 34 44"><line x1="18" y1="32" x2="38" y2="18" stroke="#F5F1E8" stroke-width="2"/><line x1="18" y1="32" x2="38" y2="46" stroke="#F5F1E8" stroke-width="2"/><circle cx="18" cy="32" r="5" fill="#F5F1E8"/><circle cx="38" cy="18" r="5" fill="#E8A33D"/><circle cx="38" cy="46" r="5" fill="#E8A33D"/></svg>N.O.K Social</div>
<div class="main"><p class="tag">${esc(c.tag)}</p><h1>${esc(c.title)}${c.highlight ? ` <mark>${esc(c.highlight)}</mark>` : ""}</h1></div>
<div class="foot"><span>noksocial.com</span><span class="pill">Book a discovery call</span></div>
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [slug, card] of Object.entries(cards)) {
  await page.setContent(html(card), { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.load('700 76px "Baloo 2"');
    await document.fonts.ready;
  });
  await page.screenshot({ path: path.join(outDir, `${slug}.jpg`), type: "jpeg", quality: 85 });
  console.log("wrote", `public/images/og/${slug}.jpg`);
}
await browser.close();
