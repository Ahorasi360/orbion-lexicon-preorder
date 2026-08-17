import Home from "./Home";
import Seo from "@/components/Seo";

/**
 * The existing preorder experience remains self-contained so its checkout,
 * lead-capture, policy, and conversion behavior are preserved at /book.
 */
export default function BookPage() {
  return <><Seo title="The Orbion Space Lexicon | Preorder the First Edition" description="Preorder The Orbion Space Lexicon: 500 essential concepts for the modern space industry. First Edition delivery expected October 31, 2026." canonicalPath="/book" /><Home /></>;
}
