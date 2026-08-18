import { ArrowRight, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { EntryCard, type LexiconCardEntry } from "@/components/LexiconCards";
import PlatformShell from "@/components/PlatformShell";
import { trackEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const [submittedQuery, setSubmittedQuery] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const { data, isFetching } = trpc.lexicon.search.useQuery({ query: submittedQuery.trim() || "space" }, { enabled: Boolean(submittedQuery.trim()) });

  useEffect(() => { if (submittedQuery.trim()) trackEvent("lexicon_search", { queryLength: submittedQuery.trim().length }); }, [submittedQuery]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = query.trim(); setSubmittedQuery(value); setLocation(value ? `/search?q=${encodeURIComponent(value)}` : "/search"); };

  return <PlatformShell>
    <section className="search-page-hero"><div className="platform-container"><p className="platform-kicker">GLOBAL SEARCH</p><h1>Find a concept.<br /><em>Follow the connection.</em></h1><form onSubmit={submit} className="search-page-form"><Search size={20} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Try Spaceflight, PNT, orbital, licensing…" aria-label="Search the Orbion Lexicon" autoFocus /><button type="submit">Search <ArrowRight size={15} /></button></form></div></section>
    <section className="search-results"><div className="platform-container">{submittedQuery ? <><p className="results-count">{isFetching ? "Searching…" : `${(data?.entries.length ?? 0) + (data?.domains.length ?? 0)} catalog results for “${submittedQuery}”`}</p>{data?.domains.length ? <div className="domain-result-group"><p className="entry-section-label">DOMAINS</p>{data.domains.map(result => <Link className="domain-result" key={result.domain.id} href={`/domains/${result.domain.slug}`}><span>DOMAIN</span><strong>{result.domain.name}</strong><p>{result.domain.description}</p><ArrowRight size={16} /></Link>)}</div> : null}{data?.entries.length ? <><p className="entry-section-label results-section-label">LEXICON TERMS</p><div className="entry-grid light-grid">{data.entries.map(result => <EntryCard key={result.entry.orbionId} entry={result.entry as LexiconCardEntry} showMatch={result.match} />)}</div></> : !isFetching ? <div className="empty-lexicon"><p>No terms or domains match this search.</p><Link href="/lexicon">Browse the Lexicon catalog →</Link></div> : null}</> : <div className="search-suggestions"><p>Search recognizes canonical terms, aliases, acronyms, approved public teasers, and domains. Full explanations are available with Online Lexicon access.</p><div><button type="button" onClick={() => { setQuery("Spaceflight"); setSubmittedQuery("Spaceflight"); }}>Spaceflight</button><button type="button" onClick={() => { setQuery("launch"); setSubmittedQuery("launch"); }}>Launch</button><button type="button" onClick={() => { setQuery("space law"); setSubmittedQuery("space law"); }}>Space law</button></div></div>}</div></section>
  </PlatformShell>;
}
