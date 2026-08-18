import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Domain, LexiconEntry } from "../../drizzle/schema";
import {
  getActiveLexiconEntitlement,
  getLexiconCatalogEntryBySlug,
  getLexiconEntryBySlug,
  listLexiconCatalogEntries,
  listLexiconDomains,
  listLexiconEntries,
  listLexiconSources,
  listSourcesByOrbionIds,
} from "../db";
import { publicProcedure, router } from "../_core/trpc";

const listInput = z.object({
  domain: z.string().trim().min(1).max(128).optional(),
  letter: z.string().trim().min(1).max(1).optional(),
  query: z.string().trim().min(1).max(120).optional(),
  acronymOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).default(48),
});

const searchInput = z.object({
  query: z.string().trim().min(1).max(120),
  limit: z.number().int().min(1).max(40).default(24),
});

type CatalogEntry = Awaited<ReturnType<typeof listLexiconCatalogEntries>>[number];

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function searchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Catalog search deliberately ignores every premium manuscript field. */
export function scoreLexiconMatch(entry: Pick<LexiconEntry, "canonicalName" | "acronym" | "aliases"> & { publicTeaser?: string | null }, rawQuery: string) {
  const query = searchValue(rawQuery);
  if (!query) return { score: 0, match: "" };

  const canonicalName = searchValue(entry.canonicalName);
  const acronym = searchValue(entry.acronym ?? "");
  const aliases = normalizeStringArray(entry.aliases);
  const publicTeaser = searchValue(entry.publicTeaser ?? "");

  if (canonicalName === query) return { score: 100, match: "Exact term match" };
  if (acronym === query) return { score: 95, match: "Acronym match" };
  if (aliases.some(alias => searchValue(alias) === query)) return { score: 90, match: "Alias match" };
  if (canonicalName.startsWith(query)) return { score: 80, match: "Term begins with your search" };
  if (aliases.some(alias => searchValue(alias).includes(query))) return { score: 70, match: "Alias contains your search" };
  if (canonicalName.includes(query)) return { score: 65, match: "Term contains your search" };
  if (publicTeaser.includes(query)) return { score: 25, match: "Public catalog teaser match" };
  return { score: 0, match: "" };
}

function domainMap(domains: Domain[]) {
  return new Map(domains.map(domain => [domain.id, domain]));
}

function catalogTeaser(entry: CatalogEntry) {
  return entry.publicTeaser ?? "A full Orbion Online Lexicon entry is available to members.";
}

export function catalogEntry(entry: CatalogEntry, domainsById: Map<number, Domain>) {
  const domainIds = normalizeStringArray(entry.domainIds).map(Number).filter(Number.isFinite);
  return {
    id: entry.id,
    orbionId: entry.orbionId,
    slug: entry.slug,
    canonicalName: entry.canonicalName,
    acronym: entry.acronym,
    aliases: normalizeStringArray(entry.aliases),
    publicTeaser: catalogTeaser(entry),
    isPublicPreview: entry.isPublicPreview,
    isLocked: !entry.isPublicPreview,
    reviewStatus: entry.reviewStatus,
    domains: domainIds.map(id => domainsById.get(id)).filter(Boolean).map(domain => ({
      id: domain!.id,
      slug: domain!.slug,
      name: domain!.name,
    })),
    updatedAt: entry.updatedAt,
  };
}

export function lockedEntryPayload(entry: ReturnType<typeof catalogEntry>) {
  return entry;
}

export function publicPreviewEntryPayload(entry: CatalogEntry, domainsById: Map<number, Domain>) {
  const relatedSlugs = normalizeStringArray(entry.publicPreviewRelatedSlugs);
  return {
    ...catalogEntry(entry, domainsById),
    isLocked: false,
    preview: {
      definition: entry.publicPreviewDefinition,
      whyItMatters: entry.publicPreviewWhyItMatters,
      relatedSlugs,
    },
  };
}

async function canReadPremium(userId: number | undefined) {
  if (!userId) return false;
  return Boolean(await getActiveLexiconEntitlement(userId));
}

export const lexiconRouter = router({
  summary: publicProcedure.query(async () => {
    const [entries, domainRecords] = await Promise.all([listLexiconCatalogEntries(), listLexiconDomains()]);
    return {
      entryCount: entries.length,
      domainCount: domainRecords.length,
      previewEntryCount: entries.filter(entry => entry.isPublicPreview).length,
      lockedEntryCount: entries.filter(entry => !entry.isPublicPreview).length,
    };
  }),

  list: publicProcedure.input(listInput).query(async ({ input }) => {
    const [entries, domainRecords] = await Promise.all([listLexiconCatalogEntries(), listLexiconDomains()]);
    const domainsById = domainMap(domainRecords);
    const selectedDomain = input.domain ? domainRecords.find(domain => domain.slug === input.domain) : undefined;
    const letter = input.letter?.toLocaleUpperCase();

    const results = entries
      .filter(entry => {
        const entryDomainIds = normalizeStringArray(entry.domainIds).map(Number);
        if (selectedDomain && !entryDomainIds.includes(selectedDomain.id)) return false;
        if (letter && !entry.canonicalName.toLocaleUpperCase().startsWith(letter)) return false;
        if (input.acronymOnly && !entry.acronym) return false;
        if (input.query && scoreLexiconMatch(entry, input.query).score === 0) return false;
        return true;
      })
      .map(entry => ({ ...catalogEntry(entry, domainsById), score: input.query ? scoreLexiconMatch(entry, input.query).score : undefined }))
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0) || left.canonicalName.localeCompare(right.canonicalName))
      .slice(0, input.limit);

    return { results, total: results.length };
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(192) })).query(async ({ input, ctx }) => {
    const catalog = await getLexiconCatalogEntryBySlug(input.slug);
    if (!catalog) throw new TRPCError({ code: "NOT_FOUND", message: "Lexicon term not found." });

    const [domainRecords, memberAccess] = await Promise.all([listLexiconDomains(), canReadPremium(ctx.user?.id)]);
    const domainsById = domainMap(domainRecords);
    const publicEntry = catalogEntry(catalog, domainsById);

    const hasApprovedPreview = Boolean(catalog.isPublicPreview && catalog.publicPreviewDefinition);
    if (!memberAccess && !hasApprovedPreview) {
      return {
        access: "locked" as const,
        entry: lockedEntryPayload(publicEntry),
        relatedEntries: [],
        sources: [],
      };
    }

    if (!memberAccess) {
      const allCatalogEntries = await listLexiconCatalogEntries();
      const relatedSlugs = normalizeStringArray(catalog.publicPreviewRelatedSlugs);
      return {
        access: "preview" as const,
        entry: publicPreviewEntryPayload(catalog, domainsById),
        relatedEntries: allCatalogEntries.filter(candidate => relatedSlugs.includes(candidate.slug)).map(candidate => catalogEntry(candidate, domainsById)),
        sources: [],
      };
    }

    const entry = await getLexiconEntryBySlug(input.slug);
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Lexicon term not found." });
    const relatedIds = normalizeStringArray(entry.relatedEntryIds).map(Number).filter(Number.isFinite);
    const allCatalogEntries = await listLexiconCatalogEntries();
    const sourceRecords = await listSourcesByOrbionIds(normalizeStringArray(entry.primaryReferenceIds));

    return {
      access: "member" as const,
      entry: { ...publicEntry, isLocked: false },
      premium: {
        fullDefinition: entry.fullDefinition,
        whyItMatters: entry.whyItMatters,
        industryExample: entry.industryExample,
        dontConfuse: entry.dontConfuse,
        connectedConcepts: normalizeStringArray(entry.connectedConcepts),
        keyFacts: normalizeStringArray(entry.keyFacts),
        evidenceStrength: entry.evidenceStrength,
        bookReference: entry.bookReference,
      },
      relatedEntries: allCatalogEntries.filter(candidate => relatedIds.includes(candidate.id)).map(candidate => catalogEntry(candidate, domainsById)),
      sources: sourceRecords.map(source => ({
        orbionId: source.orbionId,
        title: source.title,
        publisher: source.publisher,
        sourceType: source.sourceType,
        locator: source.locator,
        rightsStatus: source.rightsStatus,
      })),
    };
  }),

  domains: publicProcedure.query(async () => listLexiconDomains()),

  getDomain: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(128) })).query(async ({ input }) => {
    const [domainRecords, entries] = await Promise.all([listLexiconDomains(), listLexiconCatalogEntries()]);
    const domain = domainRecords.find(candidate => candidate.slug === input.slug);
    if (!domain) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found." });
    const domainsById = domainMap(domainRecords);
    const domainEntries = entries
      .filter(entry => normalizeStringArray(entry.domainIds).map(Number).includes(domain.id))
      .map(entry => catalogEntry(entry, domainsById));
    return { domain, entries: domainEntries };
  }),

  search: publicProcedure.input(searchInput).query(async ({ input }) => {
    const [entries, domainRecords] = await Promise.all([listLexiconCatalogEntries(), listLexiconDomains()]);
    const domainsById = domainMap(domainRecords);
    const entryResults = entries
      .map(entry => ({ entry: catalogEntry(entry, domainsById), ...scoreLexiconMatch(entry, input.query) }))
      .filter(result => result.score > 0)
      .sort((left, right) => right.score - left.score || left.entry.canonicalName.localeCompare(right.entry.canonicalName))
      .slice(0, input.limit);
    const domainResults = domainRecords
      .map(domain => {
        const query = searchValue(input.query);
        const name = searchValue(domain.name);
        const description = searchValue(domain.description);
        const score = name === query ? 80 : name.includes(query) ? 50 : description.includes(query) ? 20 : 0;
        return { domain, score };
      })
      .filter(result => result.score > 0)
      .sort((left, right) => right.score - left.score || left.domain.name.localeCompare(right.domain.name));
    return { entries: entryResults, domains: domainResults };
  }),

  /** Source records are premium evidence material and never returned to logged-out visitors. */
  sources: publicProcedure.input(z.object({ query: z.string().trim().min(1).max(120).optional() })).query(async ({ input, ctx }) => {
    if (!(await canReadPremium(ctx.user?.id))) {
      return { access: "locked" as const, results: [] };
    }
    const sourceRecords = await listLexiconSources();
    const query = input.query ? searchValue(input.query) : "";
    return {
      access: "member" as const,
      results: sourceRecords.filter(source => !query || searchValue(`${source.orbionId} ${source.title} ${source.publisher ?? ""}`).includes(query)),
    };
  }),
});
