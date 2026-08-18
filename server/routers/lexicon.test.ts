import { describe, expect, it } from "vitest";
import type { LexiconEntry } from "../../drizzle/schema";
import { catalogEntry, isOwnerLexiconPreview, lockedEntryPayload, normalizeStringArray, publicPreviewEntryPayload, scoreLexiconMatch } from "./lexicon";

const entry = {
  canonicalName: "Spaceflight",
  acronym: "SF",
  aliases: ["space flight"],
  publicTeaser: "A public catalog description approved for discovery.",
} as Pick<LexiconEntry, "canonicalName" | "acronym" | "aliases"> & { publicTeaser: string };

describe("Lexicon search helpers", () => {
  it("normalizes database JSON arrays without assuming the driver return shape", () => {
    expect(normalizeStringArray(["Spaceflight", 5, "Aerospace"])).toEqual(["Spaceflight", "Aerospace"]);
    expect(normalizeStringArray('["Spaceflight", "Aerospace"]')).toEqual(["Spaceflight", "Aerospace"]);
  });

  it("prioritizes exact canonical terms over approved public teaser matches", () => {
    expect(scoreLexiconMatch(entry, "Spaceflight")).toMatchObject({ score: 100, match: "Exact term match" });
    expect(scoreLexiconMatch(entry, "catalog description").score).toBeGreaterThan(0);
  });

  it("supports acronym and alias discovery without accessing premium related concepts or definitions", () => {
    expect(scoreLexiconMatch(entry, "SF")).toMatchObject({ score: 95, match: "Acronym match" });
    expect(scoreLexiconMatch(entry, "space flight")).toMatchObject({ score: 90, match: "Alias match" });
    expect(scoreLexiconMatch(entry, "mission lifecycle")).toMatchObject({ score: 0, match: "" });
  });

  it("never places premium manuscript fields in locked or public-preview payload builders", () => {
    const catalog = {
      id: 7,
      orbionId: "OSL-0007",
      slug: "sample-term",
      canonicalName: "Sample Term",
      acronym: null,
      aliases: [],
      publicTeaser: "Approved catalog teaser.",
      isPublicPreview: true,
      publicPreviewDefinition: "Approved public sample only.",
      publicPreviewWhyItMatters: "Approved public context only.",
      publicPreviewRelatedSlugs: ["related-sample"],
      indexStatus: "index",
      domainIds: [1],
      reviewStatus: "approved",
      updatedAt: new Date(),
    } as Parameters<typeof catalogEntry>[0];
    const domains = new Map([[1, { id: 1, slug: "foundations", name: "Foundations" }]] as any);
    const safeCatalog = catalogEntry(catalog, domains);
    const locked = lockedEntryPayload(safeCatalog);
    const preview = publicPreviewEntryPayload(catalog, domains);

    expect(locked).not.toHaveProperty("fullDefinition");
    expect(locked).not.toHaveProperty("whyItMatters");
    expect(preview).not.toHaveProperty("fullDefinition");
    expect(preview).not.toHaveProperty("whyItMatters");
    expect(preview.preview).toEqual({
      definition: "Approved public sample only.",
      whyItMatters: "Approved public context only.",
      relatedSlugs: ["related-sample"],
    });
  });

  it("allows owner preview only for the trusted administrator role", () => {
    expect(isOwnerLexiconPreview({ role: "admin" })).toBe(true);
    expect(isOwnerLexiconPreview({ role: "user" })).toBe(false);
    expect(isOwnerLexiconPreview(undefined)).toBe(false);
  });
});
