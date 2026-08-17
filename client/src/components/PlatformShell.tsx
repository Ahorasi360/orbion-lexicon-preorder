import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import Seo, { routeMeta } from "@/components/Seo";

const primaryLinks = [
  { href: "/", label: "Explore" },
  { href: "/lexicon", label: "Lexicon" },
  { href: "/domains", label: "Domains" },
  { href: "/maps", label: "Maps" },
  { href: "/book", label: "The Book" },
  { href: "/methodology", label: "Methodology" },
];

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const canonicalPath = location.split("?")[0] || "/";
  const metadata = routeMeta[canonicalPath];

  return (
    <div className="platform-site">
      {metadata ? <Seo {...metadata} canonicalPath={canonicalPath} /> : null}
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="platform-header">
        <div className="platform-header-inner">
          <Link href="/" className="platform-wordmark" onClick={() => setMobileOpen(false)} aria-label="Orbion home">
            <span>ORBION</span>
            <small>ONLINE LEXICON</small>
          </Link>
          <nav className={`platform-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            <p className="mobile-nav-title">Explore Orbion</p>
            {primaryLinks.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={location === item.href || (item.href === "/lexicon" && location.startsWith("/lexicon")) ? "is-active" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/search" className="platform-search-link" onClick={() => setMobileOpen(false)}>
              <Search size={15} aria-hidden="true" />
              Search
            </Link>
            <Link href="/intelligence" className="intelligence-link" onClick={() => setMobileOpen(false)}>
              Orbion Intelligence <span aria-hidden="true">→</span>
            </Link>
          </nav>
          <button
            type="button"
            className="platform-menu-button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(open => !open)}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            <span>{mobileOpen ? "Close" : "Menu"}</span>
          </button>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="platform-footer">
        <div className="platform-footer-inner">
          <div className="platform-footer-brand">
            <span>ORBION</span>
            <p>The language of space, connected.</p>
          </div>
          <div className="platform-footer-links">
            <div>
              <strong>Explore</strong>
              <Link href="/lexicon">Lexicon</Link>
              <Link href="/domains">Domains</Link>
              <Link href="/maps">Maps</Link>
            </div>
            <div>
              <strong>The Book</strong>
              <Link href="/book">The Orbion Space Lexicon</Link>
              <Link href="/book#preorder">Preorder / Buy</Link>
            </div>
            <div>
              <strong>Company</strong>
              <Link href="/about">About</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/sources">Sources</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div>
              <strong>Orbion Intelligence</strong>
              <Link href="/intelligence">Early Access</Link>
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/terms-of-sale">Terms</Link>
            </div>
          </div>
          <p className="platform-copyright">© 2026 Anthony Galeano. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
