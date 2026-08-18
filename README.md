# Orbion Online Lexicon

This repository contains the connected public Orbion platform: the **Orbion Online Lexicon**, the preserved **The Orbion Space Lexicon** preorder experience, and a public bridge to the future **Orbion Intelligence** product.

The platform is designed around one core rule: the public Lexicon, the physical book, and future authenticated tooling should compound into one Orbion ecosystem rather than operate as disconnected sites.

## Public Routes

| Route | Purpose |
|---|---|
| `/` | Orbion public homepage and discovery entry point. |
| `/book` | Preserved physical-book preorder experience, including the $89 Paperback, $149 Hardcover, and $349 Collector’s Edition checkout paths. |
| `/lexicon` | Searchable, filterable public Lexicon. |
| `/lexicon/:term` | Locked or explicitly approved public-preview term pages; full content is member-only. |
| `/domains` and `/domains/:domain` | Twenty-domain exploration and teaching sequences. |
| `/maps` | Guided context maps; not predictive models or a universal knowledge graph. |
| `/methodology` | Public explanation of traceability, evidence, review status, uncertainty, and corrections. |
| `/sources` | Member source and evidence records; public visitors see a protected-access explanation. |
| `/search` | Public catalog search across term names, aliases, acronyms, approved teasers, and domains. |
| `/lexicon/access` | Separate $79 one-year Online Lexicon access offer; no automatic renewal. |
| `/lexicon/access/success` | No-index post-payment status page; access is granted only after server verification. |
| `/account` | No-index account-linked entitlement and purchase-status view. |
| `/about` | Orbion and author context. |
| `/intelligence` | Early-access bridge for Orbion Intelligence, explicitly marked as in development. |

The existing policy and support routes remain available: `/terms-of-sale`, `/preorder-refund-policy`, `/shipping-delay-policy`, `/privacy-policy`, `/contact`, and `/corrections`.

## Architecture

The application uses React, TypeScript, Wouter, Tailwind CSS, Express, tRPC, Drizzle ORM, and the managed MySQL/TiDB database. The public pages use route-level code splitting. The existing Vercel deployment serves the static application and rewrites `/api/*` traffic to the managed backend, preserving secure runtime checkout-link retrieval.

The public content boundary is deliberate. React components render records received through tRPC and do not hardcode Lexicon entry prose. The content layer is organized around the following database tables.

| Object | Table | Purpose |
|---|---|---|
| LexiconEntry | `lexicon_entries` | Canonical terms, permanent slugs, entry text, evidence strength, review status, source references, and connected concepts. |
| Domain | `domains` | Public taxonomy, teaching sequences, and entry counts. |
| Source | `sources` | Manuscript-linked source records and review state. |
| Claim | `claims` | Future time-bounded assertions that can be reviewed without rewriting an entire entry. |
| Relation | `relations` | Directed, source-aware relationships between terms. |

The `source_text` field preserves complete manuscript-derived raw entry text. Public pages deliberately exclude it and show the structured, review-gated fields instead.

## Content Loading and Editorial Review

The approved manuscript is a **review manuscript**, not final publication copy. The import pipeline therefore marks all generated records as `review_pending`. Do not use the importer to silently rewrite source material or publish unreviewed changes.

### 1. Generate a review seed

```bash
node scripts/generate-lexicon-seed.mjs /absolute/path/to/manuscript.pdf
```

This command extracts the manuscript with `pdftotext`, confirms that it identifies all 500 `OSL-` entries, preserves raw entry text, and writes structured content to `data/lexicon-seed.json`. It reports parser warnings so they can be reviewed before import.

### 2. Import the seed

```bash
node scripts/import-lexicon.mjs data/lexicon-seed.json
```

The importer requires `DATABASE_URL`. It upserts domains, source records, and entries by their stable Orbion IDs and slugs. It also creates only local `related_concept` relationships where a connected manuscript term matches an imported canonical term. The importer does **not** delete users, preorder leads, checkout settings, or unrelated records.

### 3. Regenerate the sitemap

```bash
pnpm content:sitemap
```

This creates `client/public/sitemap.xml` from the seed and includes public platform routes and twenty domain URLs. A term URL is included only when its owner-approved preview is explicitly marked `is_public_preview=true` and `index_status=index`. Locked member terms are intentionally excluded from the sitemap.

### 4. Editorial publication discipline

Before changing any entry’s review status to `approved`, confirm final copy, technical review, source verification, legal or regulatory review where applicable, and a stable permanent slug. Do not invent companies, contracts, financial figures, regulatory requirements, technical claims, or sources.

## Development Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the development server. |
| `pnpm check` | Run TypeScript checks. |
| `pnpm test` | Run Vitest coverage. |
| `pnpm build` | Create the production frontend and backend bundles. |
| `pnpm content:sitemap` | Regenerate the public sitemap from `data/lexicon-seed.json`. |
| `pnpm qa:keyboard` | Run non-submitting keyboard, focus-visibility, overflow, and console QA across public and legal routes at desktop and mobile widths. |
| `pnpm qa:book-links` | Run non-submitting desktop/mobile click-through QA for Book links, in-page CTAs, policy links, and runtime Stripe destinations. |
| `pnpm qa:mobile-lexicon` | Run non-submitting mobile menu, A–Z filter, search, clear-control, and overflow QA. |
| `pnpm qa:preview-hmr` | Run a fresh Book-preview check for the managed development WebSocket issue. |
| `pnpm qa:release` | Run one fresh isolated browser release audit covering public routes, protected content, account denial, checkout-safe controls, accessibility, and console state. |
| `pnpm drizzle-kit generate` | Generate a Drizzle migration after editing `drizzle/schema.ts`. |

When changing the database schema, generate the migration, review its SQL, and apply it through the managed database migration workflow. Do not use destructive schema changes without an explicit data-impact review.

## Environment Variables

| Variable | Use |
|---|---|
| `DATABASE_URL` | Managed MySQL/TiDB connection for public Lexicon data and user records. |
| `VITE_STRIPE_COLLECTOR_PAYMENT_LINK` | Collector’s Edition Stripe Payment Link, resolved only by the backend procedure. |
| `VITE_STRIPE_HARDCOVER_PAYMENT_LINK` | Hardcover Stripe Payment Link, resolved only by the backend procedure. |
| `VITE_STRIPE_PAPERBACK_PAYMENT_LINK` | Paperback Stripe Payment Link, resolved only by the backend procedure. |
| `PREORDER_CAPTURE_ENABLED` | Enables the Supabase-backed capture path when set to `true`. |
| `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` | Preorder and early-access lead capture. |
| `RESEND_API_KEY` and `RESEND_FROM_EMAIL` | Confirmation emails for preorder, Starter Pack, and Intelligence early access. |
| `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` | Existing privacy-conscious analytics script configuration. |
| `STRIPE_ONLINE_LEXICON_PAYMENT_LINK` | Separate $79 annual Online Lexicon Stripe Payment Link; never reuse a physical-book link. |
| `STRIPE_ONLINE_LEXICON_WEBHOOK_SECRET` | Dedicated signing secret for verified annual-access Stripe events. |
| `ONLINE_LEXICON_ACCESS_DURATION_DAYS` | Fixed annual entitlement term, configured as `365`. |

Never place payment-link values, service-role keys, or email-provider credentials in client code. The `/book` page queries checkout links through the existing backend procedure at runtime.

## Preserved Commercial Functionality

The existing physical-book preorder remains at `/book`. It retains its three editions, runtime Stripe Payment Link lookup, Supabase/Resend capture integration, Starter Pack path, policy links, confidence statement, product schema, and sticky preorder call to action. Policy-page preorder links intentionally return to `/book#preorder`.

Online Lexicon access is a separate account-linked digital product. Its $79 one-time annual payment link, purchase record, webhook ledger, and fixed-term entitlement are isolated from book checkout. The server validates both the Stripe signature and the configured payment-link identity before granting access; the browser success page never grants access by itself.

The public analytics helper emits vendor-neutral `orbion:analytics` browser events for Lexicon exploration, source interaction, book calls to action, Intelligence early access, list signups, and preorder clicks. A future analytics vendor can consume those events without changing public UI components.

## SEO and Accessibility

The platform applies route-aware titles, descriptions, canonicals, Open Graph data, and client-side structured data. Only explicitly owner-approved public preview terms with `index_status=index` publish indexable term metadata and `DefinedTerm`/`BreadcrumbList` schema. Locked terms, `/account`, `/sources`, `/search`, `/lexicon/access`, and the payment-status route are no-index. Robots and `llms.txt` explain that member content must not be crawled or summarized; the sitemap includes only public routes, legal routes, domains, and approved public preview terms.

The public UI provides semantic headings, visible focus handling, keyboard-accessible controls, skip navigation, form labels, responsive navigation, and text alternatives for meaningful imagery and diagrams.

## Future Orbion Intelligence Boundary

`/intelligence` is a public product preview and early-access bridge only. It intentionally does not include autonomous agents, predictive models, enterprise authentication, a marketplace, or internal Orbion material. The stable Orbion IDs, source records, claims, relations, and public API boundary are prepared so a future authenticated product can connect cleanly at `app.orbionlexicon.com`.

## Deployment

The repository is connected to the existing GitHub-backed Vercel project. Commit and push changes to the existing repository to trigger the Vercel deployment. The existing rewrite configuration must remain in place so `/api/trpc` requests continue to resolve through the managed backend.

The intended public domain is `orbionlexicon.com`. Confirm that its registrar DNS configuration has propagated before treating the custom domain as production-ready.
