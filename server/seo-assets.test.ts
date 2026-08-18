import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("public search and crawler assets", () => {
  it("publishes the Online Lexicon metadata while retaining the requested book-preorder title and core structured-data", () => {
    const html = readFileSync(resolve(root, "client/index.html"), "utf8");
    const bookPage = readFileSync(resolve(root, "client/src/pages/BookPage.tsx"), "utf8");
    const preorderPage = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
    expect(html).toContain("Orbion Online Lexicon | The Language of Space, Connected.");
    expect(bookPage).toContain("The Orbion Space Lexicon | Preorder the First Edition");
    expect(html).toContain('"@type":"DefinedTermSet"');
    expect(html).toContain('"@type":"Book"');
    expect(preorderPage).toContain("October 31, 2026");
  });

  it("publishes individual preorder Product offers for every edition", () => {
    const html = readFileSync(resolve(root, "client/index.html"), "utf8");
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain("First 1,000 Collector’s Edition");
    expect(html).toContain("Hardcover Edition");
    expect(html).toContain("Paperback Edition");
    expect(html).toContain('"price":"349.00"');
    expect(html).toContain('"price":"149.00"');
    expect(html).toContain('"price":"89.00"');
  });

  it("provides crawl directives and a sitemap for every public policy route", () => {
    const robots = readFileSync(resolve(root, "client/public/robots.txt"), "utf8");
    const sitemap = readFileSync(resolve(root, "client/public/sitemap.xml"), "utf8");
    const legalPage = readFileSync(resolve(root, "client/src/pages/LegalPage.tsx"), "utf8");
    expect(robots).toContain("Sitemap: https://orbionlexicon.com/sitemap.xml");
    expect(robots).toContain("User-agent: GPTBot");
    expect(sitemap).toContain("https://orbionlexicon.com/book");
    expect(sitemap).toContain("https://orbionlexicon.com/lexicon/spaceflight");
    expect(sitemap).toContain("https://orbionlexicon.com/preorder-refund-policy");
    expect(sitemap).toContain("https://orbionlexicon.com/corrections");
    expect(legalPage).toContain('href="/book#preorder"');
  });
});
