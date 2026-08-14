import { describe, expect, it } from "vitest";

describe("live preorder activation", () => {
  it("enables capture and can reach the secure Supabase preorder table", async () => {
    expect(process.env.PREORDER_CAPTURE_ENABLED).toBe("true");
    expect(process.env.SUPABASE_URL).toBeTruthy();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();

    const response = await fetch(`${process.env.SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/preorder_leads?select=id&limit=1`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      },
    });

    expect(response.status).toBe(200);
  }, 15_000);
});
