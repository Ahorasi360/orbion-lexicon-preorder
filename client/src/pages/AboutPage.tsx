import { ArrowRight, BookOpen, Telescope } from "lucide-react";
import { Link } from "wouter";
import PlatformShell from "@/components/PlatformShell";
import { trackEvent } from "@/lib/analytics";

export default function AboutPage() {
  return <PlatformShell>
    <section className="page-hero about-hero"><div className="platform-container"><p className="platform-kicker">ABOUT ORBION</p><h1>Learn the language.<br /><em>Understand the industry.</em></h1><p>Orbion is developing connected reference experiences for people navigating the modern space industry—starting with the vocabulary that allows more precise conversations.</p></div></section>
    <section className="about-main"><div className="platform-container about-grid"><div><p className="platform-kicker on-light">THE FIRST EDITION</p><h2>One shared vocabulary<br /><em>for a complex field.</em></h2><p>The Orbion Space Lexicon brings together 500 essential concepts in an editorial teaching sequence spanning twenty domains. The Online Lexicon gives readers a connected way to explore that foundation.</p></div><div className="about-card"><Telescope size={31} strokeWidth={1.15} aria-hidden="true" /><p>Created by</p><strong>Anthony Galeano</strong><span>Founder, Orbion</span><a href="mailto:hello@orbionlexicon.com">hello@orbionlexicon.com</a></div></div></section>
    <section className="about-actions"><div className="platform-container"><article><BookOpen size={25} aria-hidden="true" /><h2>Start with the book.</h2><p>A premium physical reference for the desk, library, or mission room.</p><Link href="/book" onClick={() => trackEvent("book_cta_click", { placement: "about" })}>Explore the First Edition <ArrowRight size={14} /></Link></article><article><Telescope size={25} aria-hidden="true" /><h2>See what comes next.</h2><p>Orbion Intelligence is in development as a future evidence-connected navigation experience.</p><Link href="/intelligence" onClick={() => trackEvent("intelligence_cta_click", { placement: "about" })}>Orbion Intelligence <ArrowRight size={14} /></Link></article></div></section>
  </PlatformShell>;
}
