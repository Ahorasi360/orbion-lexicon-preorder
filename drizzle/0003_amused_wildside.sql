CREATE TABLE `lexicon_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`purchase_id` int,
	`product_key` varchar(96) NOT NULL DEFAULT 'online_lexicon_access',
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`starts_at` timestamp NOT NULL,
	`ends_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lexicon_entitlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lexicon_payment_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe') NOT NULL DEFAULT 'stripe',
	`provider_event_id` varchar(255) NOT NULL,
	`event_type` varchar(128) NOT NULL,
	`payload_hash` varchar(128),
	`processing_status` enum('processed','ignored','failed') NOT NULL,
	`processed_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lexicon_payment_webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `lexicon_payment_webhook_events_provider_event_id_unique` UNIQUE(`provider_event_id`)
);
--> statement-breakpoint
CREATE TABLE `lexicon_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_key` varchar(96) NOT NULL DEFAULT 'online_lexicon_access',
	`provider` enum('stripe') NOT NULL DEFAULT 'stripe',
	`provider_checkout_session_id` varchar(255),
	`provider_payment_intent_id` varchar(255),
	`status` enum('pending','paid','failed','refunded','reversed','expired') NOT NULL DEFAULT 'pending',
	`currency` varchar(12),
	`amount_cents` int,
	`access_duration_days` int NOT NULL,
	`access_starts_at` timestamp,
	`access_ends_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lexicon_purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `lexicon_purchases_provider_checkout_session_id_unique` UNIQUE(`provider_checkout_session_id`)
);
--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `public_teaser` text;--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `is_public_preview` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `seo_title` varchar(255);--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `seo_description` text;--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD `index_status` enum('index','noindex') DEFAULT 'noindex' NOT NULL;--> statement-breakpoint
CREATE INDEX `lexicon_entitlements_user_id_idx` ON `lexicon_entitlements` (`user_id`);--> statement-breakpoint
CREATE INDEX `lexicon_entitlements_active_window_idx` ON `lexicon_entitlements` (`user_id`,`status`,`ends_at`);--> statement-breakpoint
CREATE INDEX `lexicon_payment_webhook_events_type_idx` ON `lexicon_payment_webhook_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `lexicon_purchases_user_id_idx` ON `lexicon_purchases` (`user_id`);--> statement-breakpoint
CREATE INDEX `lexicon_purchases_status_idx` ON `lexicon_purchases` (`status`);