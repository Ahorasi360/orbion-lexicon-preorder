import { ArrowRight, BookOpen, ChevronRight, Network, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { EntryCard, EvidenceMark, type LexiconCardEntry } from "@/components/LexiconCards";
import PlatformShell from "@/components/PlatformShell";
import Seo from "@/components/Seo";
import { trackEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

export default function LexiconEntryPage() {
  const params = useParams<{ term: string }>();
  const slug = params.term ?? "";
  const { data, isLoading, error } = trpc.lexicon.getBySlug.useQuery({ slug }, { enabled: Boolean(slug) });

  useEffect(() => {
    if (data?.entry) trackEvent("lexicon_entry_view", { slug: data.entry.slug, orbionId: data.entry.orbionId });
  }, [data?.entry, slug]);

  if (isLoading) return <PlatformShell><div className="page-loading">Loading this Lexicon entry…</div></PlatformShell>;
  if (error || !data) return <PlatformShell><div className="page-loading"><h1>Term not found</h1><p>The requested Lexicon entry is unavailable.</p><Link href="/lexicon">Return to the Lexicon →</Link></div></PlatformShell>;

  const { entry, relatedEntries, sources } = data;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "DefinedTerm", name: entry.canonicalName, termCode: entry.orbionId, description: entry.shortDefinition, inDefinedTermSet: { "@type": "DefinedTermSet", name: "Orbion Online Lexicon", url: "https://orbionlexicon.com/lexicon" }, url: `https://orbionlexicon.com/lexicon/${entry.slug}` },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Orbion", item: "https://orbionlexicon.com/" }, { "@type": "ListItem", position: 2, name: "Lexicon", item: "https://orbionlexicon.com/lexicon" }, { "@type": "ListItem", position: 3, name: entry.canonicalName, item: `https://orbionlexicon.com/lexicon/${entry.slug}` }] },
    ],
  };

  return (
    <PlatformShell>
      <Seo title={`${entry.canonicalName} | Orbion Online Lexicon`} description={entry.shortDefinition} canonicalPath={`/lexicon/${entry.slug}`} structuredData={structuredData} />
      <div className="entry-breadcrumb platform-container"><Link href="/">Orbion</Link><ChevronRight size={14} /><Link href="/lexicon">Lexicon</Link><ChevronRight size={14} /><span>{entry.canonicalName}</span></div>
      <section className="entry-hero"><div className="platform-container entry-hero-grid"><div><p className="platform-kicker">{entry.orbionId} · {entry.domains[0]?.name ?? "Orbion Lexicon"}</p><h1>{entry.canonicalName}{entry.acronym ? <small>{entry.acronym}</small> : null}</h1><p className="entry-definition">{entry.shortDefinition}</p><div className="entry-metadata"><EvidenceMark strength={entry.evidenceStrength} /><span>Evidence strength</span><span className="metadata-rule" /><span>{entry.bookReference}</span></div></div><div className="entry-satellite"><span>CONNECTED<br />CONCEPTS</span><strong>{entry.connectedConcepts.length}</strong><Network size={35} strokeWidth={1} aria-hidden="true" /></div></div></section>
      <section className="entry-body"><div className="platform-container entry-layout"><article>
        <section><p className="entry-section-label">TECHNICAL MEANING</p><p className="entry-copy lead-copy">{entry.fullDefinition}</p></section>
        <section><p className="entry-section-label">WHY IT MATTERS</p><p className="entry-copy">{entry.whyItMatters}</p></section>
        {entry.industryExample ? <section className="example-block"><p className="entry-section-label">INDUSTRY EXAMPLE</p><p>{entry.industryExample}</p></section> : null}
        {entry.dontConfuse ? <section className="dont-confuse"><p className="entry-section-label">DON’T CONFUSE</p><p>{entry.dontConfuse}</p></section> : null}
      </article>
      <aside className="entry-aside"><div className="entry-aside-card"><ShieldCheck size={19} aria-hidden="true" /><strong>Editorial status</strong><p>This entry is drawn from the First Edition review manuscript and remains marked <b>{entry.reviewStatus.replace("_", " ")}</b>.</p><Link href="/methodology">How evidence is handled <ArrowRight size={14} /></Link></div><div className="entry-aside-card"><BookOpen size={19} aria-hidden="true" /><strong>In the First Edition</strong><p>{entry.bookReference ?? "Reference position pending"}</p><Link href="/book" onClick={() => trackEvent("book_cta_click", { placement: "entry_sidebar", slug: entry.slug })}>Explore the book <ArrowRight size={14} /></Link></div></aside></div></section>
      <section className="local-connections"><div className="platform-container"><div className="section-title-row"><div><p className="platform-kicker">LOCAL CONNECTION VIEW</p><h2>Follow the <em>next useful link.</em></h2></div><p className="connection-note">A focused route through related terms, not an overwhelming graph.</p></div><div className="connection-map" aria-label={`Concepts connected to ${entry.canonicalName}`}><div className="connection-center"><span>{entry.orbionId}</span><strong>{entry.canonicalName}</strong></div><div className="connection-branches">{entry.connectedConcepts.map((concept, index) => { const related = relatedEntries.find(item => item.canonicalName === concept); return related ? <Link key={concept} href={`/lexicon/${related.slug}`} onClick={() => trackEvent("related_term_click", { from: entry.slug, to: related.slug })} className={`connection-branch branch-${index % 3}`}>{concept}<ArrowRight size={13} /></Link> : <span key={concept} className={`connection-branch muted branch-${index % 3}`}>{concept}</span>; })}</div></div>{relatedEntries.length ? <div className="entry-grid light-grid related-grid">{relatedEntries.map((related: LexiconCardEntry) => <EntryCard key={related.orbionId} entry={related} />)}</div> : null}</div></section>
      <section className="sources-section"><div className="platform-container sources-layout"><div><p className="platform-kicker on-light">PRIMARY REFERENCES</p><h2>Inspect the source trail.</h2><p>Source records identify the materials cited in the approved manuscript. Availability and rights remain subject to source-level review.</p></div><div className="source-list">{sources.length ? sources.map(source => <article key={source.orbionId} className="source-row"><span>{source.orbionId}</span><div><strong>{source.title}</strong><p>{[source.publisher, source.sourceType].filter(Boolean).join(" · ")}</p></div></article>) : <p className="no-sources">No source records are linked to this draft entry yet.</p>}</div></div></section>
      <section className="next-stop"><div className="platform-container"><p>Want the wider context?</p><Link href={`/domains/${entry.domains[0]?.slug ?? ""}`}>Explore this domain →</Link></div></section>
    </PlatformShell>
  );
}
