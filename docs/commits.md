# Registro de Commits

Historial de commits realizados durante la implementación de User Stories.

## US: Emisión de Pasajes Electrónicos y Facturación

### Commit 1: `feat(ticketing): add Ticket entity and TicketGenerator port`
- **Hash:** `212d3b0`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/ticketing/domain/Ticket.js`: Entidad inmutable que representa un pasaje electrónico con validación de campos requeridos (`bookingId`, `passengerName`, `flightNumber`, `origin`, `destination`, `departureDate`, `departureTime`, `seatNumber`, `cabinClass`) y autogeneración de `ticketId` e `issuedAt`.
  - `services/ticketing/domain/TicketGenerator.js`: Puerto hexagonal (clase abstracta) con método `async generate(ticket)` que lanza `Method not implemented.`.
  - `tests/ticketing/Ticket.test.js`: Suite de pruebas unitarias que cubren creación, autogeneración, validación de campos ausentes, inmutabilidad y contrato del puerto.
- **Resultado de tests:** Exitoso (31 tests pasando).

### Commit 2: `feat(billing): add Invoice entity and InvoiceGenerator port`
- **Hash:** `27acea9`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/billing/domain/Invoice.js`: Entidad inmutable que representa una factura electrónica. Incluye validaciones completas de campos requeridos (`bookingId`, `customerName`), formato de `customerEmail`, array `items` no vacío, consistencia matemática entre `totalAmount` (value object `Money`) y la sumatoria de ítems (con `unitPrice` como `Money` o entero), autogeneración de `invoiceId` (UUID) e `issuedAt`, y deep freeze tanto de la instancia como del array `items` y sus objetos internos.
  - `services/billing/domain/InvoiceGenerator.js`: Puerto hexagonal (clase abstracta) con método `async generate(invoice)` que lanza `Method not implemented.`.
  - `tests/billing/Invoice.test.js`: Suite de pruebas unitarias cubriendo creación válida, autogeneración de ID y fecha, soporte de Money y posicionales, validación de email y campos vacíos, consistencia de montos, inmutabilidad profunda y contrato del puerto.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 1 y 2 como completados.
- **Resultado de tests:** Exitoso (46 tests pasando).
