ALTER TABLE `lexicon_entries` ADD `public_preview_definition` text;--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `public_preview_why_it_matters` text;--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `public_preview_related_slugs` json NOT NULL;