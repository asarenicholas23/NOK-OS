/**
 * Post-build step (runs before prerender.ts) that regenerates dist/sitemap.xml
 * from the actual public routes plus every live blogPosts document, instead
 * of hand-maintaining public/sitemap.xml. Each blog post gets a real
 * <lastmod> pulled from its Firestore "date" field.
 */
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { fetchBlogPosts } from "./blogData";
import { SITE_URL, toIsoDate } from "../src/lib/seo";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

interface SitemapUrl {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildSitemapXml(urls: SitemapUrl[]): string {
  const entries = urls
    .map((u) => {
      const lines = [
        `  <url>`,
        `    <loc>${escapeXml(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
        `    <changefreq>${u.changefreq}</changefreq>`,
        `    <priority>${u.priority}</priority>`,
        `  </url>`,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main() {
  console.log("[sitemap] fetching blog posts from Firestore...");
  const posts = await fetchBlogPosts();
  console.log(`[sitemap] found ${posts.length} blog post(s)`);

  const urls: SitemapUrl[] = [
    { loc: `${SITE_URL}/home`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/blog`, changefreq: "daily", priority: "0.9" },
    { loc: `${SITE_URL}/resources`, changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/ighealthcheck`, changefreq: "monthly", priority: "0.8" },
    { loc: `${SITE_URL}/website-builds`, changefreq: "monthly", priority: "0.8" },
    ...posts.map((post) => ({
      loc: `${SITE_URL}/blog/${post.slug}`,
      changefreq: "monthly",
      priority: "0.7",
      lastmod: toIsoDate(post.date)?.slice(0, 10),
    })),
  ];

  const xml = buildSitemapXml(urls);
  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(path.join(distDir, "sitemap.xml"), xml, "utf-8");
  console.log(`[sitemap] wrote ${urls.length} url(s) to dist/sitemap.xml`);
}

main().catch((err) => {
  console.error("[sitemap] failed:", err);
  process.exit(1);
});
