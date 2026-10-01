# Critical Concurrency Scenarios in Seat Booking

## 1. Concurrent Buyers for the Same Seat
- **Scenario:** Buyer A (Web) and Buyer B (Mobile) attempt to hold the exact same seat on the same flight instance simultaneously.
- **Handling:** The database must enforce a partial unique constraint on `(flight_instance_id, seat_id)` for active holds. Only one transaction will succeed; the other will fail immediately, and the client will be notified that the seat is no longer available.

## 2. Hold Expiration During Payment
- **Scenario:** A buyer enters the payment gateway, but the checkout process takes longer than the seat hold TTL (e.g., 10 minutes).
- **Handling:** Before confirming the payment and issuing the ticket, the system must verify that the hold is still active. If it has expired, the payment might be rejected before processing, or if already processed, it will trigger an automatic refund/credit, notifying the user.

## 3. Failed Payment
- **Scenario:** The seat is held, but the payment is rejected by the gateway.
- **Handling:** The hold is not automatically released immediately (unless explicitly cancelled by the user), it will expire naturally via the TTL mechanism. This allows the user to try another payment method before the TTL expires.

## 4. Multi-Passenger Booking with Partially Taken Seats
- **Scenario:** A user tries to book 4 seats. Between the time they searched and the time they attempt to hold, one of the seats was taken by someone else.
- **Handling:** The hold process is atomic (all or nothing) for the entire booking. If any of the requested seats are taken, the entire transaction fails.
