# Stripe Payment Link Integration Note

For the separate Orbion Online Lexicon annual-access Payment Link, Stripe documents a `client_reference_id` URL parameter for reconciling a checkout with an internal, non-secret reference. Orbion will use an opaque server-created purchase token rather than a user identifier, email address, credential, or other sensitive value. A Stripe-signature-verified webhook then resolves that token server-side before granting a fixed-term entitlement. A publicly visible Payment Link ID is not required because only a cryptographically random token created for a pending signed-in purchase can be reconciled.

Reference: [Track a payment link — Stripe Documentation](https://docs.stripe.com/payment-links/url-parameters)

This note does not authorize use of the existing physical-book Payment Links for Online Lexicon access. The $79 annual Online Lexicon link remains a separate digital product.
