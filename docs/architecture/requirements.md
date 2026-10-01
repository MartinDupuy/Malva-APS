# Non-functional Requirements and Peak Load Estimates

## Peak Load Estimates
- **Concurrent Users (Season Peak):** 50,000
- **Peak Requests per Second:** 2,000 req/sec
- **Read/Write Ratio:** 95% Reads (Flight Search) / 5% Writes (Booking and Payments)

## Service Level Objectives (SLOs)
- **Availability:** 99.9% uptime (approx. 43 minutes allowed downtime per month)
- **Latency:**
  - Search (Reads): 95th percentile (P95) < 200ms
  - Booking/Payments (Writes): 95th percentile (P95) < 1000ms
