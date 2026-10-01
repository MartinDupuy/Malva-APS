# Architecture Validation and Review

## Session Details
- **Date:** 2026-10-01
- **Attendees:** Violeta Team
- **Goal:** Validate the initial architecture proposal, including ADRs, SLOs, and C4 diagrams.

## Observations
1. **Modular Monolith:** The team agrees with the modular monolith approach, as it matches our current scale and reduces operational overhead. Strict enforcement of domain boundaries (Flights, Booking, Payments, Notifications) is required.
2. **Database:** PostgreSQL is confirmed as the primary database due to its robust transaction handling.
3. **Caching:** Using Redis for search caching is approved. We must ensure that cache invalidation works correctly when flight details or seat availabilities change.
4. **Asynchronous Tasks:** A message queue (e.g., RabbitMQ or SQS) is necessary for sending emails and processing async notifications so that the main API is not blocked.

## Resulting Adjustments
- Explicitly documented that Web and Mobile apps are just clients (no state regarding seat availability will be kept on the clients).
- We will add a temporary seat locking mechanism (with TTL) in the database to prevent overbooking, rather than using in-memory locks.
- A fallback payment gateway will be implemented to increase resilience in case the primary provider fails.

## Conclusion
The architecture is approved and ready for implementation.
