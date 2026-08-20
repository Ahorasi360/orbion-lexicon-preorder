import { describe, expect, it } from "vitest";
import express from "express";
import { getPublicOAuthConfig, registerOAuthRoutes } from "./oauth";

describe("public OAuth configuration", () => {
  it("exposes only the client settings required to begin secure sign-in", () => {
    const config = getPublicOAuthConfig();

    expect(config.appId).toBeTypeOf("string");
    expect(config.appId.length).toBeGreaterThan(0);
    expect(config.portalUrl).toMatch(/^https:\/\//);
    expect(config.appTitle).toBe("Orbion Online Lexicon");
    expect(Object.keys(config).sort()).toEqual(["appId", "appTitle", "portalUrl"]);
  });

  it("returns the configured public application title from the lightweight OAuth endpoint", async () => {
    const app = express();
    registerOAuthRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("OAuth test server did not expose a TCP port.");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/oauth/config`);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        appTitle: "Orbion Online Lexicon",
        appId: expect.any(String),
        portalUrl: expect.stringMatching(/^https:\/\//),
      });
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
