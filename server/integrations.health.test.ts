import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

describe("preorder integration credentials", () => {
  it("authenticates against the configured Supabase project", async () => {
    expect(supabaseUrl).toBeTruthy();
    expect(supabaseServiceRoleKey).toBeTruthy();

    const response = await fetch(`${supabaseUrl?.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: supabaseServiceRoleKey ?? "" },
    });

    expect(response.status).toBe(200);
  }, 15_000);

  it("authenticates against the configured Resend account", async () => {
    expect(resendApiKey).toBeTruthy();

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
    });

    expect(response.status).toBe(200);
  }, 15_000);
});
