import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import {
  activateLexiconEntitlement,
  claimLexiconWebhookEvent,
  completeLexiconWebhookEvent,
  createLexiconPurchase,
  getLexiconPurchaseByReferenceToken,
  markLexiconPurchasePaid,
  revokeLexiconEntitlementByPaymentIntent,
} from "./db";

const PRODUCT_KEY = "online_lexicon_access";
const WEBHOOK_TOLERANCE_SECONDS = 300;

export type OnlineAccessConfig = {
  configured: boolean;
  paymentLink: string | null;
  accessDurationDays: number | null;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
};

export function onlineAccessConfig(): OnlineAccessConfig {
  const accessDurationDays = Number.parseInt(process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS ?? "", 10);
  return {
    configured: Boolean(process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK && Number.isInteger(accessDurationDays) && accessDurationDays > 0),
    paymentLink: process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK ?? null,
    accessDurationDays: Number.isInteger(accessDurationDays) && accessDurationDays > 0 ? accessDurationDays : null,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? null,
    stripeWebhookSecret: process.env.STRIPE_ONLINE_LEXICON_WEBHOOK_SECRET ?? null,
  };
}

export async function createOnlineAccessCheckout(input: { userId: number; email: string | null }) {
  const config = onlineAccessConfig();
  if (!config.configured || !config.paymentLink || !config.accessDurationDays) {
    return { configured: false as const, checkoutUrl: null };
  }
  const referenceToken = randomUUID();
  await createLexiconPurchase({ userId: input.userId, referenceToken, accessDurationDays: config.accessDurationDays });
  const checkoutUrl = new URL(config.paymentLink);
  checkoutUrl.searchParams.set("client_reference_id", referenceToken);
  return { configured: true as const, checkoutUrl: checkoutUrl.toString() };
}

function signatureParts(header: string | undefined) {
  if (!header) return null;
  const fields = new Map(header.split(",").map(part => {
    const [key, value] = part.split("=", 2);
    return [key, value];
  }));
  const timestamp = fields.get("t");
  const signature = fields.get("v1");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return null;
  return { timestamp: Number(timestamp), signature };
}

export function verifyStripeSignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string | null) {
  const parts = signatureParts(signatureHeader);
  if (!parts || !secret || Math.abs(Math.floor(Date.now() / 1000) - parts.timestamp) > WEBHOOK_TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${parts.timestamp}.${rawBody.toString("utf8")}`).digest("hex");
  const provided = Buffer.from(parts.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer);
}

function normalizedPaymentLink(url: string) {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
}

export async function isConfiguredOnlineLexiconPaymentLink(paymentLinkId: string, config: OnlineAccessConfig) {
  if (!config.paymentLink || !config.stripeSecretKey) return false;
  const response = await fetch(`https://api.stripe.com/v1/payment_links/${encodeURIComponent(paymentLinkId)}`, {
    headers: { Authorization: `Bearer ${config.stripeSecretKey}` },
  });
  if (!response.ok) return false;
  const paymentLink = await response.json() as { url?: string };
  return typeof paymentLink.url === "string" && normalizedPaymentLink(paymentLink.url) === normalizedPaymentLink(config.paymentLink);
}

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

async function processVerifiedStripeEvent(event: StripeWebhookEvent, payloadHash: string) {
  const config = onlineAccessConfig();
  const claimed = await claimLexiconWebhookEvent({ providerEventId: event.id, eventType: event.type, payloadHash });
  if (!claimed.claimed || !claimed.eventId) return;
  try {
    const object = event.data.object;
    if (event.type === "checkout.session.completed") {
      const paymentStatus = object.payment_status;
      const sessionId = typeof object.id === "string" ? object.id : null;
      const paymentIntentId = typeof object.payment_intent === "string" ? object.payment_intent : null;
      const referenceToken = typeof object.client_reference_id === "string" ? object.client_reference_id : null;
      const paymentLinkId = typeof object.payment_link === "string" ? object.payment_link : null;
      const fromConfiguredLink = paymentLinkId ? await isConfiguredOnlineLexiconPaymentLink(paymentLinkId, config) : false;
      if (paymentStatus === "paid" && sessionId && referenceToken && fromConfiguredLink) {
        const pendingPurchase = await getLexiconPurchaseByReferenceToken(referenceToken);
        if (!pendingPurchase) throw new Error("Online Lexicon purchase is not recognized.");
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + pendingPurchase.accessDurationDays * 24 * 60 * 60 * 1000);
        const purchase = await markLexiconPurchasePaid({
          referenceToken,
          checkoutSessionId: sessionId,
          paymentIntentId,
          currency: typeof object.currency === "string" ? object.currency : null,
          amountCents: typeof object.amount_total === "number" ? object.amount_total : null,
          startsAt,
          endsAt,
        });
        await activateLexiconEntitlement({ userId: purchase.userId, purchaseId: purchase.id, startsAt, endsAt });
      }
    } else if (event.type === "charge.refunded") {
      const paymentIntentId = typeof object.payment_intent === "string" ? object.payment_intent : null;
      if (paymentIntentId) await revokeLexiconEntitlementByPaymentIntent(paymentIntentId);
    }
    await completeLexiconWebhookEvent(claimed.eventId, "processed");
  } catch (error) {
    await completeLexiconWebhookEvent(claimed.eventId, "failed");
    throw error;
  }
}

export async function handleOnlineLexiconStripeWebhook(req: Request, res: Response) {
  const config = onlineAccessConfig();
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!verifyStripeSignature(rawBody, req.header("stripe-signature"), config.stripeWebhookSecret)) {
    res.status(400).json({ received: false });
    return;
  }
  try {
    const event = JSON.parse(rawBody.toString("utf8")) as StripeWebhookEvent;
    if (!event.id || !event.type || !event.data?.object) throw new Error("Malformed webhook event.");
    await processVerifiedStripeEvent(event, createHash("sha256").update(rawBody).digest("hex"));
    res.status(200).json({ received: true });
  } catch {
    res.status(500).json({ received: false });
  }
}
