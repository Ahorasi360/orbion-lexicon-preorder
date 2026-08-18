# Stripe Payment Link Integration Note

For the separate Orbion Online Lexicon annual-access Payment Link, Stripe documents a `client_reference_id` URL parameter for reconciling a checkout with an internal, non-secret reference. Orbion will use an opaque server-created purchase token rather than a user identifier, email address, credential, or other sensitive value. A Stripe-signature-verified webhook then resolves that token server-side before granting a fixed-term entitlement. A publicly visible Payment Link ID is not required because only a cryptographically random token created for a pending signed-in purchase can be reconciled.

Reference: [Track a payment link — Stripe Documentation](https://docs.stripe.com/payment-links/url-parameters)

This note does not authorize use of the existing physical-book Payment Links for Online Lexicon access. The $79 annual Online Lexicon link remains a separate digital product.

## Owner-confirmed webhook configuration

On August 18, 2026, the owner confirmed that the separate Stripe destination named **Orbion Online Lexicon payments** was configured to deliver exactly two events to:

`https://orbion-lexicon-preorder-seven.vercel.app/api/stripe/online-lexicon-webhook`

The required events are `checkout.session.completed` and `charge.refunded`. Before production launch or any endpoint/domain change, recheck this exact event list in Stripe Dashboard. This destination must remain distinct from all physical-book checkout and webhook configuration.
