export type OrbionAnalyticsEvent =
  | "lexicon_search"
  | "lexicon_entry_view"
  | "preview_entry_view"
  | "locked_result_view"
  | "locked_result_click"
  | "paywall_view"
  | "access_cta_click"
  | "related_term_click"
  | "domain_view"
  | "map_open"
  | "source_open"
  | "book_cta_click"
  | "intelligence_cta_click"
  | "preorder_click"
  | "waitlist_signup"
  | "online_access_view"
  | "online_access_checkout_start"
  | "online_access_status_view";

/**
 * Vendor-neutral client event hook. A future analytics integration can listen
 * for the `orbion:analytics` browser event or wrap this function without
 * changing the public experience.
 */
export function trackEvent(name: OrbionAnalyticsEvent, properties: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("orbion:analytics", { detail: { name, properties, occurredAt: new Date().toISOString() } }));
}
