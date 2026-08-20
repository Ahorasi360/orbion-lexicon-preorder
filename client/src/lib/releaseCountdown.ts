export const ORBION_DELIVERY_TIMESTAMP = Date.parse("2027-01-01T00:00:00-08:00");

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

export function getReleaseCountdown(now = Date.now(), target = ORBION_DELIVERY_TIMESTAMP): CountdownParts {
  const remaining = Math.max(0, target - now);
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    complete: remaining === 0,
  };
}

export function formatCountdownUnit(value: number) {
  return String(value).padStart(2, "0");
}
