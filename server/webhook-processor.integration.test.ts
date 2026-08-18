import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  activateLexiconEntitlement: vi.fn(),
  claimLexiconWebhookEvent: vi.fn(),
  completeLexiconWebhookEvent: vi.fn(),
  createLexiconPurchase: vi.fn(),
  getLexiconPurchaseByReferenceToken: vi.fn(),
  markLexiconPurchasePaid: vi.fn(),
  revokeLexiconEntitlementByPaymentIntent: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { processVerifiedStripeEvent } from "./onlineLexiconCommerce";

const original = {
  paymentLink: process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK,
  duration: process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS,
  stripeKey: process.env.STRIPE_SECRET_KEY,
};

describe("Online Lexicon webhook processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK = "https://buy.stripe.com/14A14h3gPfcBgIta1HbEA0f";
    process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS = "365";
    process.env.STRIPE_SECRET_KEY = "sk_test_owner_preview_regression";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://buy.stripe.com/14A14h3gPfcBgIta1HbEA0f" }),
    }));
    dbMocks.getLexiconPurchaseByReferenceToken.mockResolvedValue({ id: 41, userId: 7, accessDurationDays: 365 });
    dbMocks.markLexiconPurchasePaid.mockResolvedValue({ id: 41, userId: 7 });
    dbMocks.activateLexiconEntitlement.mockResolvedValue(11);
    dbMocks.completeLexiconWebhookEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK = original.paymentLink;
    process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS = original.duration;
    process.env.STRIPE_SECRET_KEY = original.stripeKey;
    vi.restoreAllMocks();
  });

  it("processes a signed-event claim once and ignores a duplicate delivery before a second entitlement grant", async () => {
    dbMocks.claimLexiconWebhookEvent
      .mockResolvedValueOnce({ claimed: true, eventId: 99 })
      .mockResolvedValueOnce({ claimed: false, eventId: 99 });
    const event = {
      id: "evt_duplicate_guard",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_verified_annual",
          payment_status: "paid",
          payment_intent: "pi_verified_annual",
          client_reference_id: "opaque-owner-bound-token",
          payment_link: "plink_annual",
          amount_total: 7900,
          currency: "usd",
        },
      },
    };

    await Promise.all([
      processVerifiedStripeEvent(event, "payload-hash"),
      processVerifiedStripeEvent(event, "payload-hash"),
    ]);

    expect(dbMocks.claimLexiconWebhookEvent).toHaveBeenCalledTimes(2);
    expect(dbMocks.markLexiconPurchasePaid).toHaveBeenCalledTimes(1);
    expect(dbMocks.activateLexiconEntitlement).toHaveBeenCalledTimes(1);
    expect(dbMocks.completeLexiconWebhookEvent).toHaveBeenCalledTimes(1);
    expect(dbMocks.completeLexiconWebhookEvent).toHaveBeenCalledWith(99, "processed");
  });
});
