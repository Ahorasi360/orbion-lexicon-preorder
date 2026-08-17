import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import PlatformShell from "@/components/PlatformShell";
import { trackEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

type SourceRecord = { orbionId: string; title: string; publisher: string | null; sourceType: string; locator: string | null; rightsStatus: string };

export default function SourcesPage() {
  const [query, setQuery] = useState("");
  const input = useMemo(() => ({ query: query.trim() || undefined }), [query]);
  const { data: sources, isLoading } = trpc.lexicon.sources.useQuery(input);
  return <PlatformShell>
    <section className="page-hero sources-hero"><div className="platform-container"><p className="platform-kicker">SOURCE RECORDS</p><h1>Follow the<br /><em>source trail.</em></h1><p>These records are parsed from the approved First Edition review manuscript. They are provided for inspection and remain subject to source-level verification and rights review.</p></div></section>
    <section className="sources-browser"><div className="platform-container"><div className="source-search"><Search size={18} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter source ID, title, or publisher" aria-label="Filter source records" /><span>{isLoading ? "Loading…" : `${sources?.length ?? 0} records`}</span></div><div className="source-records">{(sources ?? []).map((source: SourceRecord) => <article key={source.orbionId} className="source-record"><span>{source.orbionId}</span><div><h2>{source.title}</h2><p>{[source.publisher, source.sourceType.replaceAll("_", " "), source.rightsStatus.replaceAll("_", " ")].filter(Boolean).join(" · ")}</p></div>{source.locator ? <a href={source.locator} target="_blank" rel="noreferrer" onClick={() => trackEvent("source_open", { sourceId: source.orbionId })} aria-label={`Open source ${source.orbionId}`}><ExternalLink size={16} /></a> : <span className="source-record-pending">Review pending</span>}</article>)}</div></div></section>
  </PlatformShell>;
}
