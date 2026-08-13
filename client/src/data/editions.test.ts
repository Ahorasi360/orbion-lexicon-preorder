import { describe, expect, it } from "vitest";
import { editions } from "./editions";

describe("first-edition pricing catalog", () => {
  it("keeps the requested three-tier pricing and collector exclusives", () => {
    expect(editions.map((edition) => edition.price)).toEqual(["$349", "$149", "$89"]);
    expect(editions.filter((edition) => edition.featured)).toHaveLength(1);
    expect(editions[0].details).toEqual(expect.arrayContaining(["Signed by the author", "No. ___ / 1000", "Premium presentation box", "Certificate of authenticity"]));
  });
});
