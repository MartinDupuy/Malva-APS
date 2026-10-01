# Payment Module Specification and Contingency Plan

## 1. Module Contract (PaymentGateway Port)
The core of the payment module is the `PaymentGateway` interface, which defines a single robust method:
- `processPayment(PaymentRequest) -> Promise<PaymentResult>`

### Inputs (`PaymentRequest`)
- `amount`: A `Money` object ensuring immutable, accurate currency arithmetic.
- `creditCardToken`: Provided by the frontend (not raw card numbers).
- `bookingId`: Internal identifier.
- `idempotencyKey`: Unique per attempt to prevent double charges across retries and failovers.

### Outputs (`PaymentResult`)
- **APPROVED**: Successfully processed.
- **REJECTED**: Business rejection (e.g., insufficient funds, fraud). Should be shown to the user to fix.
- **TRANSIENT_ERROR**: Technical failure (e.g., network timeout, API 500 error). Should be retried automatically.

## 2. Error Flow and Retries
1. The `ResilientPaymentGateway` decorator wraps the primary provider (Stripe).
2. It executes the charge through a `RetryPolicy` with exponential backoff (e.g., 3 attempts).
3. If an error is `REJECTED`, no retries are performed, and the rejection is returned immediately.
4. If an error is `TRANSIENT_ERROR`, it waits and retries.
5. If retries are exhausted and it's still a transient error, the circuit breaker counter increments.

## 3. Contingency Plan and Runbook

### Circuit Breaker & Automatic Failover
If the primary provider fails consecutively N times (e.g., 5 times) within a short window, the circuit breaker opens. All subsequent requests immediately route to the fallback provider (MercadoPago) without waiting for the primary provider to timeout.

### Manual Intervention (Runbook)
If the primary provider suffers a prolonged outage:
1. **Monitor Alerts:** The DevOps team will receive an alert about high error rates from Stripe.
2. **Verify Circuit:** The logs will show "Failing over to fallback gateway".
3. **Check Idempotency:** Ensure the same `idempotencyKey` was sent to MercadoPago.
4. **Recovery:** The circuit breaker has a reset timeout (e.g., 1 minute). It will periodically allow a single request to try the primary provider (half-open). Once that request succeeds, the circuit closes and traffic returns to normal. No manual restart is required.
