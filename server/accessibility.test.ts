import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("public-platform accessibility safeguards", () => {
  const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");
  const shell = readFileSync(resolve(root, "client/src/components/PlatformShell.tsx"), "utf8");
  const preorder = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");

  it("keeps a visible focus indicator for keyboard users", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline:2px solid var(--orbion-cyan)");
  });

  it("provides a skip link and labeled public navigation", () => {
    expect(shell).toContain('href="#main-content"');
    expect(shell).toContain('aria-label="Primary navigation"');
    expect(shell).toContain('id="main-content"');
  });

  it("keeps preorder navigation and forms semantically labeled", () => {
    expect(preorder).toContain('aria-label="Main navigation"');
    expect(preorder).toContain('autoComplete="email"');
    expect(preorder).toContain('aria-label="Toggle navigation"');
  });

  it("keeps all core platform destinations available from the Book route", () => {
    for (const href of ["/", "/lexicon", "/domains", "/maps", "/methodology", "/sources", "/about", "/intelligence"]) {
      expect(preorder).toContain(`href="${href}"`);
    }
    expect(preorder).toContain("Preorder the book");
    expect(preorder).toContain("Join the preorder list");
  });
});
