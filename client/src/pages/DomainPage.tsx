import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { EntryCard, type LexiconCardEntry } from "@/components/LexiconCards";
import PlatformShell from "@/components/PlatformShell";
import Seo from "@/components/Seo";
import { trackEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

export default function DomainPage() {
  const params = useParams<{ domain: string }>();
  const slug = params.domain ?? "";
  const { data, isLoading, error } = trpc.lexicon.getDomain.useQuery({ slug }, { enabled: Boolean(slug) });

  useEffect(() => { if (data?.domain) trackEvent("domain_view", { slug: data.domain.slug, domainId: data.domain.id }); }, [data?.domain]);

  if (isLoading) return <PlatformShell><div className="page-loading">Loading this domain…</div></PlatformShell>;
  if (error || !data) return <PlatformShell><div className="page-loading"><h1>Domain not found</h1><Link href="/domains">Return to all domains →</Link></div></PlatformShell>;

  return <PlatformShell>
    <Seo title={`${data.domain.name} | Orbion Online Lexicon`} description={data.domain.description} canonicalPath={`/domains/${data.domain.slug}`} structuredData={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Orbion", item: "https://orbionlexicon.com/" }, { "@type": "ListItem", position: 2, name: "Domains", item: "https://orbionlexicon.com/domains" }, { "@type": "ListItem", position: 3, name: data.domain.name, item: `https://orbionlexicon.com/domains/${data.domain.slug}` }] }} />
    <div className="entry-breadcrumb platform-container"><Link href="/">Orbion</Link><ChevronRight size={14} /><Link href="/domains">Domains</Link><ChevronRight size={14} /><span>{data.domain.name}</span></div>
    <section className="domain-detail-hero"><div className="platform-container"><p className="platform-kicker">DOMAIN {String(data.domain.id).padStart(2, "0")} · {data.domain.entryCount} ENTRIES</p><h1>{data.domain.name}</h1><p>{data.domain.description}</p><div className="domain-route"><span>FOUNDATIONS</span><i /><span>TERMS</span><i /><span>CONNECTIONS</span><i /><span>SYSTEMS</span></div></div></section>
    <section className="domain-terms"><div className="platform-container"><div className="section-title-row"><div><p className="platform-kicker on-light">EDITORIAL TEACHING SEQUENCE</p><h2>Terms in this <em>domain.</em></h2></div><Link href={`/lexicon?domain=${data.domain.slug}`} className="outline-link">Filter in Lexicon <ArrowRight size={14} /></Link></div><div className="entry-grid light-grid">{data.entries.map((entry: LexiconCardEntry) => <EntryCard key={entry.orbionId} entry={entry} />)}</div></div></section>
    <section className="book-bridge subtle-bridge"><div className="platform-container book-bridge-inner"><div><p className="platform-kicker">KEEP EXPLORING</p><h2>Every term has a wider context.</h2><p>Move through the connected vocabulary or return to the complete twenty-domain map.</p></div><Link href="/domains" className="gold-link">All domains <ArrowRight size={16} /></Link></div></section>
  </PlatformShell>;
}
