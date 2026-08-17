# Orbion Online Lexicon — Platform Scope

## Product Boundary

This project evolves the existing Orbion preorder site into one connected public platform. It must preserve the existing `/book` preorder experience, including the $89 Paperback, $149 Hardcover, and $349 First 1,000 Collector’s Edition checkout paths, runtime Stripe lookup, lead capture, analytics, SEO foundation, GitHub-backed Vercel deployment, and existing public URLs.

The public platform will add the following routes: `/`, `/book`, `/lexicon`, `/lexicon/[term]`, `/domains`, `/domains/[domain]`, `/maps`, `/methodology`, `/sources`, `/search`, `/about`, and `/intelligence`. The future authenticated product belongs at `app.orbionlexicon.com`; it is not part of this V1.

## Public Content Rule

Only approved public content from the Space Lexicon manuscript and explicitly approved assets may be used. Internal Codex, Foundation Package, strategy, or architecture materials are design references only unless explicitly approved for public use. Do not fabricate company relationships, contracts, regulatory requirements, technical claims, launch prices, financial figures, source citations, or legal conclusions.

## Approved Manuscript Findings

The review manuscript identifies **500 complete review entries across 20 domains** and states that it is not publication-final copy. Its entry pattern is: In Plain English, Technical Meaning, Why It Matters, Industry Example, Don’t Confuse, Connected Concepts, Evidence Strength, and Primary References. The content model must retain review state and source discipline.

The first manuscript domain is **Spaceflight Foundations & Physics**. Confirmed early entries include: Spaceflight (`OSL-0001`), Aerospace (`OSL-0002`), and Outer Space (`OSL-0003`). The public V1 should use source-backed entries from the manuscript and label any content awaiting technical, legal/regulatory, copy, or source verification according to its approved status.

## Initial Data Objects

The public-content layer will support LexiconEntry, Domain, Source, Claim, and Relation records. Each public entry needs stable identifiers and a permanent slug. Database/import tooling should support gradual review of the complete 500-entry manuscript without hardcoding entry text into React components.

## Experience Principle

The public journey follows: **term → definition → why it matters → related concepts → local connection view → domain → system map → Orbion Intelligence preview**. The relationship view should use limited, meaningful local connections rather than an uncontrolled graph.
