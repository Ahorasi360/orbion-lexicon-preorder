import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = process.argv[2] ?? path.resolve(__dirname, "../data/lexicon-seed.json");
const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) throw new Error("DATABASE_URL is required to import Lexicon content.");

const seed = JSON.parse(await readFile(seedPath, "utf8"));
const connection = await mysql.createConnection(connectionUrl);

try {
  await connection.beginTransaction();

  for (const domain of seed.domains) {
    await connection.execute(
      `INSERT INTO domains (slug, name, description, parent_domain_id, related_domain_ids, entry_count)
       VALUES (?, ?, ?, NULL, ?, 0)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), related_domain_ids = VALUES(related_domain_ids)`,
      [domain.slug, domain.name, domain.description, JSON.stringify(domain.relatedDomainSlugs)],
    );
  }

  const [domainRows] = await connection.query("SELECT id, slug FROM domains");
  const domainIdBySlug = new Map(domainRows.map(row => [row.slug, row.id]));

  for (const source of seed.sources) {
    await connection.execute(
      `INSERT INTO sources (orbion_id, title, publisher, author, publication_date, source_type, locator, rights_status, retrieved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE title = VALUES(title), publisher = VALUES(publisher), author = VALUES(author), publication_date = VALUES(publication_date), source_type = VALUES(source_type), locator = VALUES(locator), rights_status = VALUES(rights_status)`,
      [
        source.orbionId,
        source.title,
        source.publisher,
        source.author,
        source.publicationDate,
        source.sourceType,
        source.locator,
        source.rightsStatus,
      ],
    );
  }

  for (const entry of seed.entries) {
    const domainIds = entry.domainSlugs.map(slug => domainIdBySlug.get(slug)).filter(Boolean);
    await connection.execute(
      `INSERT INTO lexicon_entries (
        orbion_id, slug, canonical_name, acronym, aliases, short_definition, full_definition, why_it_matters,
        industry_example, dont_confuse, connected_concepts, domain_ids, related_entry_ids, key_facts,
        visual_assets, primary_reference_ids, evidence_strength, review_status, book_reference, source_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        canonical_name = VALUES(canonical_name), acronym = VALUES(acronym), aliases = VALUES(aliases),
        short_definition = VALUES(short_definition), full_definition = VALUES(full_definition), why_it_matters = VALUES(why_it_matters),
        industry_example = VALUES(industry_example), dont_confuse = VALUES(dont_confuse), connected_concepts = VALUES(connected_concepts),
        domain_ids = VALUES(domain_ids), related_entry_ids = VALUES(related_entry_ids), key_facts = VALUES(key_facts),
        visual_assets = VALUES(visual_assets), primary_reference_ids = VALUES(primary_reference_ids), evidence_strength = VALUES(evidence_strength),
        review_status = VALUES(review_status), book_reference = VALUES(book_reference), source_text = VALUES(source_text)`,
      [
        entry.orbionId,
        entry.slug,
        entry.canonicalName,
        entry.acronym,
        JSON.stringify(entry.aliases),
        entry.shortDefinition,
        entry.fullDefinition,
        entry.whyItMatters,
        entry.industryExample,
        entry.dontConfuse,
        JSON.stringify(entry.connectedConcepts),
        JSON.stringify(domainIds),
        JSON.stringify([]),
        JSON.stringify(entry.keyFacts),
        JSON.stringify(entry.visualAssets),
        JSON.stringify(entry.primaryReferenceIds),
        entry.evidenceStrength,
        entry.reviewStatus,
        entry.bookReference,
        entry.sourceText,
      ],
    );
  }

  const [entryRows] = await connection.query("SELECT id, orbion_id, canonical_name, connected_concepts, primary_reference_ids FROM lexicon_entries");
  const entryIdByCanonicalName = new Map(entryRows.map(row => [normalizeKey(row.canonical_name), row.id]));
  const [sourceRows] = await connection.query("SELECT id, orbion_id FROM sources");
  const sourceIdByOrbionId = new Map(sourceRows.map(row => [row.orbion_id, row.id]));
  const [existingRelations] = await connection.query("SELECT subject_id, predicate, object_id FROM relations WHERE predicate = 'related_concept'");
  const existingRelationKeys = new Set(existingRelations.map(row => `${row.subject_id}:${row.predicate}:${row.object_id}`));

  for (const entry of entryRows) {
    const connectedConcepts = parseJsonArray(entry.connected_concepts);
    const sourceIds = parseJsonArray(entry.primary_reference_ids)
      .map(orbionId => sourceIdByOrbionId.get(orbionId))
      .filter(Boolean);
    const relatedEntryIds = [];

    for (const concept of connectedConcepts) {
      const objectId = entryIdByCanonicalName.get(normalizeKey(concept));
      if (!objectId || objectId === entry.id) continue;
      relatedEntryIds.push(objectId);
      const relationKey = `${entry.id}:related_concept:${objectId}`;
      if (existingRelationKeys.has(relationKey)) continue;
      await connection.execute(
        "INSERT INTO relations (subject_id, predicate, object_id, source_ids) VALUES (?, 'related_concept', ?, ?)",
        [entry.id, objectId, JSON.stringify(sourceIds)],
      );
      existingRelationKeys.add(relationKey);
    }

    await connection.execute("UPDATE lexicon_entries SET related_entry_ids = ? WHERE id = ?", [JSON.stringify(relatedEntryIds), entry.id]);
  }

  const entryCountByDomainId = new Map();
  for (const entry of seed.entries) {
    for (const slug of entry.domainSlugs) {
      const domainId = domainIdBySlug.get(slug);
      if (domainId) entryCountByDomainId.set(domainId, (entryCountByDomainId.get(domainId) ?? 0) + 1);
    }
  }
  for (const [domainId, entryCount] of entryCountByDomainId) {
    await connection.execute("UPDATE domains SET entry_count = ? WHERE id = ?", [entryCount, domainId]);
  }

  await connection.commit();
  console.log(`Imported ${seed.entries.length} review-pending entries, ${seed.domains.length} domains, and ${seed.sources.length} source records.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

function normalizeKey(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return JSON.parse(value);
}
