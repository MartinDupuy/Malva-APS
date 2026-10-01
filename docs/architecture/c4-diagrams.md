# C4 Architecture Diagrams

## Context Diagram
- **Users:** Passengers (Web/Mobile app), Administrators.
- **System:** Flight Booking System.
- **External Systems:** Payment Gateway, Email Provider.

## Container Diagram
- **Web App / Mobile App:** Clients communicating via REST API.
- **Load Balancer:** Distributes traffic across instances.
- **API Application (Stateless):** Modular monolith handling domain logic (Flights, Search, Booking, Payments, Notifications). Deployed with horizontal autoscaling policy.
- **Cache (e.g., Redis):** Handles frequent read queries for flight availability (Search).
- **Asynchronous Message Queue:** Processes background tasks like sending emails and notifications.
- **Primary Database (Transactional, Relational):** Single source of truth.
- **Read Replicas:** Database replicas to serve read-heavy search operations.

## Deployment Diagram
- **Cloud Provider (e.g., AWS/GCP):**
  - **CDN:** For static assets.
  - **Load Balancer:** Entry point for API.
  - **Auto-scaling Group:** Contains Stateless API instances.
  - **Managed Database Service:** Primary DB with read replicas.
  - **Managed Cache Service:** For search caching.
  - **Managed Queue Service:** For async tasks.
