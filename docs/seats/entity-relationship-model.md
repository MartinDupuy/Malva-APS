# Entity-Relationship Model: Seats and Concurrency

## Entities and Descriptions

- **`Flight` (Definition/Route):** Represents the scheduled flight route (e.g., MAL-123 from BUE to MAD). Does not hold specific dates, only the general definition and schedule.
- **`FlightInstance` (Occurrence):** Represents a specific occurrence of a `Flight` on a concrete date (e.g., MAL-123 on 2026-10-15). Separating this avoids duplicating flight route data.
- **`CabinClass`:** E.g., Economy, Business. Associated with a `Flight` to define available sections.
- **`Seat`:** Represents a specific physical seat on a `Flight` (e.g., 12A). Associated with a `CabinClass`.
- **`Fare`:** Pricing rules and cost for a `CabinClass` on a given `FlightInstance` or `Flight`.
- **`Booking`:** Represents a customer's reservation for one or more seats on a `FlightInstance`.
- **`Ticket`:** The confirmed and paid ticket for a specific `Passenger` on a `Seat`.
- **`SeatHold`:** Represents a temporary lock on a `Seat` for a specific `FlightInstance` during the booking process. Contains `expires_at` and is uniquely constrained by `(flight_instance_id, seat_id)`.

## Relationships
- A **`Flight`** has many **`FlightInstance`s**.
- A **`Flight`** has many **`CabinClass`es**.
- A **`CabinClass`** has many **`Seat`s**.
- A **`FlightInstance`** has many **`Booking`s**, **`SeatHold`s**, and **`Ticket`s**.
- A **`Booking`** has many **`SeatHold`s** and **`Ticket`s**.
- A **`Seat`** can have zero or one active **`SeatHold`** per **`FlightInstance`**.
- A **`Seat`** can have zero or one active **`Ticket`** per **`FlightInstance`**.
