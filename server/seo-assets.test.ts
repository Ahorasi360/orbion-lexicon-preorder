import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("public search and crawler assets", () => {
  it("publishes the requested preorder title and core structured-data terms", () => {
    const html = readFileSync(resolve(root, "client/index.html"), "utf8");
    expect(html).toContain("The Orbion Space Lexicon | Preorder the First Edition");
    expect(html).toContain('"@type":"Book"');
    expect(html).toContain("October 31, 2026");
  });

  it("provides crawl directives and a sitemap for every public policy route", () => {
    const robots = readFileSync(resolve(root, "client/public/robots.txt"), "utf8");
    const sitemap = readFileSync(resolve(root, "client/public/sitemap.xml"), "utf8");
    expect(robots).toContain("Sitemap: https://orbionlexicon.com/sitemap.xml");
    expect(robots).toContain("User-agent: GPTBot");
    expect(sitemap).toContain("https://orbionlexicon.com/preorder-refund-policy");
    expect(sitemap).toContain("https://orbionlexicon.com/corrections");
  });
});
