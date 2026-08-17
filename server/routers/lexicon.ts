import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Domain, LexiconEntry } from "../../drizzle/schema";
import {
  getLexiconEntryBySlug,
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

export function scoreLexiconMatch(entry: LexiconEntry, rawQuery: string) {
  const query = searchValue(rawQuery);
  if (!query) return { score: 0, match: "" };

  const canonicalName = searchValue(entry.canonicalName);
  const acronym = searchValue(entry.acronym ?? "");
  const aliases = normalizeStringArray(entry.aliases);
  const connectedConcepts = normalizeStringArray(entry.connectedConcepts);
  const definition = searchValue(`${entry.shortDefinition} ${entry.fullDefinition}`);

  if (canonicalName === query) return { score: 100, match: "Exact term match" };
  if (acronym === query) return { score: 95, match: "Acronym match" };
  if (aliases.some(alias => searchValue(alias) === query)) return { score: 90, match: "Alias match" };
  if (canonicalName.startsWith(query)) return { score: 80, match: "Term begins with your search" };
  if (aliases.some(alias => searchValue(alias).includes(query))) return { score: 70, match: "Alias contains your search" };
  if (canonicalName.includes(query)) return { score: 65, match: "Term contains your search" };
  if (connectedConcepts.some(concept => searchValue(concept).includes(query))) return { score: 45, match: "Connected concept match" };
  if (definition.includes(query)) return { score: 25, match: "Definition match" };
  return { score: 0, match: "" };
}

function domainMap(domains: Domain[]) {
  return new Map(domains.map(domain => [domain.id, domain]));
}

function compactEntry(entry: LexiconEntry, domainsById: Map<number, Domain>) {
  const domainIds = normalizeStringArray(entry.domainIds).map(Number).filter(Number.isFinite);
  return {
    id: entry.id,
    orbionId: entry.orbionId,
    slug: entry.slug,
    canonicalName: entry.canonicalName,
    acronym: entry.acronym,
    aliases: normalizeStringArray(entry.aliases),
    shortDefinition: entry.shortDefinition,
    evidenceStrength: entry.evidenceStrength,
    reviewStatus: entry.reviewStatus,
    bookReference: entry.bookReference,
    domains: domainIds.map(id => domainsById.get(id)).filter(Boolean).map(domain => ({
      id: domain!.id,
      slug: domain!.slug,
      name: domain!.name,
    })),
  };
}

export const lexiconRouter = router({
  summary: publicProcedure.query(async () => {
    const [entries, domainRecords, sourceRecords] = await Promise.all([
      listLexiconEntries(),
      listLexiconDomains(),
      listLexiconSources(),
    ]);
    return {
      entryCount: entries.length,
      domainCount: domainRecords.length,
      sourceCount: sourceRecords.length,
      reviewPendingCount: entries.filter(entry => entry.reviewStatus === "review_pending").length,
    };
  }),

  list: publicProcedure.input(listInput).query(async ({ input }) => {
    const [entries, domainRecords] = await Promise.all([listLexiconEntries(), listLexiconDomains()]);
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
      .map(entry => ({ ...compactEntry(entry, domainsById), score: input.query ? scoreLexiconMatch(entry, input.query).score : undefined }))
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0) || left.canonicalName.localeCompare(right.canonicalName))
      .slice(0, input.limit);

    return { results, total: results.length };
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(192) })).query(async ({ input }) => {
    const entry = await getLexiconEntryBySlug(input.slug);
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Lexicon term not found." });

    const [allEntries, domainRecords] = await Promise.all([listLexiconEntries(), listLexiconDomains()]);
    const domainsById = domainMap(domainRecords);
    const relatedIds = normalizeStringArray(entry.relatedEntryIds).map(Number).filter(Number.isFinite);
    const referenceIds = normalizeStringArray(entry.primaryReferenceIds);
    const [sourceRecords] = await Promise.all([listSourcesByOrbionIds(referenceIds)]);

    return {
      entry: {
        ...compactEntry(entry, domainsById),
        fullDefinition: entry.fullDefinition,
        whyItMatters: entry.whyItMatters,
        industryExample: entry.industryExample,
        dontConfuse: entry.dontConfuse,
        connectedConcepts: normalizeStringArray(entry.connectedConcepts),
        keyFacts: normalizeStringArray(entry.keyFacts),
        updatedAt: entry.updatedAt,
      },
      relatedEntries: allEntries.filter(candidate => relatedIds.includes(candidate.id)).map(candidate => compactEntry(candidate, domainsById)),
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
    const [domainRecords, entries] = await Promise.all([listLexiconDomains(), listLexiconEntries()]);
    const domain = domainRecords.find(candidate => candidate.slug === input.slug);
    if (!domain) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found." });
    const domainsById = domainMap(domainRecords);
    const domainEntries = entries
      .filter(entry => normalizeStringArray(entry.domainIds).map(Number).includes(domain.id))
      .map(entry => compactEntry(entry, domainsById));
    return { domain, entries: domainEntries };
  }),

  search: publicProcedure.input(searchInput).query(async ({ input }) => {
    const [entries, domainRecords] = await Promise.all([listLexiconEntries(), listLexiconDomains()]);
    const domainsById = domainMap(domainRecords);
    const entryResults = entries
      .map(entry => ({ entry: compactEntry(entry, domainsById), ...scoreLexiconMatch(entry, input.query) }))
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

  sources: publicProcedure.input(z.object({ query: z.string().trim().min(1).max(120).optional() })).query(async ({ input }) => {
    const sourceRecords = await listLexiconSources();
    const query = input.query ? searchValue(input.query) : "";
    return sourceRecords.filter(source => !query || searchValue(`${source.orbionId} ${source.title} ${source.publisher ?? ""}`).includes(query));
  }),
});
