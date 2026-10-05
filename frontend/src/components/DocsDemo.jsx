import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  fontFamily: 'Inter, sans-serif'
});

const classDiagramCode = `
classDiagram
    class Flight {
        +String route
    }
    class FlightInstance {
        +Date departureDate
    }
    class CabinClass {
        +String name
    }
    class Seat {
        +String seatNumber
    }
    class Fare {
        +Money price
    }
    class Booking {
        +List~Passenger~ passengers
        +confirm()
    }
    class SeatHold {
        +DateTime expiresAt
        +Status status
    }
    class Ticket {
        +String ticketNumber
    }

    Flight "1" *-- "many" FlightInstance
    Flight "1" *-- "many" CabinClass
    CabinClass "1" *-- "many" Seat
    FlightInstance "1" *-- "many" SeatHold
    FlightInstance "1" *-- "many" Ticket
    Booking "1" *-- "many" SeatHold
    Booking "1" *-- "many" Ticket
    Seat "1" -- "0..1" SeatHold
    Seat "1" -- "0..1" Ticket
`;

const sequenceDiagramCode = `
sequenceDiagram
    actor Client
    participant API
    participant DB

    Client->>API: GET /flights/{id}/availability
    API->>DB: Query available seats
    DB-->>API: Available seats list
    API-->>Client: Available seats list

    Client->>API: POST /bookings (seat_ids)
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT SeatHold for each seat_id
    alt Constraint Violation
        DB-->>API: Error
        API->>DB: ROLLBACK
        API-->>Client: 409 Conflict
    else Success
        DB-->>API: Success
        API->>DB: COMMIT
        API-->>Client: 201 Created
    end
`;

export default function DocsDemo() {
  const classRef = useRef(null);
  const seqRef = useRef(null);

  useEffect(() => {
    mermaid.render('graphDiv1', classDiagramCode).then((result) => {
      if (classRef.current) classRef.current.innerHTML = result.svg;
    });
    mermaid.render('graphDiv2', sequenceDiagramCode).then((result) => {
      if (seqRef.current) seqRef.current.innerHTML = result.svg;
    });
  }, []);

  return (
    <div className="demo-container fade-in">
      <div className="card docs-card">
        <h2>Documentación de Arquitectura</h2>
        <p className="subtitle">Visualización de los diagramas del módulo de Asientos (US2)</p>
        
        <div className="diagram-section">
          <h3>Diagrama de Clases (Domain Model)</h3>
          <div className="mermaid-container" ref={classRef}></div>
        </div>

        <div className="diagram-section">
          <h3>Diagrama de Secuencia: Búsqueda y Bloqueo Temporal</h3>
          <div className="mermaid-container" ref={seqRef}></div>
        </div>
      </div>
    </div>
  );
}
