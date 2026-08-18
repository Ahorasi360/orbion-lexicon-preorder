import { Clock3, LogIn, LogOut, ShieldCheck } from "lucide-react";
import PlatformShell from "@/components/PlatformShell";
import Seo from "@/components/Seo";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

export default function AccountPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: access, isLoading: accessLoading } = trpc.access.status.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) return <PlatformShell><div className="page-loading">Loading your account…</div></PlatformShell>;

  if (!user) {
    return <PlatformShell><Seo title="Sign In | Orbion Online Lexicon" description="Sign in to view your Orbion Online Lexicon access status." canonicalPath="/account" noindex /><section className="page-hero compact-hero"><div className="platform-container"><p className="platform-kicker">MEMBER ACCOUNT</p><h1>Sign in to view<br /><em>your access.</em></h1><p>Online Lexicon access is tied to your account after a verified purchase. The physical book remains a separate product.</p><button className="primary-cta" type="button" onClick={() => startLogin()}><LogIn size={16} /> Sign in to Orbion</button></div></section></PlatformShell>;
  }

  const entitlement = access?.entitlement;
  const active = entitlement?.status === "active";
  return <PlatformShell><Seo title="My Account | Orbion Online Lexicon" description="View your Orbion Online Lexicon access status and account details." canonicalPath="/account" noindex /><section className="page-hero compact-hero"><div className="platform-container"><p className="platform-kicker">MEMBER ACCOUNT</p><h1>Your Orbion<br /><em>access status.</em></h1><p>{accessLoading ? "Checking your account status…" : `Signed in as ${access?.account.email ?? user.email ?? user.name ?? "Orbion member"}.`}</p></div></section><section className="section-light"><div className="platform-container account-grid"><article className="account-card"><div className="account-card-icon"><ShieldCheck size={22} /></div><p className="entry-section-label">ONLINE LEXICON ACCESS</p><h2>{active ? "Active access" : "No active access"}</h2><p>{active ? "Your full member Lexicon access is active." : "Your account is ready. Purchase Online Lexicon access separately to unlock member entries."}</p>{active && entitlement?.endsAt ? <p className="account-detail"><Clock3 size={15} /> Access ends {new Date(entitlement.endsAt).toLocaleDateString()}</p> : <a className="primary-cta" href="/lexicon/access">Explore Online Access</a>}</article><article className="account-card"><div className="account-card-icon"><LogIn size={22} /></div><p className="entry-section-label">ACCOUNT IDENTITY</p><h2>{access?.account.name ?? user.name ?? "Orbion member"}</h2><p>{access?.account.email ?? user.email ?? "Email is supplied by your secure sign-in provider."}</p><p className="account-detail">Sign-in method: {access?.account.loginMethod ?? user.loginMethod ?? "secure account login"}</p><button className="outline-link" type="button" onClick={() => logout()}><LogOut size={15} /> Sign out</button></article><article className="account-card account-card-wide"><p className="entry-section-label">PURCHASE STATUS</p><h2>Online Lexicon purchase history</h2>{access?.purchases.length ? <div className="account-purchases">{access.purchases.map((purchase, index) => <div key={`${purchase.productKey}-${index}`}><strong>{purchase.productKey.replaceAll("_", " ")}</strong><span>{purchase.status}</span><small>{purchase.accessEndsAt ? `Access ends ${new Date(purchase.accessEndsAt).toLocaleDateString()}` : "Access dates are being confirmed"}</small></div>)}</div> : <p>No Online Lexicon purchase is associated with this account yet. Physical-book preorders are managed separately and do not appear here.</p>}</article></div></section></PlatformShell>;
}
