import { CheckCircle2, Eye, Scale, Undo2 } from "lucide-react";
import { Link } from "wouter";
import PlatformShell from "@/components/PlatformShell";

const principles = [
  ["Traceability", "Information should be traceable. Readers should be able to inspect the source records connected to a term or claim where they are available.", Eye],
  ["Evidence and interpretation", "Sources matter, and evidence is not the same thing as interpretation. The Lexicon distinguishes an accessible explanation from the supporting basis for it.", Scale],
  ["Change over time", "Information, relationships, and the status of a claim may change. The structure supports reviewable records instead of presenting every statement as permanent.", Undo2],
  ["Unknown is valid", "Not every question has a settled answer. The platform should make room for uncertainty, qualification, and preserved corrections rather than concealing them.", CheckCircle2],
];

export default function MethodologyPage() {
  return <PlatformShell>
    <section className="page-hero methodology-hero"><div className="platform-container"><p className="platform-kicker">ORBION METHODOLOGY</p><h1>Knowledge is more useful<br /><em>when you can inspect it.</em></h1><p>Orbion is building a public reference experience around source awareness, clear distinctions, and a disciplined view of what is known, interpreted, or still under review.</p></div></section>
    <section className="methodology-main"><div className="platform-container"><div className="methodology-intro"><p className="platform-kicker on-light">THE PUBLIC STANDARD</p><h2>Clear language.<br /><em>Visible discipline.</em></h2><p>The First Edition review manuscript uses a repeated entry architecture: an accessible explanation, a technical meaning, why the term matters, a practical example, a distinction to avoid, connected concepts, an evidence-strength indication, and primary references.</p></div><div className="principles-grid">{principles.map(([title, description, Icon]) => <article key={title as string}><Icon size={23} strokeWidth={1.35} aria-hidden="true" /><h3>{title as string}</h3><p>{description as string}</p></article>)}</div></div></section>
    <section className="evidence-ladder"><div className="platform-container"><p className="platform-kicker">EVIDENCE STRENGTH</p><h2>A rating of support,<br /><em>not a permanent rating of an institution.</em></h2><div className="evidence-ladder-row"><span>★★★★★</span><div><strong>Authoritative and direct</strong><p>Primary legal text, official regulator, official technical standard, or direct authoritative documentation.</p></div></div><div className="evidence-ladder-row"><span>★★★★☆</span><div><strong>Highly reliable</strong><p>Strong official or institutional support, with limited interpretive synthesis.</p></div></div><div className="evidence-ladder-row"><span>★★★☆☆</span><div><strong>Reliable secondary</strong><p>Respected research, technical synthesis, or industry analysis requiring context.</p></div></div></div></section>
    <section className="methodology-cta"><div className="platform-container"><div><h2>Explore the source records.</h2><p>Browse manuscript-linked source records and see the practical limits of the current review state.</p></div><Link href="/sources">Browse sources →</Link></div></section>
  </PlatformShell>;
}
