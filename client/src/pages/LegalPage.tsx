import Seo from "@/components/Seo";

type PolicySection = {
  heading: string;
  paragraphs: string[];
};

type PolicyPage = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: PolicySection[];
};

const supportEmail = "hello@orbionlexicon.com";

const pages: Record<string, PolicyPage> = {
  "terms-of-sale": {
    eyebrow: "2027 FIRST-EDITION PURCHASE TERMS",
    title: "Terms of Sale",
    summary: "These Terms of Sale govern purchases of the 2027 First Edition of The Orbion Space Lexicon through Orbion’s approved preorder checkout links.",
    sections: [
      { heading: "The offer", paragraphs: ["The Orbion Space Lexicon is offered in three 2027 first-edition formats: the First 1,000 Collector’s Edition at $349, the Hardcover Edition at $149, and the Paperback Edition at $89. The Collector’s Edition is limited to the initial run of 1,000 individually numbered copies and includes the items described on the product page.", "A purchase is a paid preorder for a work in final production. Product descriptions, price, availability, and expected delivery timing are presented in good faith and may be clarified or updated before fulfillment where necessary."] },
      { heading: "Payment and order acceptance", paragraphs: ["Payments are processed through Stripe checkout. By completing checkout, you authorize the stated charge and confirm that the order and contact details you provide are accurate. An order is accepted when payment is successfully processed and an order confirmation is issued, subject to availability and the policies linked at checkout.", "If a payment cannot be processed, a limited edition is no longer available, or an order cannot reasonably be fulfilled, Orbion may decline or cancel the order and will refund any amount paid for that unfulfilled order."] },
      { heading: "Collector’s Edition numbering", paragraphs: ["Collector’s Edition numbers are assigned by Orbion during fulfillment. A requested number is not guaranteed unless Orbion explicitly confirms it in writing. The edition number, signed book, presentation box, and certificate of authenticity are intended to remain matched as a single collector set."] },
      { heading: "Online Lexicon access and acceptable use", paragraphs: ["Online Lexicon access, when offered, is a separate digital product and is personal to the registered account holder. It is not transferable, may not be shared, and may be used by one active browser session at a time. The physical book and Online Lexicon access are separate products unless Orbion expressly states otherwise at checkout.", "Abusive use includes, without limitation: sharing account credentials or providing access to another person; using a single account as a shared or group account; attempting to bypass authentication, payment, session, rate-limit, or other technical controls; automated scraping, harvesting, extraction, copying, or reproduction of Lexicon content; redistributing, reselling, repackaging, publishing, or commercially exploiting content without written authorization; fraudulent, deceptive, unlawful, or security-compromising activity; or conduct that interferes with the service or the access of other users.", "Orbion may investigate suspected abusive use and may suspend or terminate Online Lexicon access where it reasonably determines that abusive use or a material breach has occurred. Where termination results from substantiated abusive use or a material breach, access may be terminated without refund to the extent permitted by applicable law. This provision does not limit any non-waivable consumer rights or remedies required by applicable law."] },
      { heading: "Updates to these terms", paragraphs: ["These terms may be updated to reflect production, fulfillment, legal, or operational changes. The version posted on this page applies to purchases made after its effective date. Material changes affecting an existing paid preorder will be communicated to the customer using the email provided at checkout."] },
    ],
  },
  "preorder-refund-policy": {
    eyebrow: "PREORDER PROTECTION",
    title: "Preorder, Cancellation & Refund Policy",
    summary: "Clear expectations for paid first-edition preorders, order changes, cancellations, and refunds.",
    sections: [
      { heading: "Preorder confidence", paragraphs: ["This is a paid preorder for a work currently in final production. The estimated publication date is January 1, 2027. Customers will receive production updates by email. Unshipped orders may be canceled for a full refund. If the fulfillment schedule materially changes, customers will be notified and given the option to accept the revised schedule or cancel."] },
      { heading: "Before an order ships", paragraphs: ["You may request cancellation of an unshipped preorder by contacting Orbion at hello@orbionlexicon.com from the email used at checkout. If your order has not entered shipment processing, Orbion will issue a full refund to the original payment method.", "If the first-edition fulfillment schedule materially changes, Orbion will send an email notice explaining the revised estimate and the available options. You may accept the revised schedule or request cancellation and a full refund before shipment."] },
      { heading: "After shipment", paragraphs: ["Once an order has shipped, it can no longer be canceled as an unshipped preorder. If an item arrives damaged, incorrect, or incomplete, contact Orbion within 14 days of delivery with your order details and supporting photographs where relevant. Orbion will review the issue and provide an appropriate remedy under applicable law."] },
      { heading: "Refund timing", paragraphs: ["Approved refunds are returned to the original payment method. Financial institutions and payment providers may take additional time to post the refund after it is issued. Shipping charges already incurred, if any, are handled in accordance with applicable law and the circumstances of the return or fulfillment issue."] },
    ],
  },
  "shipping-delay-policy": {
    eyebrow: "FULFILLMENT EXPECTATIONS",
    title: "Shipping & Delay Policy",
    summary: "How first-edition fulfillment, delivery estimates, address changes, and material schedule updates are handled.",
    sections: [
      { heading: "Expected delivery", paragraphs: ["The expected publication and initial fulfillment date for The Orbion Space Lexicon is January 1, 2027. This is an estimate, not a guarantee of delivery on a specific day. Delivery timing depends on final production, signed-edition preparation, carrier processing, destination, and other fulfillment conditions."] },
      { heading: "Shipping charges and addresses", paragraphs: ["Any applicable shipping charge, destination limitation, and tax presented at checkout apply to that order. Please provide a complete and accurate delivery address. Contact hello@orbionlexicon.com as soon as possible if an address needs to change; updates cannot be guaranteed after shipment processing begins."] },
      { heading: "Production or carrier delays", paragraphs: ["Orbion will use reasonable efforts to communicate meaningful production or fulfillment changes to preorder customers by email. If the schedule materially changes, customers will receive the revised estimate and the opportunity to accept it or cancel an unshipped order for a full refund, as described in the Preorder, Cancellation & Refund Policy."] },
      { heading: "Delivery issues", paragraphs: ["If a shipment is lost, damaged, incomplete, or delivered to the wrong address because of an Orbion fulfillment error, contact Orbion promptly with the order details. Carrier investigations, replacements, and remedies may require reasonable processing time."] },
    ],
  },
  "privacy-policy": {
    eyebrow: "YOUR INFORMATION",
    title: "Privacy Policy",
    summary: "How Orbion handles the information submitted through the preorder list and illustrated Starter Pack forms.",
    sections: [
      { heading: "Information collected", paragraphs: ["When you join the first-edition list or request the Starter Pack, Orbion collects your name, email address, edition interest, and the source of your signup. Payment information is handled by Stripe during checkout and is not collected by the Orbion website form."] },
      { heading: "How information is used", paragraphs: ["Orbion uses your information to deliver the requested Starter Pack, send first-edition and production updates, provide preorder-related communications, respond to support requests, and maintain the preorder-interest list. You may unsubscribe from promotional email or request deletion of your list information by contacting hello@orbionlexicon.com."] },
      { heading: "Service providers and retention", paragraphs: ["Preorder-list information is stored through Supabase, and confirmation emails are sent through Resend. Stripe processes checkout payments. These providers may process information only as needed to provide their services and subject to their own terms and privacy practices.", "Orbion retains signup information for as long as it is reasonably needed for the purposes above, unless a longer period is required by law or a customer requests deletion where applicable."] },
      { heading: "Security and changes", paragraphs: ["Orbion uses reasonable administrative and technical measures to protect submitted information, but no internet transmission or storage system is completely secure. This policy may be updated as the preorder program or site operations develop; the current version will always be posted here."] },
    ],
  },
  contact: {
    eyebrow: "CUSTOMER SUPPORT",
    title: "Contact Orbion",
    summary: "For preorder support, address updates, cancellation requests, corrections, or general questions about The Orbion Space Lexicon.",
    sections: [
      { heading: "Email support", paragraphs: ["Write to hello@orbionlexicon.com. For help with a paid preorder, please use the same email address used at checkout and include your order confirmation details. Do not send card numbers or other payment credentials by email."] },
      { heading: "What to include", paragraphs: ["For address changes, include your order name, order email, and the new delivery address. For cancellation requests, include your order email and state that you are requesting cancellation before shipment. For a damaged or incomplete delivery, include clear photographs and your order details."] },
      { heading: "Corrections and editorial feedback", paragraphs: ["For a potential correction or erratum, include the entry name, page number when available, the issue you identified, and a source or explanation that supports the correction. Accepted corrections will be tracked on the Corrections & Errata page."] },
    ],
  },
  corrections: {
    eyebrow: "EDITORIAL STEWARDSHIP",
    title: "Corrections & Errata",
    summary: "A public record for verified corrections to The Orbion Space Lexicon First Edition.",
    sections: [
      { heading: "Current status", paragraphs: ["No corrections have been published on this page yet. As the First Edition is finalized and distributed, verified factual, typographic, or production corrections will be recorded here with the affected entry or page reference and the correction date."] },
      { heading: "Submit a possible correction", paragraphs: ["Send a correction report to hello@orbionlexicon.com with the entry title, page number if available, a concise explanation, and supporting source material where relevant. Editorial submissions are reviewed before publication; a submission does not guarantee a change."] },
      { heading: "How updates are handled", paragraphs: ["Confirmed errata may be published on this page, incorporated into future printings, or reflected in a digital update where appropriate. Orbion will distinguish verified corrections from editorial clarifications or later expansions of the Lexicon."] },
    ],
  },
};

const policyLinks = [
  ["/terms-of-sale", "Terms of Sale"],
  ["/preorder-refund-policy", "Preorder & Refunds"],
  ["/shipping-delay-policy", "Shipping & Delays"],
  ["/privacy-policy", "Privacy"],
  ["/contact", "Contact"],
  ["/corrections", "Corrections & Errata"],
] as const;

export function PolicyLinks({ className = "" }: { className?: string }) {
  return <nav className={`policy-links ${className}`} aria-label="Legal and customer support"><>{policyLinks.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</></nav>;
}

export default function LegalPage({ slug }: { slug: keyof typeof pages }) {
  const page = pages[slug];

  return <><Seo title={`${page.title} | The Orbion Space Lexicon`} description={page.summary} canonicalPath={`/${slug}`} /><div className="legal-site">
    <header className="legal-header"><a className="legal-wordmark" href="/"><span>THE ORBION</span><strong>SPACE LEXICON</strong></a><a className="legal-preorder-link" href="/book#preorder">Preorder the 2027 First Edition</a></header>
    <main className="legal-main">
      <div className="legal-kicker">{page.eyebrow}</div>
      <h1>{page.title}</h1>
      <p className="legal-summary">{page.summary}</p>
      <p className="legal-date">Effective date: January 1, 2027 · Questions: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
      <div className="legal-content">{page.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
    </main>
    <footer className="legal-footer"><a className="legal-wordmark" href="/"><span>THE ORBION</span><strong>SPACE LEXICON</strong></a><PolicyLinks /><p>© 2027 Anthony Galeano · Founder, Orbion</p></footer>
  </div></>;
}
