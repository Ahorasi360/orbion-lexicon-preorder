import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { EntryCard, type LexiconCardEntry, type LexiconDomain } from "@/components/LexiconCards";
import PlatformShell from "@/components/PlatformShell";
import { trpc } from "@/lib/trpc";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function LexiconPage() {
  const initialDomain = new URLSearchParams(window.location.search).get("domain") || undefined;
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string | undefined>(initialDomain);
  const [letter, setLetter] = useState<string | undefined>();
  const { data, isLoading } = trpc.lexicon.list.useQuery({ limit: 500 });
  const { data: domains } = trpc.lexicon.domains.useQuery();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const results = useMemo(() => (data?.results ?? []).filter((entry: LexiconCardEntry) => {
    const matchesDomain = !domain || entry.domains.some(item => item.slug === domain);
    const matchesLetter = !letter || entry.canonicalName.toLocaleUpperCase().startsWith(letter);
    const searchable = [entry.canonicalName, entry.acronym ?? "", entry.publicTeaser, ...entry.aliases, ...entry.domains.map(item => item.name)].join(" ").toLocaleLowerCase();
    return matchesDomain && matchesLetter && (!normalizedQuery || searchable.includes(normalizedQuery));
  }), [data, domain, letter, normalizedQuery]);
  const activeFilter = [letter ? `Starts with ${letter}` : "", domain ? (domains ?? []).find((item: LexiconDomain) => item.slug === domain)?.name ?? "" : "", normalizedQuery ? `“${query.trim()}”` : ""].filter(Boolean).join(" · ");

  const clearFilters = () => { setQuery(""); setDomain(undefined); setLetter(undefined); };

  return (
    <PlatformShell>
      <section className="page-hero compact-hero"><div className="platform-container"><p className="platform-kicker">ORBION ONLINE LEXICON</p><h1>Explore the language<br /><em>of the space industry.</em></h1><p>Search connected terms, acronyms, aliases, and domains across the first-edition vocabulary.</p></div></section>
      <section className="lexicon-browser"><div className="platform-container">
        <div className="lexicon-search-row"><div className="lexicon-search"><Search size={19} aria-hidden="true" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search terms, acronyms, aliases, or domains" aria-label="Search terms" autoComplete="off" />{query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button> : null}</div><span>{isLoading ? "Loading Lexicon…" : `${results.length} of ${data?.results.length ?? 0} terms`}</span></div>
        {activeFilter ? <p className="active-lexicon-filter" role="status">Showing: <strong>{activeFilter}</strong> <button type="button" onClick={clearFilters}>Clear all</button></p> : null}
        <nav className="letter-nav" aria-label="Filter Lexicon by initial letter"><button type="button" className={!letter ? "active" : ""} aria-pressed={!letter} onClick={() => setLetter(undefined)}>All</button>{alphabet.map(item => <button type="button" key={item} className={letter === item ? "active" : ""} aria-pressed={letter === item} onClick={() => setLetter(letter === item ? undefined : item)}>{item}</button>)}</nav>
        <div className="domain-filter"><div><SlidersHorizontal size={15} aria-hidden="true" /><span>Domain</span></div><div className="filter-pills"><button type="button" className={!domain ? "active" : ""} onClick={() => setDomain(undefined)}>All domains</button>{(domains ?? []).map((item: LexiconDomain) => <button type="button" key={item.id} className={domain === item.slug ? "active" : ""} onClick={() => setDomain(domain === item.slug ? undefined : item.slug)}>{item.name}</button>)}</div></div>
        {results.length ? <div className="entry-grid light-grid" aria-live="polite">{results.map((entry: LexiconCardEntry) => <EntryCard key={entry.orbionId} entry={entry} />)}</div> : <div className="empty-lexicon"><p>No terms match this combination.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>}
        <p className="review-disclosure">Current records originate from the First Edition review manuscript and retain their editorial review status.</p>
      </div></section>
      <section className="next-stop"><div className="platform-container"><p>Looking for the broader context?</p><Link href="/domains">Explore by domain →</Link></div></section>
    </PlatformShell>
  );
}
