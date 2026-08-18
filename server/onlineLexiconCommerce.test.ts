import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isConfiguredOnlineLexiconPaymentLink, onlineAccessConfig, verifyStripeSignature } from "./onlineLexiconCommerce";

const original = {
  stripeKey: process.env.STRIPE_SECRET_KEY,
  paymentLink: process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK,
  duration: process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS,
  webhookSecret: process.env.STRIPE_ONLINE_LEXICON_WEBHOOK_SECRET,
};

afterEach(() => {
  process.env.STRIPE_SECRET_KEY = original.stripeKey;
  process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK = original.paymentLink;
  process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS = original.duration;
  process.env.STRIPE_ONLINE_LEXICON_WEBHOOK_SECRET = original.webhookSecret;
  vi.restoreAllMocks();
});

describe("Online Lexicon commerce configuration", () => {
  it("remains disabled until a separate Stripe Payment Link and approved fixed access duration are configured", () => {
    delete process.env.STRIPE_ONLINE_LEXICON_PAYMENT_LINK;
    delete process.env.ONLINE_LEXICON_ACCESS_DURATION_DAYS;
    const config = onlineAccessConfig();
    expect(config.configured).toBe(false);
    expect(config.paymentLink).toBeNull();
    expect(config.accessDurationDays).toBeNull();
  });

  it("rejects a webhook body when the separate Online Lexicon webhook secret is absent", () => {
    const body = Buffer.from('{"id":"evt_test"}');
    expect(verifyStripeSignature(body, "t=1,v1=deadbeef", null)).toBe(false);
  });

  it("accepts a signed event using the configured dedicated webhook secret", () => {
    const secret = process.env.STRIPE_ONLINE_LEXICON_WEBHOOK_SECRET;
    expect(secret).toBeTruthy();
    const body = Buffer.from('{"id":"evt_config_validation","type":"checkout.session.completed"}');
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret!).update(`${timestamp}.${body.toString("utf8")}`).digest("hex");
    expect(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret!)).toBe(true);
  });

  it("uses the separately configured annual Payment Link and fixed 365-day duration", () => {
    const config = onlineAccessConfig();
    expect(config.paymentLink).toBe("https://buy.stripe.com/14A14h3gPfcBgIta1HbEA0f");
    expect(config.accessDurationDays).toBe(365);
  });

  it("only accepts a webhook Payment Link whose Stripe API URL matches the configured annual access link", async () => {
    const config = onlineAccessConfig();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "https://buy.stripe.com/14A14h3gPfcBgIta1HbEA0f" }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await isConfiguredOnlineLexiconPaymentLink("plink_annual", config)).toBe(true);
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ url: "https://buy.stripe.com/different-link" }) });
    expect(await isConfiguredOnlineLexiconPaymentLink("plink_other", config)).toBe(false);
  });
});
