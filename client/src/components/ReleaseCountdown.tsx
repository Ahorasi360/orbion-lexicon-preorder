import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { formatCountdownUnit, getReleaseCountdown } from "@/lib/releaseCountdown";

const units = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
] as const;

export default function ReleaseCountdown() {
  const [countdown, setCountdown] = useState(() => getReleaseCountdown());

  useEffect(() => {
    const refresh = () => setCountdown(getReleaseCountdown());
    const timer = window.setInterval(refresh, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (countdown.complete) {
    return <aside className="release-countdown" aria-label="Delivery update"><div className="release-countdown-heading"><CalendarClock size={16} /><span>DELIVERY UPDATE</span></div><strong>Initial fulfillment has begun.</strong><p>Thank you for supporting the 2027 First Edition.</p></aside>;
  }

  const accessibleTime = `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, and ${countdown.seconds} seconds`;

  return <aside className="release-countdown" aria-labelledby="release-countdown-title">
    <div className="release-countdown-heading"><CalendarClock size={16} /><span id="release-countdown-title">COUNTDOWN TO FIRST FULFILLMENT</span></div>
    <div className="release-countdown-units" role="timer" aria-label={`${accessibleTime} until January 1, 2027`}>
      {units.map(({ key, label }) => <div key={key} className="release-countdown-unit"><strong>{key === "days" ? countdown[key] : formatCountdownUnit(countdown[key])}</strong><span>{label}</span></div>)}
    </div>
    <p>Expected delivery begins January 1, 2027.</p>
  </aside>;
}
