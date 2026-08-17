import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const defaultManuscriptPath = "/home/ubuntu/upload/The_Orbion_Space_Lexicon_Full_First_Edition_Review_Manuscript_v0.9_Approved_Pilot_Style(1).pdf";
const outputPath = path.join(projectRoot, "data", "lexicon-seed.json");
const manuscriptPath = process.argv[2] ?? defaultManuscriptPath;
const domainConfig = [
  ["spaceflight-foundations-physics", "Spaceflight Foundations & Physics", "001-022"],
  ["orbital-mechanics-regimes", "Orbital Mechanics & Regimes", "023-054"],
  ["launch-vehicles-propulsion", "Launch Vehicles & Propulsion", "055-094"],
  ["spacecraft-satellite-systems", "Spacecraft & Satellite Systems", "095-134"],
  ["payloads-scientific-instruments", "Payloads & Scientific Instruments", "135-156"],
  ["mission-design-integration-operations", "Mission Design, Integration & Operations", "157-186"],
  ["ground-segment-mission-control", "Ground Segment & Mission Control", "187-206"],
  ["communications-spectrum-networks", "Communications, Spectrum & Networks", "207-236"],
  ["navigation-timing-pnt", "Navigation, Timing & PNT", "237-252"],
  ["earth-observation-remote-sensing", "Earth Observation & Remote Sensing", "253-282"],
  ["human-spaceflight-habitats", "Human Spaceflight & Habitats", "283-302"],
  ["space-safety-debris-sustainability", "Space Safety, Debris & Sustainability", "303-324"],
  ["space-law-policy-licensing-regulation", "Space Law, Policy, Licensing & Regulation", "325-356"],
  ["export-controls-security-compliance", "Export Controls, Security & Compliance", "357-372"],
  ["manufacturing-testing-supply-chain", "Manufacturing, Testing & Supply Chain", "373-396"],
  ["commercial-models-contracts-procurement", "Commercial Models, Contracts & Procurement", "397-422"],
  ["finance-investment-space-economics", "Finance, Investment & Space Economics", "423-442"],
  ["agencies-institutions-industry-structure", "Agencies, Institutions & Industry Structure", "443-460"],
  ["emerging-markets-in-space-services", "Emerging Markets & In-Space Services", "461-484"],
  ["strategy-data-intelligence-space", "Strategy, Data & Intelligence for Space", "485-500"],
].map(([slug, name, range]) => ({
  slug,
  name,
  entryRange: range,
  description: `Entries ${range.replace("-", "–")} in the manuscript's editorial teaching sequence.`,
}));

const headingNames = [
  "IN PLAIN ENGLISH",
  "TECHNICAL MEANING",
  "WHY IT MATTERS",
  "INDUSTRY EXAMPLE",
  "DON'T CONFUSE",
  "CONNECTED CONCEPTS",
  "EVIDENCE STRENGTH",
  "PRIMARY REFERENCES",
];

const normalizeForMatch = value => value.replace(/[’]/g, "'").replace(/\s+/g, " ").trim().toUpperCase();
const normalizeSlug = value =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cleanCell = value =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^FIRST EDITION\s+\d{4}\s+·\s+ANTHONY GALEANO\s+·\s+FOUNDER, ORBION$/i, "")
    .replace(/^THE ORBION SPACE LEXICON$/i, "")
    .replace(/^\d+$/, "");

const cellAt = (line, column, columnBreak) => cleanCell(column === "left" ? line.slice(0, columnBreak) : line.slice(columnBreak));

function headingIndex(lines, heading, column, columnBreak) {
  const normalizedHeading = normalizeForMatch(heading);
  return lines.findIndex(line => normalizeForMatch(cellAt(line, column, columnBreak)).includes(normalizedHeading));
}

function hasHeading(value) {
  const normalized = normalizeForMatch(value);
  return headingNames.some(heading => normalized.includes(normalizeForMatch(heading)));
}

function section(lines, heading, column, columnBreak, fullWidth = false) {
  const index = headingIndex(lines, heading, column, columnBreak);
  if (index < 0) return "";

  const headingPattern = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]")}\\s*`, "i");
  const initial = fullWidth ? cleanCell(lines[index]) : cellAt(lines[index], column, columnBreak);
  const values = [initial.replace(headingPattern, "").trim()];

  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const leftValue = cellAt(lines[cursor], "left", columnBreak);
    const rightValue = cellAt(lines[cursor], "right", columnBreak);
    const value = fullWidth ? cleanCell(lines[cursor]) : column === "left" ? leftValue : rightValue;
    if (!value) continue;
    if (hasHeading(leftValue) || hasHeading(rightValue) || /^ENTRY\s+\d{3}/i.test(leftValue) || /^FIRST EDITION\s+\d{4}/i.test(leftValue)) break;
    values.push(value);
  }

  return values.filter(Boolean).join(" ").replace(/\s+([,.;:])/g, "$1").trim();
}

function parseReferences(referenceText) {
  const normalized = referenceText.replace(/PRIMARY REFERENCES/i, "").replace(/\s+/g, " ").trim();
  const matches = [...normalized.matchAll(/(SRC-\d{3})\s+(.+?)(?=\s+·?\s*SRC-\d{3}\s+|$)/g)];

  return matches.map(([, orbionId, rawTitle]) => {
    const title = rawTitle.replace(/^·\s*/, "").trim();
    const separator = title.indexOf(":");
    const publisher = separator > 0 ? title.slice(0, separator).trim() : null;
    return {
      orbionId,
      title,
      publisher,
      author: null,
      publicationDate: null,
      sourceType: "manuscript_reference",
      locator: null,
      rightsStatus: "pending_review",
      retrievedAt: null,
    };
  });
}

function parseEntry(block) {
  const lines = block.split("\n");
  const entryLineIndex = lines.findIndex(line => /ENTRY\s+\d{3}\s+·\s+OSL-\d{4}/.test(line));
  if (entryLineIndex < 0) return null;

  const entryLine = lines[entryLineIndex];
  const entryMatch = entryLine.match(/ENTRY\s+(\d{3})\s+·\s+(OSL-\d{4})/);
  if (!entryMatch) return null;
  const [, entryNumber, orbionId] = entryMatch;
  const entryMatchEnd = entryLine.indexOf(entryMatch[0]) + entryMatch[0].length;
  const domainName = entryLine.slice(entryMatchEnd).trim();
  const twoColumnHeadingLine = lines.find(line => /IN PLAIN ENGLISH/.test(line) && /TECHNICAL MEANING/.test(line));
  const columnBreak = twoColumnHeadingLine?.indexOf("TECHNICAL MEANING") ?? 75;

  let canonicalName = "";
  for (let index = entryLineIndex + 1; index < Math.min(entryLineIndex + 6, lines.length); index += 1) {
    const candidate = cellAt(lines[index], "left", columnBreak);
    if (candidate && !hasHeading(candidate)) {
      canonicalName = candidate;
      break;
    }
  }

  const inPlainEnglish = section(lines, "IN PLAIN ENGLISH", "left", columnBreak);
  const technicalMeaning = section(lines, "TECHNICAL MEANING", "right", columnBreak);
  const whyItMatters = section(lines, "WHY IT MATTERS", "left", columnBreak);
  const industryExample = section(lines, "INDUSTRY EXAMPLE", "right", columnBreak);
  const dontConfuse = section(lines, "DON'T CONFUSE", "left", columnBreak, true);
  const connectedText = section(lines, "CONNECTED CONCEPTS", "left", columnBreak);
  const evidenceText = section(lines, "EVIDENCE STRENGTH", "right", columnBreak);
  const referencesText = section(lines, "PRIMARY REFERENCES", "left", columnBreak, true);
  const evidenceStars = (evidenceText.match(/★/g) ?? []).length;
  const connectedConcepts = connectedText
    .split("•")
    .map(value => value.trim())
    .filter(Boolean);
  const primaryReferences = parseReferences(referencesText);
  const domain = domainConfig.find(item => normalizeForMatch(item.name) === normalizeForMatch(domainName));

  return {
    orbionId,
    entryNumber,
    slug: normalizeSlug(canonicalName),
    canonicalName,
    acronym: null,
    aliases: [],
    shortDefinition: inPlainEnglish,
    fullDefinition: technicalMeaning,
    whyItMatters,
    industryExample: industryExample || null,
    dontConfuse: dontConfuse || null,
    connectedConcepts,
    domainSlugs: domain ? [domain.slug] : [],
    relatedEntryIds: [],
    keyFacts: [],
    visualAssets: [],
    primaryReferenceIds: primaryReferences.map(reference => reference.orbionId),
    evidenceStrength: evidenceStars || 1,
    evidenceNote: evidenceText.replace(/[★☆]/g, "").trim() || null,
    reviewStatus: "review_pending",
    bookReference: `Entry ${entryNumber} · ${orbionId}`,
    sourceText: block.trim(),
    parserWarnings: [
      !canonicalName && "missing canonical name",
      !inPlainEnglish && "missing In Plain English",
      !technicalMeaning && "missing Technical Meaning",
      !whyItMatters && "missing Why It Matters",
      !domain && `unmapped domain: ${domainName || "unknown"}`,
    ].filter(Boolean),
    primaryReferences,
  };
}

const manuscriptText = execFileSync("pdftotext", ["-layout", manuscriptPath, "-"], {
  encoding: "utf8",
  maxBuffer: 40 * 1024 * 1024,
});
const entryBlocks = manuscriptText.split(/(?=\s*ENTRY\s+\d{3}\s+·\s+OSL-\d{4})/g);
const parsedEntries = entryBlocks.map(parseEntry).filter(Boolean);

if (parsedEntries.length !== 500) {
  throw new Error(`Expected 500 entries from the approved manuscript; parsed ${parsedEntries.length}. Review the source PDF or parser before importing.`);
}

const sourceByOrbionId = new Map();
for (const entry of parsedEntries) {
  for (const source of entry.primaryReferences) {
    const existing = sourceByOrbionId.get(source.orbionId);
    if (!existing || source.title.length > existing.title.length) sourceByOrbionId.set(source.orbionId, source);
  }
}

const seed = {
  metadata: {
    title: "The Orbion Space Lexicon",
    sourceManuscript: path.basename(manuscriptPath),
    sourceStatus: "review-not-publication-final",
    contentRule: "Generated from approved manuscript text without editorial rewriting. Records remain review_pending until independently approved for publication.",
    generatedAt: new Date().toISOString(),
  },
  domains: domainConfig.map(item => ({ ...item, relatedDomainSlugs: [] })),
  sources: [...sourceByOrbionId.values()],
  entries: parsedEntries.map(({ primaryReferences, ...entry }) => entry),
  relations: [],
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

const warningCount = seed.entries.reduce((count, entry) => count + entry.parserWarnings.length, 0);
console.log(`Wrote ${seed.entries.length} review-pending Lexicon entries, ${seed.domains.length} domains, and ${seed.sources.length} source records to ${path.relative(projectRoot, outputPath)}.`);
console.log(`Parser warnings requiring review: ${warningCount}.`);
