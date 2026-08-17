import { ArrowUpRight, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export type LexiconCardEntry = {
  orbionId: string;
  slug: string;
  canonicalName: string;
  acronym: string | null;
  shortDefinition: string;
  evidenceStrength: number;
  reviewStatus: string;
  domains: { id: number; slug: string; name: string }[];
};

export type LexiconDomain = {
  id: number;
  slug: string;
  name: string;
  description: string;
  entryCount: number;
};

export function EvidenceMark({ strength }: { strength: number }) {
  return (
    <span className="evidence-mark" aria-label={`Evidence strength ${strength} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < strength ? "★" : "☆"}</span>)}
    </span>
  );
}

export function EntryCard({ entry, showMatch }: { entry: LexiconCardEntry; showMatch?: string }) {
  return (
    <Link href={`/lexicon/${entry.slug}`} className="entry-card">
      <div className="entry-card-topline">
        <span>{entry.orbionId}</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
      <h3>{entry.canonicalName}{entry.acronym ? <small>{entry.acronym}</small> : null}</h3>
      <p>{entry.shortDefinition}</p>
      <div className="entry-card-foot">
        <span>{entry.domains[0]?.name ?? "Orbion Lexicon"}</span>
        <EvidenceMark strength={entry.evidenceStrength} />
      </div>
      {showMatch ? <span className="search-match">{showMatch}</span> : null}
    </Link>
  );
}

export function DomainCard({ domain }: { domain: LexiconDomain }) {
  return (
    <Link href={`/domains/${domain.slug}`} className="domain-card">
      <div className="domain-card-orbit" aria-hidden="true"><span /></div>
      <span className="domain-card-index">{String(domain.id).padStart(2, "0")}</span>
      <h3>{domain.name}</h3>
      <p>{domain.description}</p>
      <div><span>{domain.entryCount} entries</span><ChevronRight size={17} aria-hidden="true" /></div>
    </Link>
  );
}

export function ReadingStatus() {
  return (
    <div className="reading-status">
      <BookOpen size={15} aria-hidden="true" />
      <span>First Edition review manuscript · source-aware Lexicon</span>
    </div>
  );
}
