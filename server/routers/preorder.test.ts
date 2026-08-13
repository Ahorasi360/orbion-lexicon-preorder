import { describe, expect, it } from "vitest";
import { captureSchema, integrationConfig } from "./preorder";

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
});
