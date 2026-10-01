# Architecture Decision Records (ADR)

## ADR 1: Modular Monolith vs Microservices
- **Context:** The system needs to support multiple domains (flights, booking, payments, notifications). The team is small and the operational overhead of microservices is high.
- **Decision:** We will use a modular monolith architecture.
- **Consequences:** Easier to deploy and test initially. Strong enforcement of module boundaries is required to avoid a big ball of mud and to allow future extraction into microservices if needed.

## ADR 2: Database Engine
- **Context:** The system requires strong transactional guarantees (ACID) for bookings and seat holds.
- **Decision:** We will use a relational database (e.g., PostgreSQL).
- **Consequences:** Strong consistency and integrity for financial and booking transactions. Scalability for reads will be handled via read replicas.

## ADR 3: Caching Strategy
- **Context:** Flight search operations will be read-heavy and require low latency (< 200ms).
- **Decision:** We will use an in-memory data store (e.g., Redis) for caching search results and availability.
- **Consequences:** Reduces load on the primary database. Cache invalidation strategies must be carefully implemented when flight schedules or availability change.

## ADR 4: Cloud Provider
- **Context:** We need a scalable, managed infrastructure to meet our SLOs with low operational overhead.
- **Decision:** We will use a major cloud provider (e.g., AWS/GCP) using managed services (managed DB, managed Cache, Load Balancers, and Auto-scaling groups).
- **Consequences:** Vendor lock-in for some managed services, but significantly reduces DevOps effort and provides high availability out of the box.
