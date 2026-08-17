import { describe, expect, it } from "vitest";
import type { LexiconEntry } from "../../drizzle/schema";
import { normalizeStringArray, scoreLexiconMatch } from "./lexicon";

const entry = {
  canonicalName: "Spaceflight",
  acronym: "SF",
  aliases: ["space flight"],
  connectedConcepts: ["Aerospace", "Outer Space"],
  shortDefinition: "Movement through space.",
  fullDefinition: "A mission lifecycle beyond ordinary atmospheric flight.",
} as LexiconEntry;

describe("Lexicon search helpers", () => {
  it("normalizes database JSON arrays without assuming the driver return shape", () => {
    expect(normalizeStringArray(["Spaceflight", 5, "Aerospace"])).toEqual(["Spaceflight", "Aerospace"]);
    expect(normalizeStringArray('["Spaceflight", "Aerospace"]')).toEqual(["Spaceflight", "Aerospace"]);
  });

  it("prioritizes exact canonical terms over secondary definition matches", () => {
    expect(scoreLexiconMatch(entry, "Spaceflight")).toMatchObject({ score: 100, match: "Exact term match" });
    expect(scoreLexiconMatch(entry, "mission lifecycle").score).toBeGreaterThan(0);
  });

  it("supports acronym, alias, and connected-concept discovery", () => {
    expect(scoreLexiconMatch(entry, "SF")).toMatchObject({ score: 95, match: "Acronym match" });
    expect(scoreLexiconMatch(entry, "space flight")).toMatchObject({ score: 90, match: "Alias match" });
    expect(scoreLexiconMatch(entry, "outer")).toMatchObject({ match: "Connected concept match" });
  });
});
