# Seat Model Review and Validation

## Review Session
- **Date:** 2026-10-01
- **Attendees:** Violeta Team Development Members
- **Goal:** Validate the ER model, concurrency scenarios, sequence diagrams, and temporary locking mechanism for seat booking.

## Discussion Points and Adjustments
1. **Separation of Flight and FlightInstance:** The team agreed that this separation is crucial to prevent duplicated route data and to keep the daily flight schedule distinct from the abstract flight routes.
2. **Locking Mechanism:**
   - Evaluated using an in-memory lock (like Redis) vs. database constraints.
   - Decided to stick with the database constraint (`(flight_instance_id, seat_id)` unique partial constraint) as it provides stronger guarantees and simplifies the architecture, considering that our database engine (PostgreSQL) handles this efficiently.
3. **Hold TTL:**
   - A 10-minute TTL was agreed upon as standard.
   - We must ensure that the client UI correctly reflects this countdown to the user.
4. **Edge Cases:**
   - Discussed the edge case where the payment takes longer than 10 minutes. Decided that a hard expiration is better to free up inventory. If the payment arrives after expiration, it will be automatically refunded, and the user will be notified.
   - For multi-seat bookings, the atomic all-or-nothing approach is validated. We will not offer "partial" success for seat holds, as families usually want to sit together or take another flight.

## Conclusion
The Seat and Concurrency model is approved for implementation.
