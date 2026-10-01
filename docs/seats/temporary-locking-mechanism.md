# Temporary Seat Locking Mechanism

## Overview
To prevent overbooking without keeping state in the clients (web/mobile), we rely on a database-backed temporary locking mechanism.

## Mechanism Details

1. **`SeatHold` Table Design:**
   A temporary lock is represented as a row in the `SeatHold` table with the following columns:
   - `flight_instance_id`
   - `seat_id`
   - `booking_id`
   - `expires_at` (Timestamp)
   - `status` (Enum: `ACTIVE`, `EXPIRED`, `CONFIRMED`, `CANCELLED`)

2. **Atomicity and Concurrency:**
   We use the database to guarantee atomicity and prevent race conditions.
   - We enforce a **partial unique constraint** on `(flight_instance_id, seat_id)` where `status = 'ACTIVE'`.
   - If two competing transactions try to hold the same seat, one will succeed and the other will immediately fail with a constraint violation error, avoiding the need for in-memory distributed locks.

3. **Availability Rules:**
   A seat is considered **available** if and only if it does not have an active `SeatHold` that is still valid (current time < `expires_at`) AND it does not have an issued `Ticket`.

4. **Expiration (TTL):**
   - The lock has a configurable Time-To-Live (TTL), e.g., 10 minutes.
   - A background job periodically runs to mark expired holds (where `expires_at` < current time and `status = 'ACTIVE'`) as `EXPIRED`.
   - Importantly, the availability query checks the `expires_at` timestamp directly, so it does not depend on the background job running exactly on time. The job is primarily for cleanup.

5. **Multi-Seat Transactions (All-or-Nothing):**
   - A single booking can include up to 9 passengers.
   - The system locks all requested seats within a single database transaction. If any seat fails the unique constraint, the entire transaction rolls back, and no seats are held.

6. **Payment Confirmation:**
   When payment is confirmed, the system performs the following in a single transaction:
   - Verifies the `SeatHold` is still `ACTIVE` and hasn't expired.
   - Updates the `SeatHold` status to `CONFIRMED`.
   - Issues the final `Ticket`s.
