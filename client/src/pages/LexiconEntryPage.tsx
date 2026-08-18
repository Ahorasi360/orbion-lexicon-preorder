import { ArrowRight, BookOpen, ChevronRight, LockKeyhole, Network, ShieldCheck } from "lucide-react";
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
    if (!data?.entry) return;
    trackEvent(data.access === "locked" ? "locked_result_view" : "preview_entry_view", { slug: data.entry.slug, orbionId: data.entry.orbionId });
  }, [data]);

  if (isLoading) return <PlatformShell><div className="page-loading">Loading this Lexicon entry…</div></PlatformShell>;
  if (error || !data) return <PlatformShell><div className="page-loading"><h1>Term not found</h1><p>The requested Lexicon entry is unavailable.</p><Link href="/lexicon">Return to the Lexicon →</Link></div></PlatformShell>;

  const { entry, relatedEntries, sources } = data;
  const isLocked = data.access === "locked";
  const isMember = data.access === "member";
  const premium = isMember ? data.premium : null;
  const preview = data.access === "preview" ? data.entry.preview : null;
  const hasMemberContent = Boolean(premium || preview);
  const relatedTerms = premium?.connectedConcepts ?? preview?.relatedSlugs ?? [];
  const structuredData = data.access === "preview" && entry.isPublicPreview ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "DefinedTerm", name: entry.canonicalName, termCode: entry.orbionId, description: entry.publicTeaser, inDefinedTermSet: { "@type": "DefinedTermSet", name: "Orbion Online Lexicon", url: "https://orbionlexicon.com/lexicon" }, url: `https://orbionlexicon.com/lexicon/${entry.slug}` },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Orbion", item: "https://orbionlexicon.com/" }, { "@type": "ListItem", position: 2, name: "Lexicon", item: "https://orbionlexicon.com/lexicon" }, { "@type": "ListItem", position: 3, name: entry.canonicalName, item: `https://orbionlexicon.com/lexicon/${entry.slug}` }] },
    ],
  } : undefined;

  return <PlatformShell>
    <Seo title={`${entry.canonicalName} | Orbion Online Lexicon`} description={entry.publicTeaser} canonicalPath={`/lexicon/${entry.slug}`} structuredData={structuredData} />
    <div className="entry-breadcrumb platform-container"><Link href="/">Orbion</Link><ChevronRight size={14} /><Link href="/lexicon">Lexicon</Link><ChevronRight size={14} /><span>{entry.canonicalName}</span></div>
    <section className="entry-hero"><div className="platform-container entry-hero-grid"><div><p className="platform-kicker">{entry.orbionId} · {entry.domains[0]?.name ?? "Orbion Lexicon"}</p><h1>{entry.canonicalName}{entry.acronym ? <small>{entry.acronym}</small> : null}</h1><p className="entry-definition">{entry.publicTeaser}</p>{premium ? <div className="entry-metadata"><EvidenceMark strength={premium.evidenceStrength} /><span>Evidence strength</span><span className="metadata-rule" /><span>{premium.bookReference}</span></div> : <p className="entry-access-note">{isLocked ? "Full member entry · explanation, connections, sources, and evidence are protected." : "Approved public preview · full member evidence is protected."}</p>}</div><div className="entry-satellite"><span>{isLocked ? "MEMBER\nACCESS" : "CONNECTED\nCONCEPTS"}</span><strong>{isLocked ? "LOCKED" : relatedTerms.length}</strong><Network size={35} strokeWidth={1} aria-hidden="true" /></div></div></section>
    {isLocked ? <LockedEntry slug={entry.slug} /> : <MemberOrPreviewEntry entry={entry} premium={premium} preview={preview} relatedEntries={relatedEntries} sources={sources} />}
    <section className="next-stop"><div className="platform-container"><p>Want the wider context?</p><Link href={`/domains/${entry.domains[0]?.slug ?? ""}`}>Explore this domain →</Link></div></section>
  </PlatformShell>;
}

function LockedEntry({ slug }: { slug: string }) {
  return <section className="entry-body"><div className="platform-container entry-layout"><article><section><p className="entry-section-label">ORBION ONLINE LEXICON</p><h2>Continue with member access.</h2><p className="entry-copy lead-copy">Full members can access the complete explanation, why it matters, connected terms, source trail, evidence notes, and continuing updates during a valid access period.</p><Link className="primary-cta" href="/lexicon/access" onClick={() => trackEvent("access_cta_click", { placement: "locked_entry", slug })}>Unlock the Orbion Online Lexicon <ArrowRight size={16} /></Link><p className="legal-microcopy">Digital access purchases are final and non-refundable once access is granted, except where required by applicable law.</p></section></article><aside className="entry-aside"><div className="entry-aside-card"><LockKeyhole size={19} aria-hidden="true" /><strong>The physical reference remains separate</strong><p>The hardcover and Collector’s Edition are physical-book products. Online Lexicon access is a separately sold digital product.</p><Link href="/book">Explore the book <ArrowRight size={14} /></Link></div></aside></div></section>;
}

function MemberOrPreviewEntry({ entry, premium, preview, relatedEntries, sources }: { entry: { orbionId: string; slug: string; reviewStatus: string; domains: { slug: string }[] }; premium: { fullDefinition: string; whyItMatters: string; industryExample: string | null; dontConfuse: string | null; connectedConcepts: string[]; bookReference: string | null } | null; preview: { definition: string | null; whyItMatters: string | null; relatedSlugs: string[] } | null; relatedEntries: LexiconCardEntry[]; sources: { orbionId: string; title: string; publisher: string | null; sourceType: string }[] }) {
  const definition = premium?.fullDefinition ?? preview?.definition;
  const whyItMatters = premium?.whyItMatters ?? preview?.whyItMatters;
  const relatedTerms = premium?.connectedConcepts ?? preview?.relatedSlugs ?? [];
  return <><section className="entry-body"><div className="platform-container entry-layout"><article><section><p className="entry-section-label">{premium ? "TECHNICAL MEANING" : "APPROVED PUBLIC PREVIEW"}</p><p className="entry-copy lead-copy">{definition}</p></section>{whyItMatters ? <section><p className="entry-section-label">WHY IT MATTERS</p><p className="entry-copy">{whyItMatters}</p></section> : null}{premium?.industryExample ? <section className="example-block"><p className="entry-section-label">INDUSTRY EXAMPLE</p><p>{premium.industryExample}</p></section> : null}{premium?.dontConfuse ? <section className="dont-confuse"><p className="entry-section-label">DON’T CONFUSE</p><p>{premium.dontConfuse}</p></section> : null}</article><aside className="entry-aside"><div className="entry-aside-card"><ShieldCheck size={19} aria-hidden="true" /><strong>Editorial status</strong><p>This entry is drawn from the First Edition review manuscript and remains marked <b>{entry.reviewStatus.replace("_", " ")}</b>.</p><Link href="/methodology">How evidence is handled <ArrowRight size={14} /></Link></div>{premium ? <div className="entry-aside-card"><BookOpen size={19} aria-hidden="true" /><strong>In the First Edition</strong><p>{premium.bookReference ?? "Reference position pending"}</p><Link href="/book" onClick={() => trackEvent("book_cta_click", { placement: "entry_sidebar", slug: entry.slug })}>Explore the book <ArrowRight size={14} /></Link></div> : <div className="entry-aside-card"><LockKeyhole size={19} aria-hidden="true" /><strong>Go deeper with member access</strong><p>Sources, full connections, evidence, and complete member entries are protected.</p><Link href="/lexicon/access" onClick={() => trackEvent("access_cta_click", { placement: "preview_entry", slug: entry.slug })}>Explore Online Access <ArrowRight size={14} /></Link></div>}</aside></div></section><section className="local-connections"><div className="platform-container"><div className="section-title-row"><div><p className="platform-kicker">{premium ? "LOCAL CONNECTION VIEW" : "PREVIEW CONNECTIONS"}</p><h2>Follow the <em>next useful link.</em></h2></div><p className="connection-note">A focused route through related terms, not an overwhelming graph.</p></div><div className="connection-map" aria-label={`Concepts connected to ${entry.slug}`}><div className="connection-center"><span>{entry.orbionId}</span><strong>{entry.slug}</strong></div><div className="connection-branches">{relatedTerms.map((concept, index) => { const related = relatedEntries.find(item => item.canonicalName === concept || item.slug === concept); return related ? <Link key={concept} href={`/lexicon/${related.slug}`} onClick={() => trackEvent("related_term_click", { from: entry.slug, to: related.slug })} className={`connection-branch branch-${index % 3}`}>{related.canonicalName}<ArrowRight size={13} /></Link> : <span key={concept} className={`connection-branch muted branch-${index % 3}`}>{concept}</span>; })}</div></div>{relatedEntries.length ? <div className="entry-grid light-grid related-grid">{relatedEntries.map(related => <EntryCard key={related.orbionId} entry={related} />)}</div> : null}</div></section>{premium ? <section className="sources-section"><div className="platform-container sources-layout"><div><p className="platform-kicker on-light">PRIMARY REFERENCES</p><h2>Inspect the source trail.</h2><p>Source records identify the materials cited in the approved manuscript. Availability and rights remain subject to source-level review.</p></div><div className="source-list">{sources.length ? sources.map(source => <article key={source.orbionId} className="source-row"><span>{source.orbionId}</span><div><strong>{source.title}</strong><p>{[source.publisher, source.sourceType].filter(Boolean).join(" · ")}</p></div></article>) : <p className="no-sources">No source records are linked to this draft entry yet.</p>}</div></div></section> : null}</>;
}
