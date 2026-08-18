import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteUrl = "https://orbionlexicon.com";
const seed = JSON.parse(await readFile(path.join(root, "data", "lexicon-seed.json"), "utf8"));
const staticRoutes = [
  ["/", "weekly", "1.0"], ["/book", "weekly", "0.9"], ["/lexicon", "weekly", "0.9"], ["/domains", "weekly", "0.8"],
  ["/maps", "monthly", "0.7"], ["/methodology", "monthly", "0.7"], ["/sources", "weekly", "0.7"], ["/search", "weekly", "0.6"],
  ["/about", "monthly", "0.5"], ["/intelligence", "monthly", "0.6"], ["/terms-of-sale", "monthly", "0.5"],
  ["/preorder-refund-policy", "monthly", "0.6"], ["/shipping-delay-policy", "monthly", "0.6"], ["/privacy-policy", "monthly", "0.4"],
  ["/contact", "monthly", "0.5"], ["/corrections", "weekly", "0.5"],
];
const escapeXml = value => value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]);
const toUrl = ([route, changefreq, priority]) => `  <url><loc>${siteUrl}${route}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
const domainUrls = seed.domains.map(domain => `  <url><loc>${siteUrl}/domains/${escapeXml(domain.slug)}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
const termUrls = seed.entries.map(entry => `  <url><loc>${siteUrl}/lexicon/${escapeXml(entry.slug)}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
const sitemap = [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...staticRoutes.map(toUrl), ...domainUrls, ...termUrls, `</urlset>`, ``].join("\n");
await writeFile(path.join(root, "client", "public", "sitemap.xml"), sitemap, "utf8");
console.log(`Wrote sitemap with ${staticRoutes.length + domainUrls.length + termUrls.length} URLs.`);
