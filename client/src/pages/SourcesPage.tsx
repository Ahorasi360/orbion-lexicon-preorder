import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import PlatformShell from "@/components/PlatformShell";
import Seo from "@/components/Seo";
import { trackEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

type SourceRecord = { orbionId: string; title: string; publisher: string | null; sourceType: string; locator: string | null; rightsStatus: string };

export default function SourcesPage() {
  const [query, setQuery] = useState("");
  const input = useMemo(() => ({ query: query.trim() || undefined }), [query]);
  const { data, isLoading } = trpc.lexicon.sources.useQuery(input);
  const sources = data?.results ?? [];
  const isLocked = data?.access !== "member";
  return <PlatformShell><Seo title="Source Records | Orbion Online Lexicon" description="Member source and evidence records for the Orbion Online Lexicon." canonicalPath="/sources" noindex />
    <section className="page-hero sources-hero"><div className="platform-container"><p className="platform-kicker">SOURCE RECORDS</p><h1>Follow the<br /><em>source trail.</em></h1><p>These records are parsed from the approved First Edition review manuscript. They are provided for inspection and remain subject to source-level verification and rights review.</p></div></section>
    <section className="sources-browser"><div className="platform-container">{isLocked ? <div className="empty-lexicon"><p>Source and evidence records are included with Orbion Online Lexicon annual access.</p><a href="/lexicon/access" onClick={() => trackEvent("access_cta_click", { placement: "sources_lock" })}>Unlock annual access — $79 →</a><small>The physical book is a separate product. Annual access does not renew automatically.</small></div> : <><div className="source-search"><Search size={18} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter source ID, title, or publisher" aria-label="Filter source records" /><span>{isLoading ? "Loading…" : `${sources.length} records`}</span></div><div className="source-records">{sources.map((source: SourceRecord) => <article key={source.orbionId} className="source-record"><span>{source.orbionId}</span><div><h2>{source.title}</h2><p>{[source.publisher, source.sourceType.replaceAll("_", " "), source.rightsStatus.replaceAll("_", " ")].filter(Boolean).join(" · ")}</p></div>{source.locator ? <a href={source.locator} target="_blank" rel="noreferrer" onClick={() => trackEvent("source_open", { sourceId: source.orbionId })} aria-label={`Open source ${source.orbionId}`}><ExternalLink size={16} /></a> : <span className="source-record-pending">Review pending</span>}</article>)}</div></>}</div></section>
  </PlatformShell>;
}
