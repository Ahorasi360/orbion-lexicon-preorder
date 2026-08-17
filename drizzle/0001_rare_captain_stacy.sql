CREATE TABLE `claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entry_id` int NOT NULL,
	`text` text NOT NULL,
	`status` enum('draft','active','superseded','retracted') NOT NULL DEFAULT 'draft',
	`valid_from` timestamp,
	`valid_to` timestamp,
	`source_ids` json NOT NULL,
	`review_status` enum('review_pending','approved','archived') NOT NULL DEFAULT 'review_pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`parent_domain_id` int,
	`related_domain_ids` json NOT NULL,
	`entry_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `domains_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `lexicon_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orbion_id` varchar(16) NOT NULL,
	`slug` varchar(192) NOT NULL,
	`canonical_name` varchar(255) NOT NULL,
	`acronym` varchar(64),
	`aliases` json NOT NULL,
	`short_definition` text NOT NULL,
	`full_definition` text NOT NULL,
	`why_it_matters` text NOT NULL,
	`industry_example` text,
	`dont_confuse` text,
	`connected_concepts` json NOT NULL,
	`domain_ids` json NOT NULL,
	`related_entry_ids` json NOT NULL,
	`key_facts` json NOT NULL,
	`visual_assets` json NOT NULL,
	`primary_reference_ids` json NOT NULL,
	`evidence_strength` int NOT NULL,
	`review_status` enum('review_pending','approved','archived') NOT NULL DEFAULT 'review_pending',
	`book_reference` varchar(128),
	`source_text` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lexicon_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `lexicon_entries_orbion_id_unique` UNIQUE(`orbion_id`),
	CONSTRAINT `lexicon_entries_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `relations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`predicate` varchar(128) NOT NULL,
	`object_id` int NOT NULL,
	`valid_from` timestamp,
	`valid_to` timestamp,
	`source_ids` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orbion_id` varchar(16) NOT NULL,
	`title` text NOT NULL,
	`publisher` varchar(255),
	`author` varchar(255),
	`publication_date` varchar(32),
	`source_type` varchar(64) NOT NULL,
	`locator` text,
	`rights_status` enum('approved_for_reference','pending_review','unknown') NOT NULL DEFAULT 'pending_review',
	`retrieved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `sources_orbion_id_unique` UNIQUE(`orbion_id`)
);
--> statement-breakpoint
CREATE INDEX `claims_entry_id_idx` ON `claims` (`entry_id`);--> statement-breakpoint
CREATE INDEX `domains_parent_domain_id_idx` ON `domains` (`parent_domain_id`);--> statement-breakpoint
CREATE INDEX `lexicon_entries_canonical_name_idx` ON `lexicon_entries` (`canonical_name`);--> statement-breakpoint
CREATE INDEX `lexicon_entries_review_status_idx` ON `lexicon_entries` (`review_status`);--> statement-breakpoint
CREATE INDEX `relations_subject_id_idx` ON `relations` (`subject_id`);--> statement-breakpoint
CREATE INDEX `relations_object_id_idx` ON `relations` (`object_id`);--> statement-breakpoint
CREATE INDEX `sources_source_type_idx` ON `sources` (`source_type`);