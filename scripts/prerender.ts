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
import { fetchBlogPosts, fetchCmsSnapshot } from "./blogData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// The empty app shell. vite build writes it as index.html; it's copied to
// app.html, which Firebase Hosting serves for every route without its own
// pre-rendered page (/os, proposal links, unknown URLs). index.html is then
// replaced by the pre-rendered homepage, served at "/".
const SHELL = "app.html";

// Serves dist/ the way Firebase Hosting will: static files first, falling
// back to the app shell for anything else (deep client-only routes).
function startStaticServer() {
  const app = express();
  app.use(express.static(distDir, { index: false }));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, SHELL));
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
      .catch(() => {});
    // Never save a post page that didn't render its post (e.g. "Article not
    // found"): stop the build so a broken page can't be deployed.
    const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() ?? "");
    if (h1 !== expectedTitleText.trim()) {
      throw new Error(`${route} rendered "${h1}" instead of its post title. Not saving it.`);
    }
  }
  // The Google Fonts stylesheet loads without blocking the first paint
  // (media="print", switched to "all" once loaded). By capture time it has
  // switched, so put it back, or the saved page would block on it.
  const html = (await page.content()).replace(
    /(<link[^>]*fonts\.googleapis\.com[^>]*?)media="all"([^>]*onload=)/g,
    '$1media="print"$2',
  );
  // Written as a flat "{route}.html" file (paired with "cleanUrls": true in
  // firebase.json) rather than "{route}/index.html" — the directory+index
  // form makes Firebase Hosting 301-redirect bare "/home" to "/home/" before
  // serving content, which doesn't match the no-trailing-slash URLs used in
  // sitemap.xml and the page's own canonical/og:url tags.
  const outFile = path.join(distDir, route === "/" ? "index.html" : `${route}.html`);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, html, "utf-8");
  console.log(`  prerendered ${route}`);
}

async function main() {
  console.log("[prerender] fetching blog post slugs from Firestore...");
  const posts = await fetchBlogPosts();
  console.log(`[prerender] found ${posts.length} blog post(s)`);

  console.log("[prerender] starting static server on dist/...");
  // Keep the empty app shell before index.html is replaced by the homepage.
  await fs.copyFile(path.join(distDir, "index.html"), path.join(distDir, SHELL));
  const server = await startStaticServer();

  console.log("[prerender] launching headless Chromium...");
  const browser = await chromium.launch();
  // Reduced motion, so the saved HTML has every section fully visible rather
  // than caught mid-animation (reveals start at opacity 0). Animations still
  // run for visitors once the page's script takes over.
  const page = await browser.newPage({ reducedMotion: "reduce" });
  // Tell the app it's being pre-rendered, so idle-time work (the deferred
  // Firebase connection and Analytics) doesn't run and its script preloads
  // don't end up baked into the saved HTML. See whenIdle in loadFirebase.ts.
  // It also gets the live CMS data up front (see fetchCmsSnapshot), so every
  // page renders real content without its own database connection.
  console.log("[prerender] fetching CMS data snapshot...");
  const snapshot = await fetchCmsSnapshot();
  await page.addInitScript((snap) => {
    const w = window as unknown as { __PRERENDER__?: boolean; __CMS_SNAPSHOT__?: unknown };
    w.__PRERENDER__ = true;
    w.__CMS_SNAPSHOT__ = snap;
  }, snapshot);

  try {
    const staticRoutes = ["/", "/services", "/services/marketing", "/services/websites", "/about", "/blog", "/resources", "/ighealthcheck"];
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
