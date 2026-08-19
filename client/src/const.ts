import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
type OAuthClientConfig = {
  appId: string;
  portalUrl: string;
};

async function getOAuthClientConfig(): Promise<OAuthClientConfig> {
  const configuredPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const configuredAppId = import.meta.env.VITE_APP_ID;

  if (configuredPortalUrl && configuredAppId) {
    return { appId: configuredAppId, portalUrl: configuredPortalUrl };
  }

  const response = await fetch("/api/oauth/config", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Secure sign-in configuration is unavailable.");
  }

  const config = (await response.json()) as Partial<OAuthClientConfig>;
  if (!config.appId || !config.portalUrl) {
    throw new Error("Secure sign-in configuration is incomplete.");
  }

  return { appId: config.appId, portalUrl: config.portalUrl };
}

export const startLogin = async () => {
  const { appId, portalUrl } = await getOAuthClientConfig();
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${portalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};
