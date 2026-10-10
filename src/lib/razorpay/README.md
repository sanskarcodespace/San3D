# Razorpay integration boundary

Reserved for future server-side payment adapters. No SDK, checkout, payment endpoints, or live transactions are implemented yet.

When implementing:

- Install `razorpay` and `server-only`; restrict the SDK and secret configuration to server modules.
- Create orders on the server using authoritative catalog prices and integer paise; never trust client totals.
- Return only the public key ID and the required checkout fields to the browser.
- Verify payment signatures on the server. Verify webhook signatures against the raw request body and the separate webhook secret.
- Persist payment events idempotently and reconcile them with orders. Do not mark an order paid based solely on a browser callback.
- Start with test-mode keys. Add validation, authorization, and integration tests before enabling live payments.

Environment placeholders are documented in the root `.env.example`.
