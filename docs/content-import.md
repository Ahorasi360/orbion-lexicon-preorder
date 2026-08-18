# Lexicon Content Import Workflow

The Online Lexicon is intentionally data-driven. Public term pages must read from the `lexicon_entries`, `domains`, `sources`, `claims`, and `relations` tables rather than placing entry prose directly in React components.

## Generate a Review Seed from the Manuscript

Run the following command from the project root. The script extracts the supplied manuscript, preserves its original entry text in `sourceText`, writes structured records to `data/lexicon-seed.json`, and assigns every imported record the status `review_pending`.

```bash
node scripts/generate-lexicon-seed.mjs /absolute/path/to/manuscript.pdf
```

The generator stops if it cannot identify exactly 500 `OSL-` entries. Review the reported parser-warning count before loading the seed. It does not rewrite manuscript copy or invent sources.

## Import the Structured Seed

With `DATABASE_URL` configured, run:

```bash
node scripts/import-lexicon.mjs data/lexicon-seed.json
```

The importer upserts domains, cited source records, and entries by their stable Orbion IDs and slugs. It derives only local `related_concept` records where a manuscript-connected term matches another imported canonical term. It does not delete unrelated rows, checkout data, leads, users, or preorder configuration.

## Editorial Safeguards

The supplied first-edition manuscript identifies itself as a review manuscript rather than publication-final copy. The importer therefore preserves `review_pending` as the default status. Before changing a public entry to `approved`, confirm the final copy, technical review, legal/regulatory review where applicable, source verification, and stable permanent slug.

## Paid Access and Public Preview Controls

All 500 imported entries are **premium by default**. The import does not infer public-preview status from `short_definition`, `full_definition`, `source_text`, related concepts, sources, or any other manuscript field. Public catalog APIs return only canonical identity, aliases, domain membership, and an explicitly authored `public_teaser` when one is present.

To publish an approved sample, an owner or editor must set all of the following on that exact canonical entry after review:

| Field | Required value | Purpose |
|---|---|---|
| `public_teaser` | Owner-approved concise copy | The only entry prose returned to public catalog/search clients. |
| `is_public_preview` | `true` | Allows only the separately authored public-preview fields to render publicly. It never releases the premium entry. |
| `public_preview_definition` | Owner-approved public excerpt | Required sample definition copy; it must not be derived automatically from the premium manuscript. |
| `public_preview_why_it_matters` / `public_preview_related_slugs` | Optional owner-approved public fields | Adds only the public context the owner has chosen to release. |
| `index_status` | `index` only when the sample should appear in search | Keeps locked entries out of public term indexing. |
| `seo_title` / `seo_description` | Optional owner-approved public metadata | Overrides derived metadata without drawing from premium text. |

Do not enable a preview by copying content from a manuscript paragraph unless that exact public excerpt has been editorially approved and stored in the separate preview fields. Locked entries remain discoverable as catalog records but their full definitions, sources, relationships, visual assets, and evidence fields are returned only after the server confirms a current paid entitlement.
