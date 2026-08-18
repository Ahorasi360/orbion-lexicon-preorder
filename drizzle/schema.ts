import { boolean, index, int, json, mediumtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Public taxonomy for the Space Lexicon. */
export const domains = mysqlTable(
  "domains",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    parentDomainId: int("parent_domain_id"),
    relatedDomainIds: json("related_domain_ids").$type<number[]>().notNull(),
    entryCount: int("entry_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("domains_parent_domain_id_idx").on(table.parentDomainId)],
);

/**
 * Canonical public term records. Text is imported from the approved manuscript
 * and remains review-gated until editorial, technical, and source review are complete.
 */
export const lexiconEntries = mysqlTable(
  "lexicon_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    orbionId: varchar("orbion_id", { length: 16 }).notNull().unique(),
    slug: varchar("slug", { length: 192 }).notNull().unique(),
    canonicalName: varchar("canonical_name", { length: 255 }).notNull(),
    acronym: varchar("acronym", { length: 64 }),
    aliases: json("aliases").$type<string[]>().notNull(),
    shortDefinition: text("short_definition").notNull(),
    /** Explicitly authored catalog teaser; never derived from premium manuscript text. */
    publicTeaser: text("public_teaser"),
    /** Full text is public only after an owner marks this specific entry as a preview sample. */
    isPublicPreview: boolean("is_public_preview").notNull().default(false),
    /** Owner-approved sample copy, stored separately from the complete premium definition. */
    publicPreviewDefinition: text("public_preview_definition"),
    publicPreviewWhyItMatters: text("public_preview_why_it_matters"),
    publicPreviewRelatedSlugs: json("public_preview_related_slugs").$type<string[]>().notNull(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    indexStatus: mysqlEnum("index_status", ["index", "noindex"]).notNull().default("noindex"),
    fullDefinition: text("full_definition").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    industryExample: text("industry_example"),
    dontConfuse: text("dont_confuse"),
    connectedConcepts: json("connected_concepts").$type<string[]>().notNull(),
    domainIds: json("domain_ids").$type<number[]>().notNull(),
    relatedEntryIds: json("related_entry_ids").$type<number[]>().notNull(),
    keyFacts: json("key_facts").$type<string[]>().notNull(),
    visualAssets: json("visual_assets").$type<string[]>().notNull(),
    primaryReferenceIds: json("primary_reference_ids").$type<string[]>().notNull(),
    evidenceStrength: int("evidence_strength").notNull(),
    reviewStatus: mysqlEnum("review_status", ["review_pending", "approved", "archived"])
      .notNull()
      .default("review_pending"),
    bookReference: varchar("book_reference", { length: 128 }),
    sourceText: mediumtext("source_text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("lexicon_entries_canonical_name_idx").on(table.canonicalName),
    index("lexicon_entries_review_status_idx").on(table.reviewStatus),
  ],
);

/** A separate digital-access purchase record. It never represents a physical book order. */
export const lexiconPurchases = mysqlTable(
  "lexicon_purchases",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    productKey: varchar("product_key", { length: 96 }).notNull().default("online_lexicon_access"),
    provider: mysqlEnum("provider", ["stripe"]).notNull().default("stripe"),
    providerReferenceToken: varchar("provider_reference_token", { length: 128 }).notNull().unique(),
    providerCheckoutSessionId: varchar("provider_checkout_session_id", { length: 255 }).unique(),
    providerPaymentIntentId: varchar("provider_payment_intent_id", { length: 255 }),
    status: mysqlEnum("status", ["pending", "paid", "failed", "refunded", "reversed", "expired"]).notNull().default("pending"),
    currency: varchar("currency", { length: 12 }),
    amountCents: int("amount_cents"),
    accessDurationDays: int("access_duration_days").notNull(),
    accessStartsAt: timestamp("access_starts_at"),
    accessEndsAt: timestamp("access_ends_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("lexicon_purchases_user_id_idx").on(table.userId),
    index("lexicon_purchases_status_idx").on(table.status),
  ],
);

/** Centralized permission records checked before any premium Lexicon fields are retrieved. */
export const lexiconEntitlements = mysqlTable(
  "lexicon_entitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    purchaseId: int("purchase_id"),
    productKey: varchar("product_key", { length: 96 }).notNull().default("online_lexicon_access"),
    status: mysqlEnum("status", ["active", "expired", "revoked"]).notNull().default("active"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("lexicon_entitlements_user_id_idx").on(table.userId),
    index("lexicon_entitlements_active_window_idx").on(table.userId, table.status, table.endsAt),
  ],
);

/** Idempotency ledger for verified payment-provider events; secrets and raw credentials are never persisted. */
export const lexiconPaymentWebhookEvents = mysqlTable(
  "lexicon_payment_webhook_events",
  {
    id: int("id").autoincrement().primaryKey(),
    provider: mysqlEnum("provider", ["stripe"]).notNull().default("stripe"),
    providerEventId: varchar("provider_event_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    payloadHash: varchar("payload_hash", { length: 128 }),
    processingStatus: mysqlEnum("processing_status", ["processing", "processed", "ignored", "failed"]).notNull(),
    processedAt: timestamp("processed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [index("lexicon_payment_webhook_events_type_idx").on(table.eventType)],
);

/** Source records cited by entries, claims, and relationships. */
export const sources = mysqlTable(
  "sources",
  {
    id: int("id").autoincrement().primaryKey(),
    orbionId: varchar("orbion_id", { length: 16 }).notNull().unique(),
    title: text("title").notNull(),
    publisher: varchar("publisher", { length: 255 }),
    author: varchar("author", { length: 255 }),
    publicationDate: varchar("publication_date", { length: 32 }),
    sourceType: varchar("source_type", { length: 64 }).notNull(),
    locator: text("locator"),
    rightsStatus: mysqlEnum("rights_status", ["approved_for_reference", "pending_review", "unknown"])
      .notNull()
      .default("pending_review"),
    retrievedAt: timestamp("retrieved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("sources_source_type_idx").on(table.sourceType)],
);

/** Time-bounded assertions that can be reviewed without rewriting an entire entry. */
export const claims = mysqlTable(
  "claims",
  {
    id: int("id").autoincrement().primaryKey(),
    entryId: int("entry_id").notNull(),
    text: text("text").notNull(),
    status: mysqlEnum("status", ["draft", "active", "superseded", "retracted"])
      .notNull()
      .default("draft"),
    validFrom: timestamp("valid_from"),
    validTo: timestamp("valid_to"),
    sourceIds: json("source_ids").$type<number[]>().notNull(),
    reviewStatus: mysqlEnum("review_status", ["review_pending", "approved", "archived"])
      .notNull()
      .default("review_pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("claims_entry_id_idx").on(table.entryId)],
);

/** Directed, reviewable connections between canonical Lexicon entries. */
export const relations = mysqlTable(
  "relations",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectId: int("subject_id").notNull(),
    predicate: varchar("predicate", { length: 128 }).notNull(),
    objectId: int("object_id").notNull(),
    validFrom: timestamp("valid_from"),
    validTo: timestamp("valid_to"),
    sourceIds: json("source_ids").$type<number[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("relations_subject_id_idx").on(table.subjectId),
    index("relations_object_id_idx").on(table.objectId),
  ],
);

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;
export type LexiconEntry = typeof lexiconEntries.$inferSelect;
export type InsertLexiconEntry = typeof lexiconEntries.$inferInsert;
export type LexiconPurchase = typeof lexiconPurchases.$inferSelect;
export type InsertLexiconPurchase = typeof lexiconPurchases.$inferInsert;
export type LexiconEntitlement = typeof lexiconEntitlements.$inferSelect;
export type InsertLexiconEntitlement = typeof lexiconEntitlements.$inferInsert;
export type LexiconPaymentWebhookEvent = typeof lexiconPaymentWebhookEvents.$inferSelect;
export type InsertLexiconPaymentWebhookEvent = typeof lexiconPaymentWebhookEvents.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = typeof claims.$inferInsert;
export type Relation = typeof relations.$inferSelect;
export type InsertRelation = typeof relations.$inferInsert;
