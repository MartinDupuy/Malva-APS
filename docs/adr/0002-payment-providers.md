# ADR 2: Payment Providers Selection

## Context
We need to process payments for flight bookings. The system requires a primary provider for normal operations and a fallback provider to ensure high availability in case the primary one is down. Criteria for selection include API documentation quality, SDK availability, sandbox environment, transaction fees, and local coverage.

## Evaluation
- **Provider A (Stripe):**
  - Excellent documentation and SDKs.
  - Good sandbox environment.
  - Global coverage with decent local options.
  - Fees are standard.
- **Provider B (MercadoPago):**
  - Strong local coverage (LatAm).
  - Adequate documentation and SDK.
  - Fees are competitive locally.
- **Provider C (PayPal):**
  - Good global coverage but higher fees.

## Decision
- **Primary Provider:** Stripe. We choose it for its robust API and excellent developer experience, which minimizes integration risks.
- **Fallback Provider:** MercadoPago. Chosen for its strong local presence to serve as a reliable backup when Stripe has issues.

## Consequences
- We need to implement two separate adapters implementing the same `PaymentGateway` port.
- We must handle idempotency keys carefully when switching between providers to avoid double charging the customer.
- The system must distinguish between business rejections (insufficient funds) and transient errors (network timeouts) to know when to trigger the fallback.
