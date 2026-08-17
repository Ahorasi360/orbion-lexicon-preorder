import { ArrowRight, CheckCircle2, Network, SearchCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import PlatformShell from "@/components/PlatformShell";
import { trackEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

const futurePaths = ["Mission paths", "Company ecosystems", "Supplier dependencies", "Regulatory paths", "Technology relationships", "Evidence-backed research", "Change monitoring", "Decision briefs"];

export default function IntelligencePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const capture = trpc.preorder.capture.useMutation({ onSuccess: data => { setMessage(data.configured ? "You’re on the early-access list." : "Early-access capture is not active yet. Please contact hello@orbionlexicon.com."); if (data.configured) trackEvent("waitlist_signup", { product: "intelligence" }); }, onError: error => setMessage(error.message) });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); capture.mutate({ name, email, editionInterest: "updates", source: "intelligence-waitlist" }); };

  return <PlatformShell>
    <section className="intelligence-hero"><div className="platform-container intelligence-grid"><div><p className="platform-kicker">ORBION INTELLIGENCE · COMING NEXT</p><h1>From language<br /><em>to navigation.</em></h1><p>The Lexicon explains the vocabulary. Orbion Intelligence is in development to help users navigate decisions using connected evidence.</p><a href="#early-access" onClick={() => trackEvent("intelligence_cta_click", { placement: "hero" })}>Join early access <ArrowRight size={16} /></a></div><div className="intelligence-graphic" aria-hidden="true"><Network size={70} strokeWidth={.8} /><span className="intel-node n1" /><span className="intel-node n2" /><span className="intel-node n3" /><span className="intel-node n4" /><div>IN DEVELOPMENT</div></div></div></section>
    <section className="intelligence-main"><div className="platform-container"><div className="intelligence-explainer"><div><p className="platform-kicker on-light">WHAT IT IS DESIGNED TO SUPPORT</p><h2>Connected evidence<br /><em>for real questions.</em></h2></div><p>Illustrative future workflows may support research and decision preparation across the changing space ecosystem. They are a roadmap, not a public claim that these features are currently available.</p></div><div className="future-path-grid">{futurePaths.map((path, index) => <div key={path}><span>{String(index + 1).padStart(2, "0")}</span><strong>{path}</strong></div>)}</div></div></section>
    <section className="early-access" id="early-access"><div className="platform-container early-access-grid"><div><SearchCheck size={31} aria-hidden="true" /><p className="platform-kicker">EARLY ACCESS</p><h2>Be first to hear<br /><em>when it is ready.</em></h2><p>Join the Orbion Intelligence early-access list for future product updates. This is not access to an active application.</p></div><form onSubmit={submit}><label htmlFor="intel-name">Name</label><input id="intel-name" value={name} onChange={event => setName(event.target.value)} required minLength={2} placeholder="Your name" /><label htmlFor="intel-email">Email</label><input id="intel-email" value={email} onChange={event => setEmail(event.target.value)} required type="email" placeholder="you@example.com" /><button type="submit" disabled={capture.isPending}>{capture.isPending ? "Joining…" : "Join early access"} <ArrowRight size={15} /></button>{message ? <p className="capture-message"><CheckCircle2 size={14} /> {message}</p> : <p className="form-privacy">Your details are used for Orbion updates. See the <a href="/privacy-policy">Privacy Policy</a>.</p>}</form></div></section>
  </PlatformShell>;
}
