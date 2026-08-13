import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";

const input = {
  name: "Avery Stone",
  email: "avery@example.com",
  editionInterest: "starter-pack" as const,
  source: "starter-pack-form" as const,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("preorder capture", () => {
  it("returns a safe not-ready state when Supabase configuration is absent", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const result = await appRouter.createCaller({} as never).preorder.capture(input);
    expect(result).toEqual({ accepted: false, configured: false, starterPackUrl: null });
  });

  it("writes the lead and returns the gated Starter Pack URL when services are configured", async () => {
    vi.stubEnv("PREORDER_CAPTURE_ENABLED", "true");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "updates@example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await appRouter.createCaller({} as never).preorder.capture(input);

    expect(result).toEqual({ accepted: true, configured: true, starterPackUrl: "/manus-storage/orbion-space-industry-starter-pack_f0e10736.pdf" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/rest/v1/preorder_leads");
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://api.resend.com/emails");
  });
});
