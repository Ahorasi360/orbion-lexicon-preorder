import { describe, expect, it } from "vitest";
import { editions } from "../client/src/data/editions";

describe("first-edition pricing catalog", () => {
  it("keeps the exact three-tier preorder prices", () => {
    expect(editions.map((edition) => edition.price)).toEqual(["$349", "$149", "$89"]);
  });

  it("reserves the numbered collector features for the highlighted edition", () => {
    const collector = editions.find((edition) => edition.id === "collector");

    expect(collector?.featured).toBe(true);
    expect(collector?.details).toEqual(expect.arrayContaining([
      "Signed by the author",
      "No. ___ / 1000",
      "Premium presentation box",
      "Certificate of authenticity",
    ]));
  });
});
