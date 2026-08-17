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
