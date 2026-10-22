/**
 * Post-build prerender step. Runs after `vite build` (wired up as the npm
 * "postbuild" script) and turns the public marketing routes into real static
 * HTML files under dist/, so crawlers that don't execute JS (GPTBot,
 * ClaudeBot, PerplexityBot) see actual content instead of an empty
 * <div id="root">.
 *
 * Deliberately never visits /os/*, /review/*, or /approve/* — those stay
 * client-rendered SPA routes, untouched by this script.
 */
import { chromium } from "playwright";
import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { fetchBlogPosts } from "./blogData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// Serves dist/ exactly the way Firebase Hosting will: static files first,
// falling back to the SPA shell for anything else (deep client-only routes).
function startStaticServer() {
  const app = express();
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
  return new Promise<import("http").Server>((resolve) => {
    const server = app.listen(PORT, () => resolve(server));
  });
}

async function renderRoute(
  page: import("playwright").Page,
  route: string,
  expectedTitleText?: string
) {
  // Pages load their content from Firestore, so a slow response can miss the
  // timeout; retry once before failing the build.
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "load" });
      await page.waitForSelector("footer", { timeout: 20000 });
      break;
    } catch (err) {
      if (attempt >= 2) throw err;
      console.warn(`  retrying ${route} (slow load)`);
    }
  }
  // Pages that load live data mark themselves aria-busy until it arrives
  // (e.g. the blog). Wait for that so the snapshot holds real content.
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"]'), undefined, { timeout: 15000 })
    .catch(() => {});
  if (expectedTitleText) {
    await page
      .waitForFunction(
        (text) => document.querySelector("h1")?.textContent?.trim() === text.trim(),
        expectedTitleText,
        { timeout: 15000 }
      )
      .catch(() => {
        // If the post never matches (e.g. removed between fetch and render),
        // fall through and prerender whatever is on the page rather than
        // failing the whole build.
      });
  }
  const html = await page.content();
  // Written as a flat "{route}.html" file (paired with "cleanUrls": true in
  // firebase.json) rather than "{route}/index.html" — the directory+index
  // form makes Firebase Hosting 301-redirect bare "/home" to "/home/" before
  // serving content, which doesn't match the no-trailing-slash URLs used in
  // sitemap.xml and the page's own canonical/og:url tags.
  const outFile = path.join(distDir, `${route}.html`);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, html, "utf-8");
  console.log(`  prerendered ${route}`);
}

async function main() {
  console.log("[prerender] fetching blog post slugs from Firestore...");
  const posts = await fetchBlogPosts();
  console.log(`[prerender] found ${posts.length} blog post(s)`);

  console.log("[prerender] starting static server on dist/...");
  const server = await startStaticServer();

  console.log("[prerender] launching headless Chromium...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const staticRoutes = ["/home", "/services", "/services/marketing", "/services/websites", "/about", "/blog", "/resources", "/ighealthcheck"];
    for (const route of staticRoutes) {
      await renderRoute(page, route);
    }
    for (const post of posts) {
      await renderRoute(page, `/blog/${post.slug}`, post.title);
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("[prerender] done.");
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
