import { ArrowRight, Compass, Network, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { DomainCard, EntryCard, type LexiconCardEntry, type LexiconDomain, ReadingStatus } from "@/components/LexiconCards";
import PlatformShell from "@/components/PlatformShell";
import { trpc } from "@/lib/trpc";

const FEATURED_INPUT = { limit: 6 };

export default function PlatformHome() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { data: summary } = trpc.lexicon.summary.useQuery();
  const { data: featured } = trpc.lexicon.list.useQuery(FEATURED_INPUT);
  const { data: domains } = trpc.lexicon.domains.useQuery();
  const selectedDomains = useMemo(() => (domains ?? []).slice(0, 6) as LexiconDomain[], [domains]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim();
    setLocation(normalized ? `/search?q=${encodeURIComponent(normalized)}` : "/search");
  };

  return (
    <PlatformShell>
      <section className="platform-hero">
        <div className="platform-container platform-hero-grid">
          <div className="platform-hero-copy">
            <p className="platform-kicker">ORBION ONLINE LEXICON · FIRST EDITION</p>
            <h1>The Language of <em>Space,</em> Connected.</h1>
            <p className="platform-hero-lede">A structured way to learn the essential concepts, systems, and connections shaping the modern space industry.</p>
            <form className="hero-search" onSubmit={submitSearch} role="search">
              <Search size={19} aria-hidden="true" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a term, acronym, or concept" aria-label="Search the Orbion Lexicon" />
              <button type="submit">Search <ArrowRight size={16} aria-hidden="true" /></button>
            </form>
            <ReadingStatus />
          </div>
          <div className="orbit-console" aria-label="Orbion Lexicon contains 500 connected space-industry concepts" role="img">
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-ring ring-three" />
            <div className="orbit-node node-one" /><div className="orbit-node node-two" /><div className="orbit-node node-three" />
            <div className="orbit-core"><span>ORBION</span><strong>{summary?.entryCount ?? "—"}</strong><small>CONNECTED CONCEPTS</small></div>
            <div className="orbit-label label-one">TERM</div><div className="orbit-label label-two">DOMAIN</div><div className="orbit-label label-three">EVIDENCE</div>
          </div>
        </div>
      </section>

      <section className="platform-intro section-light">
        <div className="platform-container split-intro">
          <div><p className="platform-kicker on-light">A FIELD GUIDE FOR THE MODERN SPACE INDUSTRY</p><h2>Start with a term. <em>See the system.</em></h2></div>
          <div><p>The physical book provides a structured foundation. The Online Lexicon extends it through exploration, sources, and connected concepts—without making the complexity feel abstract.</p><Link href="/methodology" className="text-arrow-link">How Orbion approaches evidence <ArrowRight size={15} /></Link></div>
        </div>
        <div className="platform-container stat-rail">
          <div><strong>{summary?.entryCount ?? "500"}</strong><span>essential concepts</span></div>
          <div><strong>{summary?.domainCount ?? "20"}</strong><span>connected domains</span></div>
          <div><strong>{summary?.previewEntryCount ?? "—"}</strong><span>public sample entries</span></div>
          <div><strong>1</strong><span>shared vocabulary</span></div>
        </div>
      </section>

      <section className="platform-section domain-section">
        <div className="platform-container section-title-row"><div><p className="platform-kicker on-light">EXPLORE BY DOMAIN</p><h2>Space is one industry.<br /><em>Its language is connected.</em></h2></div><Link href="/domains" className="outline-link">All 20 domains <ArrowRight size={15} /></Link></div>
        <div className="platform-container domain-grid">{selectedDomains.map(domain => <DomainCard key={domain.id} domain={domain} />)}</div>
      </section>

      <section className="platform-section featured-section">
        <div className="platform-container section-title-row"><div><p className="platform-kicker">BEGIN WITH THE FUNDAMENTALS</p><h2>Foundational<br /><em>terms to explore.</em></h2></div><Link href="/lexicon" className="outline-link light">Browse the Lexicon <ArrowRight size={15} /></Link></div>
        <div className="platform-container entry-grid">{(featured?.results ?? []).slice(0, 6).map((entry: LexiconCardEntry) => <EntryCard key={entry.orbionId} entry={entry} />)}</div>
      </section>

      <section className="platform-section connection-section">
        <div className="platform-container connection-grid">
          <div className="connection-graphic" aria-hidden="true"><Network size={58} strokeWidth={1} /><span className="connection-dot dot-a" /><span className="connection-dot dot-b" /><span className="connection-dot dot-c" /></div>
          <div><p className="platform-kicker">THE ORBION WAYFINDING PATH</p><h2>Build understanding <em>one connection at a time.</em></h2><ol className="connection-path"><li><span>01</span><div><strong>Term</strong><p>Find a precise definition in plain language.</p></div></li><li><span>02</span><div><strong>Context</strong><p>Understand why it matters to real missions and systems.</p></div></li><li><span>03</span><div><strong>Connection</strong><p>Follow related concepts into a domain or map.</p></div></li></ol></div>
        </div>
      </section>

      <section className="book-bridge">
        <div className="platform-container book-bridge-inner"><Compass size={34} aria-hidden="true" /><div><p className="platform-kicker">THE ORBION SPACE LEXICON</p><h2>Keep the reference on your desk.</h2><p>500 essential concepts for the modern space industry, in a premium First Edition by Anthony Galeano, Founder of Orbion.</p></div><Link href="/book" className="gold-link">Explore the First Edition <ArrowRight size={16} /></Link></div>
      </section>
    </PlatformShell>
  );
}
