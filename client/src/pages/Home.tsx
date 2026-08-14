import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ChevronDown, ExternalLink, FileText, Gem, Mail, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { editions as editionCatalog } from "@/data/editions";
import { PolicyLinks } from "@/pages/LegalPage";

const productMockup = "/manus-storage/orbion-collector-edition-mockup_42a870c0.png";
const starterPackUrl = "/manus-storage/orbion-space-industry-starter-pack_f0e10736.pdf";
const visualSamples = [
  { src: "/manus-storage/spaceflight_04992f8e.png", alt: "The Spaceflight illustrated Lexicon entry" },
  { src: "/manus-storage/karman-vacuum_08062df7.png", alt: "The Kármán Line and Vacuum illustrated Lexicon entries" },
  { src: "/manus-storage/thrust_3ebb5f19.png", alt: "The Thrust illustrated Lexicon entry" },
];

const editions = editionCatalog;

type FormSource = "preorder-form" | "starter-pack-form";
type EditionInterest = "collector" | "hardcover" | "paperback" | "starter-pack" | "updates";

function PreorderConfidence() {
  return <aside className="preorder-confidence"><ShieldCheck className="h-5 w-5" /><div><strong>Preorder confidence</strong><p>This is a paid preorder for a work currently in final production. The estimated publication date is October 31, 2026. Customers will receive production updates by email. Unshipped orders may be canceled for a full refund. If the fulfillment schedule materially changes, customers will be notified and given the option to accept the revised schedule or cancel.</p><p className="confidence-links"><a href="/preorder-refund-policy">Cancellation & refunds</a><span>·</span><a href="/shipping-delay-policy">Shipping & delays</a><span>·</span><a href="/terms-of-sale">Terms of Sale</a></p></div></aside>;
}

function EditionButton({ edition, checkoutLink, isLoading }: { edition: (typeof editions)[number]; checkoutLink: string | null | undefined; isLoading: boolean }) {
  const handleClick = () => {
    if (!checkoutLink) {
      toast.info(isLoading ? "Preparing secure checkout" : "Checkout is temporarily unavailable", { description: isLoading ? "Please try again in a moment." : "Please contact hello@orbionlexicon.com for preorder help." });
      return;
    }
    window.open(checkoutLink, "_blank", "noopener,noreferrer");
  };
  const label = edition.name.includes("Collector") ? "Collector’s" : edition.name.includes("Hardcover") ? "Hardcover" : "Paperback";
  return <Button onClick={handleClick} className={edition.featured ? "w-full collector-button" : "w-full tier-button"}>Preorder {label}<ExternalLink className="ml-2 h-4 w-4" /></Button>;
}

function LeadForm({ source, compact = false, onSuccess }: { source: FormSource; compact?: boolean; onSuccess?: (url: string | null) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editionInterest, setEditionInterest] = useState<EditionInterest>(source === "starter-pack-form" ? "starter-pack" : "collector");
  const capture = trpc.preorder.capture.useMutation({
    onSuccess: (result) => {
      if (!result.configured) {
        toast.info("Email collection is nearly ready", { description: "The secure list is being connected. Please check back shortly." });
        return;
      }
      toast.success(source === "starter-pack-form" ? "Your Starter Pack is ready" : "You’re on the first-edition list", { description: "We’ll email you your confirmation and October 31, 2026 delivery update." });
      setName("");
      setEmail("");
      onSuccess?.(result.starterPackUrl);
    },
    onError: (error) => toast.error("We couldn’t save your request", { description: error.message }),
  });
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    capture.mutate({ name, email, editionInterest, source });
  };
  return <form onSubmit={submit} className={compact ? "lead-form compact" : "lead-form"}>
    <div className={compact ? "form-row" : "form-stack"}>
      <div><Label htmlFor={`${source}-name`}>Name</Label><Input id={`${source}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" required /></div>
      <div><Label htmlFor={`${source}-email`}>Email</Label><Input id={`${source}-email`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
    </div>
    {source === "preorder-form" && <RadioGroup value={editionInterest} onValueChange={(value) => setEditionInterest(value as EditionInterest)} className="interest-options">
      {editions.map((edition) => <Label key={edition.id} className="interest-option" htmlFor={`interest-${edition.id}`}><RadioGroupItem id={`interest-${edition.id}`} value={edition.id} /><span>{edition.name.replace(" Edition", "")}</span></Label>)}
    </RadioGroup>}
    <p className="form-note">By joining, you agree to receive first-edition and release updates from Orbion. Unsubscribe anytime.</p>
    <Button type="submit" disabled={capture.isPending} className="form-submit">{capture.isPending ? "Securing your place…" : source === "starter-pack-form" ? "Get the free Starter Pack" : "Join the preorder list"}<Mail className="ml-2 h-4 w-4" /></Button>
  </form>;
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [starterUrl, setStarterUrl] = useState<string | null>(null);
  const checkoutLinks = trpc.preorder.checkoutLinks.useQuery(undefined, { staleTime: 1000 * 60 * 30 });
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); setMobileMenuOpen(false); };
  return (
    <div className="orbion-site">
      <header className="site-header">
        <button className="wordmark" onClick={() => scrollTo("top")} aria-label="Back to the top of the page"><span>THE ORBION</span><strong>SPACE LEXICON</strong></button>
        <nav className={mobileMenuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation"><button onClick={() => scrollTo("edition")}>Collector’s Edition</button><button onClick={() => scrollTo("compare")}>Editions</button><button onClick={() => scrollTo("preview")}>Preview</button><button onClick={() => scrollTo("preorder")}>Preorder</button></nav>
        <button className="header-cta" onClick={() => scrollTo("preorder")}>Join the list</button>
        <button className="mobile-menu" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle navigation">{mobileMenuOpen ? <X /> : <Menu />}</button>
      </header>
      <main id="top">
        <section className="hero section-shell">
          <div className="orbital-glow" aria-hidden="true" />
          <div className="hero-copy"><p className="eyebrow"><Sparkles className="h-4 w-4" /> FIRST EDITION · 2026</p><h1>The Orbion<br /><em>Space Lexicon</em></h1><p className="hero-tagline">500 essential concepts for the modern space industry</p><p className="hero-body">A visually led professional reference that turns the language of modern spaceflight into a practical system of understanding.</p><div className="hero-actions"><Button onClick={() => scrollTo("preorder")} className="collector-button">Join the preorder list <ChevronDown className="ml-2 h-4 w-4" /></Button><button className="text-link" onClick={() => scrollTo("preview")}>Read the illustrated preview</button></div><div className="hero-meta"><span>EXPECTED DELIVERY</span><strong>OCTOBER 31, 2026</strong></div></div>
          <div className="hero-product"><div className="product-halo" aria-hidden="true" /><img src={productMockup} alt="The Orbion Space Lexicon Collector’s Edition hardcover, presentation box, certificate, and numbered plate" /><p>First 1,000 Collector’s Edition <span>·</span> $349</p></div>
        </section>
        <section className="visual-proof section-shell">
          <div className="section-kicker">THE LANGUAGE OF SPACE · BY ORBION</div>
          <div className="section-heading split-heading"><h2>Space has a language.<br /><em>Learn it before you navigate it.</em></h2><p>Every entry turns a complex term into a clear distinction, a visual model, and a practical reason it matters.</p></div>
          <div className="visual-sample-grid">{visualSamples.map((sample, index) => <figure key={sample.src} className={`sample-page sample-${index + 1}`}><img src={sample.src} alt={sample.alt} /><figcaption><span>0{index + 1}</span>{index === 0 ? "One term" : index === 1 ? "One distinction" : "One visual model"}</figcaption></figure>)}</div>
        </section>
        <section className="trust-path"><div className="section-shell"><div className="trust-intro"><div><p className="eyebrow"><ShieldCheck className="h-4 w-4" /> A CAREFULLY PREPARED FIRST EDITION</p><h2>From campaign<br /><em>to collector.</em></h2></div><p>First-edition checkout is open now. Explore the illustrated preview, choose the edition that fits your collection, and receive delivery details as the October 31, 2026 release approaches.</p></div><div className="trust-steps"><div><span>01</span><strong>Explore</strong><p>Read real illustrated entries.</p></div><div><span>02</span><strong>Choose</strong><p>Select your preferred edition.</p></div><div><span>03</span><strong>Preorder</strong><p>Secure checkout through Stripe.</p></div><div className="active"><span>04</span><strong>Receive</strong><p>Delivery begins October 31.</p></div></div></div></section>
        <section id="edition" className="collector-section section-shell"><div className="section-kicker">THE PREMIER FIRST-EDITION OFFER</div><div className="section-heading split-heading"><h2>Made to keep.<br /><em>Built to reference.</em></h2><p>The First 1,000 Collector’s Edition transforms the complete Lexicon into a signed, numbered, shelf-worthy first-edition artifact.</p></div><div className="collector-grid"><div className="edition-number-card"><span>COLLECTOR’S EDITION MARK</span><strong>No. ___ / 1000</strong><p>Each copy receives an individual edition number, matched to its certificate of authenticity.</p></div><div className="component-list"><div><span>01</span><div><h3>Signed hardcover</h3><p>The complete first-edition hardcover, personally signed by Anthony Galeano.</p></div></div><div><span>02</span><div><h3>Individual edition number</h3><p>A dedicated number identifies your copy within the limited run.</p></div></div><div><span>03</span><div><h3>Premium presentation box</h3><p>A midnight navy box protects and displays the first-edition volume.</p></div></div><div><span>04</span><div><h3>Certificate of authenticity</h3><p>A matching certificate confirms the Collector’s Edition and edition number.</p></div></div></div></div></section>
        <section id="compare" className="pricing-section section-shell"><div className="section-kicker">CHOOSE YOUR FIRST EDITION</div><div className="section-heading centered"><h2>Three ways to own<br /><em>the Lexicon.</em></h2></div><div className="edition-cards">{editions.map((edition) => <article key={edition.id} className={edition.featured ? "edition-card featured" : "edition-card"}>{edition.featured && <div className="featured-flag">THE FIRST 1,000</div>}<p className="card-eyebrow">{edition.eyebrow}</p><h3>{edition.name}</h3><p className="edition-price">{edition.price}<span>.00</span></p><p className="edition-description">{edition.description}</p><ul>{edition.details.map((detail) => <li key={detail}><Check className="h-4 w-4" />{detail}</li>)}</ul><EditionButton edition={edition} checkoutLink={checkoutLinks.data?.[edition.id]} isLoading={checkoutLinks.isLoading} /></article>)}</div><PreorderConfidence /><div className="comparison-wrap"><table><thead><tr><th>Edition</th><th>Format</th><th>Signed</th><th>Numbered</th><th>Presentation box</th><th>Price</th></tr></thead><tbody><tr><td>Collector’s</td><td>Hardcover</td><td><Check /></td><td><Check /></td><td><Check /></td><td>$349</td></tr><tr><td>Hardcover</td><td>Hardcover</td><td>—</td><td>—</td><td>—</td><td>$149</td></tr><tr><td>Paperback</td><td>Paperback</td><td>—</td><td>—</td><td>—</td><td>$89</td></tr></tbody></table></div></section>
        <section id="preview" className="preview-section section-shell"><div className="preview-panel"><div className="preview-copy"><p className="eyebrow"><FileText className="h-4 w-4" /> FREE ILLUSTRATED PREVIEW</p><h2>See the Lexicon<br /><em>in motion.</em></h2><p>Get a ten-page illustrated sample from the Spaceflight Foundations & Physics domain—real entries, visual explainers, and the evidence system inside the full edition.</p>{starterUrl ? <a className="download-link" href={starterUrl || starterPackUrl} target="_blank" rel="noreferrer">Download your Starter Pack <ExternalLink className="h-4 w-4" /></a> : <LeadForm source="starter-pack-form" compact onSuccess={(url) => setStarterUrl(url || starterPackUrl)} />}</div><div className="preview-stat"><span>10</span><p>illustrated pages<br />from the first edition</p></div></div></section>
        <section id="preorder" className="preorder-section section-shell"><div className="preorder-info"><p className="eyebrow"><Gem className="h-4 w-4" /> THE FIRST 1,000 COLLECTOR’S EDITION</p><h2>Claim your place in<br /><em>the first edition.</em></h2><p>Join the preorder list for release details, early collector updates, and the moment the edition becomes available.</p><div className="delivery-card"><ShieldCheck /><div><span>EXPECTED DELIVERY</span><strong>October 31, 2026</strong></div></div></div><div className="preorder-form-shell"><LeadForm source="preorder-form" /><PreorderConfidence /></div></section>
      </main>
      <footer><div className="footer-brand"><span>THE ORBION</span><strong>SPACE LEXICON</strong></div><PolicyLinks /><p>© 2026 Anthony Galeano · Founder, Orbion</p><button onClick={() => scrollTo("top")}>Back to top ↑</button></footer>
      <div className="sticky-preorder"><div><span>FIRST 1,000 COLLECTOR’S EDITION</span><strong>$349 · Signed · Numbered · Boxed</strong></div><Button onClick={() => scrollTo("preorder")} className="collector-button">Join the list</Button></div>
    </div>
  );
}
