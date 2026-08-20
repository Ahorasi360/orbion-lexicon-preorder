import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./cookies";

function requestFor(hostname: string, protocol = "http", forwardedProto?: string) {
  return {
    hostname,
    protocol,
    headers: forwardedProto ? { "x-forwarded-proto": forwardedProto } : {},
  } as never;
}

describe("getSessionCookieOptions", () => {
  it("sets a browser-valid cross-site cookie for a public callback even when the proxy reports HTTP", () => {
    expect(getSessionCookieOptions(requestFor("orbion-lexicon-preorder-seven.vercel.app"))).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
    });
  });

  it("keeps local development cookies compatible with HTTP", () => {
    expect(getSessionCookieOptions(requestFor("localhost"))).toMatchObject({
      sameSite: "lax",
      secure: false,
    });
  });

  it("honors an HTTPS forwarding header for a public callback", () => {
    expect(getSessionCookieOptions(requestFor("example.test", "http", "https"))).toMatchObject({
      sameSite: "none",
      secure: true,
    });
  });
});
