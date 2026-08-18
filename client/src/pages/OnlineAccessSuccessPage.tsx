import { useEffect } from "react";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import PlatformShell from "@/components/PlatformShell";
import Seo from "@/components/Seo";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";

export default function OnlineAccessSuccessPage() {
  const { isAuthenticated, loading } = useAuth();
  const { data, isLoading } = trpc.access.status.useQuery(undefined, { enabled: isAuthenticated });
  const active = data?.entitlement?.status === "active";
  useEffect(() => { trackEvent("online_access_status_view", { signedIn: isAuthenticated, active: Boolean(active) }); }, [active, isAuthenticated]);
  return <PlatformShell><Seo title="Online Lexicon Access Status | Orbion" description="Confirm your Orbion Online Lexicon account access status." canonicalPath="/lexicon/access/success" noindex /><section className="page-hero compact-hero"><div className="platform-container"><p className="platform-kicker">ONLINE LEXICON ACCESS</p><h1>{active ? <>Your access is<br /><em>ready.</em></> : <>Payment status<br /><em>is being verified.</em></>}</h1><p>{active ? "Your verified annual member access is active." : "We never grant access from a browser return alone. Stripe verification is being confirmed securely on the server."}</p></div></section><section className="section-light"><div className="platform-container narrow-content"><article className="access-checkout-card access-status-card">{active ? <ShieldCheck size={26} /> : <Clock3 size={26} />}<h2>{loading || isLoading ? "Checking your access…" : active ? "Member access confirmed" : "Verification in progress"}</h2><p>{!isAuthenticated ? "Sign in with the account you used before purchase so Orbion can show the verified access status." : active && data?.entitlement?.endsAt ? `Your Online Lexicon access is active through ${new Date(data.entitlement.endsAt).toLocaleDateString()}.` : "If you just completed payment, please allow a moment for Stripe’s signed event to reach Orbion, then refresh this page."}</p>{!isAuthenticated ? <button type="button" className="primary-cta" onClick={() => startLogin()}>Sign in to check access <ArrowRight size={16} /></button> : active ? <a href="/lexicon" className="primary-cta">Open member Lexicon <ArrowRight size={16} /></a> : <a href="/account" className="outline-link">View account status</a>}</article></div></section></PlatformShell>;
}
