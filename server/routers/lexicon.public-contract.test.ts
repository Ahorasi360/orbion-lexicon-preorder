import { describe, expect, it, vi } from "vitest";

const premiumMarker = "PRIVATE PREMIUM MANUSCRIPT TEXT";
const catalogEntries = [
  {
    id: 1,
    orbionId: "OSL-0001",
    slug: "locked-term",
    canonicalName: "Locked Term",
    acronym: null,
    aliases: ["locked alias"],
    publicTeaser: "An owner-approved catalog teaser.",
    isPublicPreview: false,
    publicPreviewDefinition: null,
    publicPreviewWhyItMatters: null,
    publicPreviewRelatedSlugs: [],
    indexStatus: "noindex",
    domainIds: [1],
    reviewStatus: "approved",
    updatedAt: new Date(),
    fullDefinition: premiumMarker,
    whyItMatters: premiumMarker,
  },
  {
    id: 2,
    orbionId: "OSL-0002",
    slug: "preview-term",
    canonicalName: "Preview Term",
    acronym: "PT",
    aliases: ["preview alias"],
    publicTeaser: "A separate owner-approved public teaser.",
    isPublicPreview: true,
    publicPreviewDefinition: "A separately approved preview excerpt.",
    publicPreviewWhyItMatters: "A separately approved preview context.",
    publicPreviewRelatedSlugs: ["locked-term"],
    indexStatus: "index",
    domainIds: [1],
    reviewStatus: "approved",
    updatedAt: new Date(),
    fullDefinition: premiumMarker,
    whyItMatters: premiumMarker,
  },
];

vi.mock("../db", () => ({
  getActiveLexiconEntitlement: vi.fn(async () => undefined),
  getLexiconCatalogEntryBySlug: vi.fn(async (slug: string) => catalogEntries.find(entry => entry.slug === slug) ?? null),
  getLexiconEntryBySlug: vi.fn(async () => { throw new Error("Premium query must not run for a logged-out caller"); }),
  listLexiconCatalogEntries: vi.fn(async () => catalogEntries),
  listLexiconDomains: vi.fn(async () => [{ id: 1, slug: "foundations", name: "Foundations", description: "Public domain description." }]),
  listLexiconEntries: vi.fn(async () => { throw new Error("Premium list must not run for a logged-out caller"); }),
  listLexiconSources: vi.fn(async () => { throw new Error("Premium source list must not run for a logged-out caller"); }),
  listSourcesByOrbionIds: vi.fn(async () => { throw new Error("Premium source lookup must not run for a logged-out caller"); }),
}));

import { lexiconRouter } from "./lexicon";

describe("logged-out Lexicon public contract", () => {
  it("never serializes premium manuscript text across catalog, search, locked, preview, related, or source responses", async () => {
    const caller = lexiconRouter.createCaller({ user: undefined } as any);
    const [list, search, locked, preview, sources] = await Promise.all([
      caller.list({ query: "term", limit: 24 }),
      caller.search({ query: "preview", limit: 24 }),
      caller.getBySlug({ slug: "locked-term" }),
      caller.getBySlug({ slug: "preview-term" }),
      caller.sources({}),
    ]);

    expect(locked.access).toBe("locked");
    expect(preview.access).toBe("preview");
    expect(preview.relatedEntries).toHaveLength(1);
    expect(sources).toEqual({ access: "locked", results: [] });

    const publicPayload = JSON.stringify({ list, search, locked, preview, sources });
    expect(publicPayload).not.toContain(premiumMarker);
    expect(publicPayload).not.toContain("fullDefinition");
    expect(publicPayload).not.toContain("whyItMatters");
    expect(publicPayload).not.toContain("industryExample");
    expect(publicPayload).not.toContain("primaryReferenceIds");
    expect(publicPayload).not.toContain("relatedEntryIds");
    expect(publicPayload).toContain("A separately approved preview excerpt.");
  });
});
