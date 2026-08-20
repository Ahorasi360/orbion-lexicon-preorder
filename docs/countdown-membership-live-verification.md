# Live Countdown and Membership Preview Verification

The GitHub-backed Vercel deployment was checked after the approved enhancement commits.

| Surface | Verified live behavior |
|---|---|
| `/book` | A running, accessible countdown appears beneath the January 1, 2027 expected-delivery label. The $349, $149, and $89 preorder offers remain visible. |
| `/lexicon/access` | The $79/year offer remains separate from the physical book. The page shows 500 connected terms, 20 navigable domains, A–Z browsing and search, and one year of account-linked access without exposing protected entry content. |

The signed-out access page continues to require sign-in before secure checkout. No checkout or payment was opened or submitted during verification.

## Release Handoff

The published implementation is preserved in the managed checkpoint `539e49f5` and in the GitHub `main` branch through the following confirmed commits: `2a6d9eb` (countdown utility and test), `bae1191` (countdown component), `8fa3c8c` (stylesheet and application entry), and `2159c60` (Book and Online Lexicon access pages).

The release path is **GitHub `main` → existing connected Vercel project → https://orbion-lexicon-preorder-seven.vercel.app/**. The live site was verified after the final commit. This publication used the already signed-in repository session; it required no new device code, authorization change, Stripe action, or custom-domain DNS change.
