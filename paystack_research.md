# Paystack test integration research

## Official sources

- [Paystack Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack Accept Payments](https://paystack.com/docs/payments/accept-payments/)

## Verified requirements

Paystack sends webhook events as JSON and includes an `x-paystack-signature` header. The signature is an HMAC-SHA512 digest of the raw event payload using the Paystack secret key. The server must validate the signature before processing the event and return HTTP 200 to acknowledge receipt.

Paystack recommends initializing transactions from the backend. The frontend receives the resulting access code or authorization URL and completes payment through Paystack. The payment must then be verified using the webhook or the transaction verification endpoint. A successful payment should be accepted only after checking the transaction status and confirming that the verified amount matches the expected amount.

For redirect checkout, Paystack returns the customer to the configured callback URL. The application should read the transaction reference from the callback URL and call the backend verification endpoint; the callback itself is not trusted as proof of payment.

The relevant successful event is `charge.success`. Refund and failed/abandoned events should be represented separately so the admin revenue total can be calculated from verified successful payments less verified refunds.
