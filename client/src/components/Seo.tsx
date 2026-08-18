import { useEffect } from "react";

const siteUrl = "https://orbionlexicon.com";

export type SeoProps = {
  title: string;
  description: string;
  canonicalPath: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function applySeo({ title, description, canonicalPath, structuredData, noindex }: SeoProps) {
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  document.title = title;
  setMeta('meta[name="description"]', "name", "description", description);
  setMeta('meta[property="og:title"]', "property", "og:title", title);
  setMeta('meta[property="og:description"]', "property", "og:description", description);
  setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow");

  const schemaId = "orbion-route-schema";
  document.getElementById(schemaId)?.remove();
  if (structuredData) {
    const script = document.createElement("script");
    script.id = schemaId;
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }
}

export default function Seo(props: SeoProps) {
  useEffect(() => { applySeo(props); }, [props.title, props.description, props.canonicalPath, props.structuredData, props.noindex]);
  return null;
}

export const routeMeta: Record<string, Omit<SeoProps, "canonicalPath">> = {
  "/": { title: "Orbion Online Lexicon | The Language of Space, Connected.", description: "Explore 500 essential concepts for the modern space industry through the connected Orbion Online Lexicon." },
  "/book": { title: "The Orbion Space Lexicon | Preorder the First Edition", description: "Preorder The Orbion Space Lexicon: 500 essential concepts for the modern space industry. First Edition delivery expected October 31, 2026." },
  "/lexicon": { title: "Space Industry Lexicon | Orbion Online Lexicon", description: "Search connected space-industry terms, acronyms, aliases, and definitions in the Orbion Online Lexicon." },
  "/domains": { title: "Space Industry Domains | Orbion Online Lexicon", description: "Explore twenty connected domains of the modern space industry, from spaceflight foundations to strategy and intelligence." },
  "/maps": { title: "Space Industry Context Maps | Orbion", description: "Navigate the Orbion Lexicon through guided orbital, mission, and commercial context maps." },
  "/methodology": { title: "Evidence Methodology | Orbion Online Lexicon", description: "Learn how Orbion approaches traceability, evidence, interpretation, review status, and corrections." },
  "/sources": { title: "Source Records | Orbion Online Lexicon", description: "Browse source records parsed from the Orbion Space Lexicon First Edition review manuscript." },
  "/search": { title: "Search the Orbion Online Lexicon", description: "Search terms, acronyms, aliases, definitions, domains, and connected concepts across the Orbion Online Lexicon." },
  "/about": { title: "About Orbion | Connected Space Industry Reference", description: "Learn about Orbion and The Orbion Space Lexicon, a connected reference for the modern space industry." },
  "/intelligence": { title: "Orbion Intelligence | Early Access", description: "Orbion Intelligence is in development to help users navigate space-industry decisions using connected evidence." },
};
