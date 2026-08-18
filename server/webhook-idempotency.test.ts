import { describe, expect, it } from "vitest";
import { isWebhookEventClaimable } from "./db";

describe("Online Lexicon webhook idempotency", () => {
  it("allows only a new event or an explicitly failed event to enter processing", () => {
    expect(isWebhookEventClaimable(undefined)).toBe(true);
    expect(isWebhookEventClaimable("failed")).toBe(true);
    expect(isWebhookEventClaimable("processing")).toBe(false);
    expect(isWebhookEventClaimable("processed")).toBe(false);
    expect(isWebhookEventClaimable("ignored")).toBe(false);
  });
});
