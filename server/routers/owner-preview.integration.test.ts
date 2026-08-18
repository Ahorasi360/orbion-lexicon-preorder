import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const dbMocks = vi.hoisted(() => ({
  getActiveLexiconEntitlement: vi.fn(),
  getLexiconCatalogEntryBySlug: vi.fn(),
  getLexiconEntryBySlug: vi.fn(),
  listLexiconCatalogEntries: vi.fn(),
  listLexiconDomains: vi.fn(),
  listLexiconPurchasesForUser: vi.fn(),
  listLexiconSources: vi.fn(),
  listSourcesByOrbionIds: vi.fn(),
}));

vi.mock("../db", () => dbMocks);

import { accessRouter } from "./access";
import { lexiconRouter } from "./lexicon";

const catalogEntry = {
  id: 1,
  orbionId: "OSL-0001",
  slug: "spaceflight",
  canonicalName: "Spaceflight",
  acronym: null,
  aliases: [],
  publicTeaser: null,
  isPublicPreview: false,
  publicPreviewDefinition: null,
  publicPreviewWhyItMatters: null,
  publicPreviewRelatedSlugs: [],
  indexStatus: "noindex",
  domainIds: [],
  reviewStatus: "approved",
  updatedAt: new Date("2026-08-18T00:00:00.000Z"),
};

const premiumEntry = {
  ...catalogEntry,
  fullDefinition: "Premium definition visible only to an entitlement holder or owner preview.",
  whyItMatters: "Premium rationale.",
  industryExample: null,
  dontConfuse: null,
  connectedConcepts: [],
  keyFacts: [],
  evidenceStrength: 5,
  bookReference: null,
  relatedEntryIds: [],
  primaryReferenceIds: [],
};

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-open-id`,
      role,
      name: role,
      email: `${role}@example.com`,
      loginMethod: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

describe("owner preview override", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getActiveLexiconEntitlement.mockResolvedValue(undefined);
    dbMocks.getLexiconCatalogEntryBySlug.mockResolvedValue(catalogEntry);
    dbMocks.getLexiconEntryBySlug.mockResolvedValue(premiumEntry);
    dbMocks.listLexiconCatalogEntries.mockResolvedValue([catalogEntry]);
    dbMocks.listLexiconDomains.mockResolvedValue([]);
    dbMocks.listSourcesByOrbionIds.mockResolvedValue([]);
    dbMocks.listLexiconPurchasesForUser.mockResolvedValue([]);
  });

  it("returns the member-only premium payload to an admin without a purchase or entitlement", async () => {
    const result = await lexiconRouter.createCaller(context("admin")).getBySlug({ slug: "spaceflight" });

    expect(result.access).toBe("member");
    expect(result).toHaveProperty("premium.fullDefinition", premiumEntry.fullDefinition);
    expect(dbMocks.getActiveLexiconEntitlement).not.toHaveBeenCalled();
  });

  it("keeps an ordinary signed-in user locked without an active entitlement", async () => {
    const result = await lexiconRouter.createCaller(context("user")).getBySlug({ slug: "spaceflight" });

    expect(result.access).toBe("locked");
    expect(result).not.toHaveProperty("premium");
    expect(dbMocks.getLexiconEntryBySlug).not.toHaveBeenCalled();
  });

  it("reports owner_preview in account status without creating a purchase or entitlement", async () => {
    const result = await accessRouter.createCaller(context("admin")).status();

    expect(result.accessMode).toBe("owner_preview");
    expect(result.entitlement).toMatchObject({ status: "owner_preview", productKey: "owner_preview" });
    expect(result.purchases).toEqual([]);
  });

  it("never reports owner_preview for an ordinary signed-in user", async () => {
    const result = await accessRouter.createCaller(context("user")).status();

    expect(result.accessMode).toBe("none");
    expect(result.entitlement).toBeNull();
  });
});
