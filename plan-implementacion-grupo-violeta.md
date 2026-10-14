# Plan de implementación – Sistema de vuelos (Grupo Violeta)

El Sprint 0 contiene las historias 1, 2 y 3, por lo que se detallan a nivel de commits y pasos. Las historias 4 a 10 quedan planificadas a nivel de commits como hoja de ruta de los siguientes sprints.

---

## 0. Reglas transversales

### Flujo de trabajo

- Una rama por historia: `feature/us-N-descripcion`, integrada por Pull Request con revisión de al menos un compañero.
- Commits atómicos con Conventional Commits (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `perf`). Cada commit deja el repositorio compilando y con tests en verde.
- Definition of Done: tests pasando, sin warnings del linter, criterios de aceptación verificados, documentación actualizada.

### Clean code

- Código autoexplicativo: nombres que revelan intención, sin comentarios que expliquen el "qué".
- Funciones pequeñas con una sola responsabilidad (SRP). Dependencias hacia abstracciones (puertos y adaptadores).

| Code smell | Cómo se evita en este proyecto |
|---|---|
| Primitive Obsession | Value objects: `Money`, `SeatNumber`, `FlightNumber`, `PassengerCount` |
| Magic numbers | Constantes con nombre y configuración externa (`MAX_PASSENGERS_PER_BOOKING = 9`, TTL del bloqueo) |
| God class / Long method | Casos de uso separados, un archivo por responsabilidad |
| Feature envy / Anemic model | Reglas dentro de las entidades (`Seat.hold()`, `Booking.confirm()`) |
| Shotgun surgery | Un único lugar para cada regla de negocio |
| Duplicación | Extraer solo cuando hay tres repeticiones reales |
| Secretos en el repo | Credenciales por variables de entorno, `.env.example` versionado |

### Estructura propuesta del repositorio

```
/docs
  /adr
  /architecture
  /standards
  /payments
/infra
/services
  /payments
/tests
```

---

## US1 – Arquitectura e infraestructura inicial (27 h) ✅

**Rama:** `feature/us-1-arquitectura-base`

| # | Commit | Pasos | Horas |
|---|---|---|---|
| 1 | `docs(architecture): define non-functional requirements and peak load estimates` | Estimar usuarios concurrentes en temporada alta, requests/seg pico y relación lectura/escritura (búsqueda vs compra). Fijar SLOs de disponibilidad y latencia. Documentar en `docs/architecture/requirements.md`. | 4 |
| 2 | `docs(architecture): add C4 diagrams with load balancing and autoscaling` | Diagramas de contexto, contenedores y despliegue. Servicios stateless detrás de un balanceador, política de autoescalado horizontal, caché para búsquedas, cola para tareas asíncronas (emails, notificaciones), base de datos transaccional única con réplicas de lectura. | 10 |
| 3 | `chore(repo): initialize repository structure and tooling` | Estructura de carpetas, `.gitignore`, `.editorconfig`, `CODEOWNERS`, plantilla de PR, protección de rama principal. | 2 |
| 4 | `ci: add pipeline with lint and test stages` | Pipeline mínimo (lint y tests). Documentar el arranque del entorno local en el README. | 2 |
| 5 | `docs(adr): record initial architecture decisions` | ADRs breves: monolito modular vs microservicios, motor de base de datos, estrategia de caché, proveedor cloud. Cada uno con contexto, decisión y consecuencias. | 2 |
| 6 | `docs(standards): add coding standards` | Convenciones de nombres, tamaño máximo de funciones, política de tests, tabla de code smells, convención de commits. | 2 |
| 7 | `docs(architecture): record team validation of architecture` | Sesión de revisión con el equipo, acta con observaciones y ajustes resultantes. | 5 |

**Verificación de criterios de aceptación**

- Alta disponibilidad y picos de tráfico: commit 2.
- Entornos y repositorio centralizado operativos: commits 3 y 4.

> **Recomendación:** partir de un monolito modular stateless con límites claros entre módulos (vuelos, reservas, pagos, notificaciones). Escala horizontalmente igual y evita el costo operativo de microservicios en un equipo pequeño. Decisión a validar en el ADR.

---

## US2 – Modelo de datos de asientos y concurrencia (20 h) ✅

**Rama:** `feature/us-2-modelo-asientos`

**Decisión central:** la fuente única de verdad es el backend. Web y app móvil son solo clientes de la misma API, así ninguna mantiene estado de disponibilidad propio.

| # | Commit | Pasos | Horas |
|---|---|---|---|
| 1 ✅ | `docs(seats): document critical concurrency scenarios` | Casos: dos compradores (web y app) sobre el mismo asiento, expiración del bloqueo en pleno pago, pago fallido, compra de varios pasajes con un asiento ya tomado. | 2 |
| 2 ✅ | `docs(seats): add entity-relationship model` | Entidades: `Flight` (definición/ruta), `FlightInstance` (salida en una fecha concreta), `CabinClass`, `Seat`, `Fare`, `Booking`, `Ticket`, `SeatHold`. Separar el vuelo programado de su ocurrencia por fecha evita duplicar datos. | 3 |
| 3 ✅ | `docs(seats): design temporary seat locking mechanism` | Ver detalle abajo. | 4 |
| 4 ✅ | `docs(seats): add sequence and class diagrams` | Secuencias: búsqueda de disponibilidad, bloqueo, confirmación de pago, expiración. Clases del dominio de asientos. | 5 |
| 5 ✅ | `docs(seats): record model review with development team` | Acta de revisión y ajustes. | 6 |
| 6 ✅ *(opcional)* | `test(seats): prove no overbooking under concurrent hold attempts` | Prototipo descartable: N hilos intentan bloquear el mismo asiento y exactamente uno lo logra. Valida el diseño antes de implementarlo. | — |

### Mecanismo de bloqueo temporal (contenido del commit 3)

- El bloqueo es una fila en `SeatHold` con `flight_instance_id`, `seat_id`, `booking_id`, `expires_at` y `status`.
- Atomicidad garantizada por la base de datos: restricción única parcial sobre `(flight_instance_id, seat_id)` para holds activos. Si dos transacciones compiten, una falla por la restricción, sin depender de locks en memoria.
- Un asiento está disponible si no tiene hold activo vigente ni ticket emitido.
- TTL configurable (por ejemplo 10 minutos) y un job que marca los holds vencidos como expirados. La consulta de disponibilidad también ignora los vencidos, por lo que no depende de que el job corra a tiempo.
- La compra de hasta 9 pasajes es todo o nada: se bloquean todos los asientos en una transacción; si uno falla, se revierte el resto.
- La confirmación de pago convierte el hold en ticket dentro de una transacción, verificando que el hold siga vigente.

**Verificación de criterios de aceptación**

- Fuente única de datos para web y app: commits 2 y 3.
- Prevención de overbooking por compras concurrentes: commits 3 y 6.

---

## US3 – Proveedor de pagos y contingencia (15 h) ✅

**Rama:** `feature/us-3-integracion-pagos`

Es la única historia del sprint con código. Diseño: puerto `PaymentGateway`, un adaptador por proveedor y un decorador que aplica reintentos y contingencia. El resto del sistema solo conoce el puerto.

| # | Commit | Pasos |
|---|---|---|
| 1 ✅ | `docs(payments): evaluate providers and select primary and fallback` | Comparar proveedores (documentación, SDK, sandbox, comisiones, cobertura local). Registrar la decisión en un ADR. *(5 h)* |
| 2 ✅ | `feat(payments): add Money value object` | Monto y moneda inmutables, validaciones (no negativo), sin `Double` para dinero. Tests unitarios. |
| 3 ✅ | `feat(payments): define PaymentGateway port and result types` | Interfaz `PaymentGateway`, `PaymentRequest`, resultado cerrado (aprobado / rechazado / error transitorio). Los errores transitorios y los rechazos de negocio se distinguen desde el tipo, porque solo los primeros se reintentan. |
| 4 ✅ | `feat(payments): implement primary provider adapter` | Adaptador contra el sandbox del proveedor principal. Traduce respuestas del proveedor a los tipos del dominio. Credenciales por entorno. |
| 5 ✅ | `test(payments): add simulated charge tests for primary adapter` | Cobros simulados exitosos, rechazados y con error de red. *(2 h)* |
| 6 ✅ | `feat(payments): implement fallback provider adapter` | Segundo adaptador con el mismo contrato. |
| 7 ✅ | `feat(payments): add retry policy with backoff` | `RetryPolicy` aislada y configurable (intentos, espera), aplicada solo a errores transitorios. |
| 8 ✅ | `feat(payments): add idempotency key to payment requests` | Clave de idempotencia por intento de compra para no cobrar dos veces al reintentar o cambiar de proveedor. |
| 9 ✅ | `feat(payments): add failover decorator with circuit breaker` | `ResilientPaymentGateway`: intenta el principal con reintentos; si el circuito se abre o se agotan los intentos, pasa al de contingencia. *(4 h junto con los commits 7 y 8)* |
| 10 ✅ | `test(payments): cover failover and retry scenarios` | Caída del principal, recuperación, doble fallo, idempotencia. |
| 11 ✅ | `docs(payments): add payment module specification and contingency plan` | Contrato del módulo, flujo de errores, runbook de caída del proveedor. *(4 h)* |

**Verificación de criterios de aceptación**

- Pagos simulados procesados con éxito: commit 5.
- Contingencia documentada ante caída del proveedor principal: commit 11.

---

## Historias 4 a 10 (hoja de ruta)

**Orden sugerido:** US6, US4, US5, US7, US9, US8, US10. Primero hay que poder cargar vuelos para después buscarlos y comprarlos. Las notificaciones (US7 y US9) comparten infraestructura de email.

### US6 – Administración de vuelos y rutas

1. `feat(flights): add Flight and Route domain model with validations`
2. `feat(flights): add capacity per cabin class and seat generation`
3. `feat(flights): add operating days and flight instance generation`
4. `feat(flights): add create, update and cancel use cases`
5. `feat(flights): expose admin API with role-based authorization`
6. `test(flights): cover cancellation and schedule change rules`

### US4 – Búsqueda de vuelos

1. `feat(search): add search criteria value objects`
2. `feat(search): add availability query by origin, destination, date and passengers`
3. `perf(search): add indexes and caching for search`
4. `feat(search): expose search endpoint`
5. `test(search): cover empty results and invalid criteria`

### US5 – Reserva y compra de pasajes

1. `feat(booking): add Booking aggregate with 9-passenger limit`
2. `feat(booking): implement seat hold use case`
3. `feat(booking): implement hold expiration job`
4. `feat(booking): implement purchase confirmation using PaymentGateway`
5. `test(booking): add concurrency tests for simultaneous purchases`
6. `feat(booking): expose booking endpoints`

### US7 – Pasaje electrónico y facturación

1. `feat(ticketing): generate electronic ticket document`
2. `feat(billing): generate invoice document`
3. `feat(notifications): add email port and adapter`
4. `feat(ticketing): send ticket and invoice on purchase confirmation`
5. `test(ticketing): cover email failure with retry`

### US9 – Notificaciones por cambios de vuelo

1. `feat(notifications): publish domain event on schedule change or cancellation`
2. `feat(notifications): notify affected passengers by email`
3. `test(notifications): cover multiple bookings per flight`

### US8 – Reportes de ocupación

1. `feat(reports): add occupancy query by flight, class and date`
2. `feat(reports): expose report endpoint with filters`
3. `test(reports): cover empty ranges and partial occupancy`

### US10 – App móvil

1. `chore(mobile): initialize app project and API client`
2. `feat(mobile): add flight search screen`
3. `feat(mobile): add seat selection and purchase flow`
4. `feat(mobile): add ticket download and viewing`
5. `test(mobile): cover main purchase flow`
