import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { DomainCard, type LexiconDomain } from "@/components/LexiconCards";
import PlatformShell from "@/components/PlatformShell";
import { trpc } from "@/lib/trpc";

export default function DomainsPage() {
  const { data: domains, isLoading } = trpc.lexicon.domains.useQuery();
  return (
    <PlatformShell>
      <section className="page-hero domains-hero"><div className="platform-container"><p className="platform-kicker">TWENTY CONNECTED DOMAINS</p><h1>Find your place<br /><em>in the system.</em></h1><p>Each domain groups a teaching sequence of related terms—from physical foundations to strategy, data, and intelligence for space.</p></div></section>
      <section className="platform-section domains-browser"><div className="platform-container">{isLoading ? <div className="domain-loading">Loading the Orbion domains…</div> : <div className="domain-grid all-domains">{(domains ?? []).map((domain: LexiconDomain) => <DomainCard key={domain.id} domain={domain} />)}</div>}</div></section>
      <section className="book-bridge subtle-bridge"><div className="platform-container book-bridge-inner"><div><p className="platform-kicker">PREFER A CURATED READING PATH?</p><h2>The Orbion Space Lexicon</h2><p>Move through all 500 essential concepts in the First Edition’s editorial sequence.</p></div><Link href="/book" className="gold-link">Explore the book <ArrowRight size={16} /></Link></div></section>
    </PlatformShell>
  );
}
