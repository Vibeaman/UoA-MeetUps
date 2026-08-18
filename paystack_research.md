# Paystack test integration research

## Official sources

- [Paystack Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack Accept Payments](https://paystack.com/docs/payments/accept-payments/)

## Verified requirements

Paystack sends webhook events as JSON and includes an `x-paystack-signature` header. The signature is an HMAC-SHA512 digest of the raw event payload using the Paystack secret key. The server must validate the signature before processing the event and return HTTP 200 to acknowledge receipt.

Paystack recommends initializing transactions from the backend. The frontend receives the resulting access code or authorization URL and completes payment through Paystack. The payment must then be verified using the webhook or the transaction verification endpoint. A successful payment should be accepted only after checking the transaction status and confirming that the verified amount matches the expected amount.

For redirect checkout, Paystack returns the customer to the configured callback URL. The application should read the transaction reference from the callback URL and call the backend verification endpoint; the callback itself is not trusted as proof of payment.

The relevant successful event is `charge.success`. Refund and failed/abandoned events should be represented separately so the admin revenue total can be calculated from verified successful payments less verified refunds.

## Live webhook validation follow-up

Paystack’s official webhook documentation states that a webhook URL must be publicly accessible, accept POST requests containing JSON, and acknowledge events with HTTP 200. It also requires signature validation through the `x-paystack-signature` HMAC-SHA512 header. The official Accept Payments documentation distinguishes the customer callback/redirect from the webhook used to confirm payment status. Sources: https://paystack.com/docs/payments/webhooks/ and https://paystack.com/docs/payments/accept-payments/.

The deployed Supabase Edge Function endpoint is publicly reachable, but Paystack’s dashboard validator is still rejecting the URL entered by the user. A Vercel HTTPS proxy route can provide a shorter first-party webhook URL while forwarding the raw request and signature to Supabase for verification, without moving or exposing the Paystack secret.
