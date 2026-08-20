import { describe, expect, it } from "vitest";
import { getSafePostLoginPath } from "./oauth";

describe("OAuth post-sign-in return paths", () => {
  it("preserves the separate Online Lexicon access route after sign-in", () => {
    expect(getSafePostLoginPath("/lexicon/access")).toBe("/lexicon/access");
    expect(getSafePostLoginPath("/lexicon/access?from=locked-entry")).toBe("/lexicon/access?from=locked-entry");
  });

  it("rejects external or malformed redirect targets", () => {
    expect(getSafePostLoginPath("https://example.com")).toBe("/");
    expect(getSafePostLoginPath("//example.com")).toBe("/");
    expect(getSafePostLoginPath("\\example.com")).toBe("/");
    expect(getSafePostLoginPath(undefined)).toBe("/");
  });
});
