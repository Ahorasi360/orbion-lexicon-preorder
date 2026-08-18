import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  lexiconEntitlements,
  lexiconEntries,
  lexiconPaymentWebhookEvents,
  lexiconPurchases,
  sources,
  users,
  domains,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Read-only public content helpers for the Online Lexicon. */
export async function listLexiconEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lexiconEntries).orderBy(asc(lexiconEntries.canonicalName));
}

/**
 * Safe catalog projection for logged-out visitors. It intentionally omits every
 * premium manuscript field, including short/full definitions and relationships.
 */
const catalogEntryFields = {
  id: lexiconEntries.id,
  orbionId: lexiconEntries.orbionId,
  slug: lexiconEntries.slug,
  canonicalName: lexiconEntries.canonicalName,
  acronym: lexiconEntries.acronym,
  aliases: lexiconEntries.aliases,
  publicTeaser: lexiconEntries.publicTeaser,
  isPublicPreview: lexiconEntries.isPublicPreview,
  publicPreviewDefinition: lexiconEntries.publicPreviewDefinition,
  publicPreviewWhyItMatters: lexiconEntries.publicPreviewWhyItMatters,
  publicPreviewRelatedSlugs: lexiconEntries.publicPreviewRelatedSlugs,
  indexStatus: lexiconEntries.indexStatus,
  domainIds: lexiconEntries.domainIds,
  reviewStatus: lexiconEntries.reviewStatus,
  updatedAt: lexiconEntries.updatedAt,
};

export async function listLexiconCatalogEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select(catalogEntryFields).from(lexiconEntries).orderBy(asc(lexiconEntries.canonicalName));
}

export async function getLexiconCatalogEntryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select(catalogEntryFields).from(lexiconEntries).where(eq(lexiconEntries.slug, slug)).limit(1);
  return result[0];
}

export async function getLexiconEntryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lexiconEntries).where(eq(lexiconEntries.slug, slug)).limit(1);
  return result[0];
}

export async function listLexiconDomains() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(domains).orderBy(asc(domains.id));
}

export async function listLexiconSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sources).orderBy(asc(sources.orbionId));
}

export async function listSourcesByOrbionIds(orbionIds: string[]) {
  const db = await getDb();
  if (!db || orbionIds.length === 0) return [];
  return db.select().from(sources).where(inArray(sources.orbionId, orbionIds));
}

/** A single, reusable authorization check for all server-side premium content paths. */
export async function getActiveLexiconEntitlement(userId: number, at = new Date()) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(lexiconEntitlements)
    .where(
      and(
        eq(lexiconEntitlements.userId, userId),
        eq(lexiconEntitlements.status, "active"),
        gt(lexiconEntitlements.endsAt, at),
      ),
    )
    .orderBy(desc(lexiconEntitlements.endsAt))
    .limit(1);
  return result[0];
}

export async function listLexiconPurchasesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lexiconPurchases).where(eq(lexiconPurchases.userId, userId)).orderBy(desc(lexiconPurchases.createdAt));
}

export async function createLexiconPurchase(input: {
  userId: number;
  referenceToken: string;
  accessDurationDays: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(lexiconPurchases).values({
    userId: input.userId,
    providerReferenceToken: input.referenceToken,
    accessDurationDays: input.accessDurationDays,
    status: "pending",
  });
}

export async function getLexiconPurchaseByReferenceToken(referenceToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lexiconPurchases).where(eq(lexiconPurchases.providerReferenceToken, referenceToken)).limit(1);
  return result[0];
}

export async function markLexiconPurchasePaid(input: {
  referenceToken: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  currency: string | null;
  amountCents: number | null;
  startsAt: Date;
  endsAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const existing = await db.select().from(lexiconPurchases).where(eq(lexiconPurchases.providerReferenceToken, input.referenceToken)).limit(1);
  if (!existing[0]) throw new Error("Online Lexicon purchase is not recognized.");
  await db.update(lexiconPurchases).set({
    status: "paid",
    providerCheckoutSessionId: input.checkoutSessionId,
    providerPaymentIntentId: input.paymentIntentId,
    currency: input.currency,
    amountCents: input.amountCents,
    accessStartsAt: input.startsAt,
    accessEndsAt: input.endsAt,
  }).where(eq(lexiconPurchases.id, existing[0].id));
  return { ...existing[0], status: "paid" as const, accessStartsAt: input.startsAt, accessEndsAt: input.endsAt };
}

export async function activateLexiconEntitlement(input: { userId: number; purchaseId: number; startsAt: Date; endsAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const existing = await db.select().from(lexiconEntitlements).where(eq(lexiconEntitlements.purchaseId, input.purchaseId)).limit(1);
  if (existing[0]) {
    await db.update(lexiconEntitlements).set({ status: "active", startsAt: input.startsAt, endsAt: input.endsAt, revokedAt: null }).where(eq(lexiconEntitlements.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(lexiconEntitlements).values({ userId: input.userId, purchaseId: input.purchaseId, startsAt: input.startsAt, endsAt: input.endsAt, status: "active" });
  return Number(result[0].insertId);
}

export async function revokeLexiconEntitlementByPaymentIntent(paymentIntentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const purchases = await db.select().from(lexiconPurchases).where(eq(lexiconPurchases.providerPaymentIntentId, paymentIntentId));
  for (const purchase of purchases) {
    await db.update(lexiconPurchases).set({ status: "refunded" }).where(eq(lexiconPurchases.id, purchase.id));
    await db.update(lexiconEntitlements).set({ status: "revoked", revokedAt: new Date() }).where(eq(lexiconEntitlements.purchaseId, purchase.id));
  }
}

export function isWebhookEventClaimable(status: "processing" | "processed" | "ignored" | "failed" | undefined) {
  return status === undefined || status === "failed";
}

export async function claimLexiconWebhookEvent(input: { providerEventId: string; eventType: string; payloadHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const existing = await db.select().from(lexiconPaymentWebhookEvents).where(eq(lexiconPaymentWebhookEvents.providerEventId, input.providerEventId)).limit(1);
  if (existing[0]) {
    if (!isWebhookEventClaimable(existing[0].processingStatus)) return { claimed: false as const, eventId: existing[0].id };
    const result = await db.update(lexiconPaymentWebhookEvents)
      .set({ processingStatus: "processing", processedAt: new Date() })
      .where(and(eq(lexiconPaymentWebhookEvents.id, existing[0].id), eq(lexiconPaymentWebhookEvents.processingStatus, "failed")));
    return { claimed: Number(result[0].affectedRows) > 0, eventId: existing[0].id };
  }
  try {
    const result = await db.insert(lexiconPaymentWebhookEvents).values({ ...input, processingStatus: "processing" });
    return { claimed: true as const, eventId: Number(result[0].insertId) };
  } catch {
    return { claimed: false as const, eventId: null };
  }
}

export async function completeLexiconWebhookEvent(eventId: number, processingStatus: "processed" | "ignored" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(lexiconPaymentWebhookEvents).set({ processingStatus, processedAt: new Date() }).where(eq(lexiconPaymentWebhookEvents.id, eventId));
}
