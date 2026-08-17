import { ArrowRight, Compass, Network, Orbit } from "lucide-react";
import { Link } from "wouter";
import PlatformShell from "@/components/PlatformShell";
import { trackEvent } from "@/lib/analytics";

const maps = [
  { title: "Orbital context", icon: Orbit, detail: "Use the Lexicon to move from foundational physical concepts to the regimes, maneuvers, and systems that depend on them.", route: "/domains/orbital-mechanics-regimes", label: "Explore orbital mechanics" },
  { title: "Mission context", icon: Compass, detail: "Follow a teaching sequence across mission design, ground segment, communications, navigation, payloads, and spacecraft systems.", route: "/domains/mission-design-integration-operations", label: "Explore mission design" },
  { title: "Commercial context", icon: Network, detail: "Connect the vocabulary of contracts, procurement, finance, institutions, policy, and the emerging markets surrounding space activity.", route: "/domains/commercial-models-contracts-procurement", label: "Explore commercial models" },
];

export default function MapsPage() {
  return <PlatformShell>
    <section className="page-hero maps-hero"><div className="platform-container"><p className="platform-kicker">ORBION MAPS</p><h1>See the context<br /><em>around a concept.</em></h1><p>Maps are guided entry points into connected vocabulary. They are navigation aids—not predictive models or claims about organizations.</p></div></section>
    <section className="map-guidance"><div className="platform-container"><div className="map-prompt"><div className="map-orbital-graphic" aria-hidden="true"><i /><i /><i /><span /></div><div><p className="platform-kicker on-light">A GENTLER WAY TO EXPLORE</p><h2>Start local.<br /><em>Reveal complexity gradually.</em></h2><p>Begin with a term, then a connected concept, then a domain. Each path stays close to the reviewed Lexicon record beneath it.</p></div></div><div className="map-card-grid">{maps.map(map => { const Icon = map.icon; return <article key={map.title} className="map-card"><Icon size={29} strokeWidth={1.25} aria-hidden="true" /><p className="entry-section-label">CONTEXT MAP</p><h3>{map.title}</h3><p>{map.detail}</p><Link href={map.route} onClick={() => trackEvent("map_open", { map: map.title })}>{map.label} <ArrowRight size={14} /></Link></article>; })}</div></div></section>
    <section className="next-stop"><div className="platform-container"><p>Need a specific definition before you map the system?</p><Link href="/lexicon">Search the Lexicon →</Link></div></section>
  </PlatformShell>;
}
