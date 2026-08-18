import { useEffect } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import PlatformShell from "@/components/PlatformShell";
import Seo from "@/components/Seo";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";

export default function OnlineAccessPage() {
  const { isAuthenticated, loading } = useAuth();
  const { data: product } = trpc.access.product.useQuery();
  const startCheckout = trpc.access.startCheckout.useMutation({
    onSuccess: result => {
      if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
    },
  });
  const ready = product?.configured && product.webhookConfigured;
  useEffect(() => { trackEvent("online_access_view", { configured: Boolean(product?.configured) }); }, [product?.configured]);

  return <PlatformShell><Seo title="Online Lexicon Access | Orbion" description="One year of member access to the Orbion Online Lexicon, purchased separately from the physical book." canonicalPath="/lexicon/access" noindex /><section className="page-hero compact-hero"><div className="platform-container access-hero"><div><p className="platform-kicker">ORBION ONLINE LEXICON</p><h1>One year of<br /><em>connected access.</em></h1><p>Member access to the connected Orbion Online Lexicon. The physical book is a separate product and remains available independently.</p></div><aside className="access-price-card"><p>ANNUAL ACCESS</p><strong>$79<span> / year</span></strong><small>One-time payment · no automatic renewal</small></aside></div></section><section className="section-light"><div className="platform-container access-layout"><div className="access-benefits"><p className="entry-section-label">WHAT ACCESS INCLUDES</p><h2>Built for active reference,<br />not casual browsing.</h2><ul><li><CheckCircle2 size={18} /> Full member entry narratives and connected concepts</li><li><CheckCircle2 size={18} /> Evidence and source context in the member experience</li><li><CheckCircle2 size={18} /> One year of account-linked access after a verified purchase</li><li><CheckCircle2 size={18} /> No automatic renewal; future purchase pricing may change at Orbion’s discretion</li></ul></div><aside className="access-checkout-card"><LockKeyhole size={22} /><p className="entry-section-label">SECURE ACCESS</p><h2>Unlock the full Lexicon</h2><p>{loading ? "Checking your account…" : !isAuthenticated ? "Sign in first so verified access can be tied to your Orbion account." : !ready ? "Annual access is being configured. Please check back shortly." : "Purchase access securely through Stripe. Your entitlement is granted only after server-side payment verification."}</p>{!isAuthenticated ? <button type="button" className="primary-cta" onClick={() => { trackEvent("access_cta_click", { placement: "access_sign_in" }); startLogin(); }}>Sign in to continue <ArrowRight size={16} /></button> : <button type="button" className="primary-cta" disabled={!ready || startCheckout.isPending} onClick={() => { trackEvent("online_access_checkout_start", { priceCents: 7900, durationDays: 365 }); startCheckout.mutate(); }}>{startCheckout.isPending ? "Preparing secure checkout…" : "Continue to secure checkout"} <ArrowRight size={16} /></button>}{startCheckout.isError ? <p className="access-error" role="alert">We could not prepare checkout. Please try again.</p> : null}<p className="access-fine-print"><ShieldCheck size={14} /> The price shown at checkout applies to your completed purchase. Access is fixed for one year and is not bundled with a book.</p></aside></div></section></PlatformShell>;
}
