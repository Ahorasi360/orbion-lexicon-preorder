import { afterEach, describe, expect, it, vi } from "vitest";
import { captureSchema, integrationConfig, preorderRouter } from "./preorder";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("preorder lead validation", () => {
  it("accepts the form fields required for a preorder lead", () => {
    expect(
      captureSchema.parse({
        name: "Avery Stone",
        email: "avery@example.com",
        editionInterest: "collector",
        source: "preorder-form",
      }),
    ).toMatchObject({ editionInterest: "collector", source: "preorder-form" });
  });

  it("rejects malformed email addresses before any external data call", () => {
    expect(() =>
      captureSchema.parse({
        name: "Avery Stone",
        email: "not-an-email",
        editionInterest: "starter-pack",
        source: "starter-pack-form",
      }),
    ).toThrow();
  });

  it("keeps the service configuration server-only", () => {
    const config = integrationConfig();
    expect(Object.keys(config)).toEqual([
      "captureEnabled",
      "supabaseUrl",
      "supabaseServiceRoleKey",
      "resendApiKey",
      "resendFromEmail",
    ]);
  });

  it("returns only the configured edition checkout links at runtime", async () => {
    vi.stubEnv("VITE_STRIPE_COLLECTOR_PAYMENT_LINK", "https://checkout.stripe.com/c/pay/collector");
    vi.stubEnv("VITE_STRIPE_HARDCOVER_PAYMENT_LINK", "https://checkout.stripe.com/c/pay/hardcover");
    vi.stubEnv("VITE_STRIPE_PAPERBACK_PAYMENT_LINK", "https://checkout.stripe.com/c/pay/paperback");

    const result = await preorderRouter.createCaller({} as never).checkoutLinks();

    expect(result).toEqual({
      collector: "https://checkout.stripe.com/c/pay/collector",
      hardcover: "https://checkout.stripe.com/c/pay/hardcover",
      paperback: "https://checkout.stripe.com/c/pay/paperback",
    });
  });
});
