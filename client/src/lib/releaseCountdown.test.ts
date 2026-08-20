import { describe, expect, it } from "vitest";
import { formatCountdownUnit, getReleaseCountdown } from "./releaseCountdown";

describe("getReleaseCountdown", () => {
  it("calculates full delivery units without rounding up", () => {
    const target = Date.parse("2027-01-01T00:00:00-08:00");
    const now = target - (((2 * 86_400) + (3 * 3_600) + (4 * 60) + 5) * 1_000);

    expect(getReleaseCountdown(now, target)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, complete: false });
  });

  it("does not show negative time after delivery", () => {
    expect(getReleaseCountdown(2_000, 1_000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  });

  it("formats compact time units consistently", () => {
    expect(formatCountdownUnit(7)).toBe("07");
    expect(formatCountdownUnit(18)).toBe("18");
  });
});
