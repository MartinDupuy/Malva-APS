# Plan de Implementación – Emisión de Pasajes Electrónicos y Facturación

**Rama:** `us/emision-facturacion-pasajes`

**User Story:** Como pasajero, quiero recibir automáticamente por email mi pasaje electrónico y la factura correspondiente, de forma que tenga el comprobante de compra e información de mi vuelo de inmediato.

**Presupuesto total:** 12 horas

---

## Decisiones de diseño

### Arquitectura
Se sigue el patrón de puertos y adaptadores (hexagonal) establecido en el Sprint 0. Cada servicio nuevo expone un **puerto** (interfaz abstracta) y uno o más **adaptadores** que lo implementan. El caso de uso orquestador (`CheckoutService`) solo conoce puertos, nunca implementaciones concretas.

### Módulos nuevos y su ubicación

```
/services
  /checkout           ← Nuevo: orquestación del flujo de compra
    /domain
      CheckoutService.js          (caso de uso)
      CheckoutResult.js           (value object de resultado)
    /adapters
      (vacío por ahora, el checkout usa puertos inyectados)
  /ticketing          ← Nuevo: generación de pasaje electrónico PDF
    /domain
      Ticket.js                   (entidad)
      TicketGenerator.js          (puerto)
    /adapters
      PdfTicketGenerator.js       (adaptador)
  /billing            ← Nuevo: generación de factura PDF
    /domain
      Invoice.js                  (entidad)
      InvoiceGenerator.js         (puerto)
    /adapters
      PdfInvoiceGenerator.js      (adaptador)
  /notifications      ← Nuevo: envío de emails
    /domain
      EmailSender.js              (puerto)
      EmailMessage.js             (value object)
    /adapters
      SmtpEmailSender.js          (adaptador: Nodemailer o similar)
  /payments           ← Existente (Sprint 0)
/tests
  /checkout
  /ticketing
  /billing
  /notifications
```

### Dependencias entre módulos
- `CheckoutService` depende de: `PaymentGateway` (existente), `TicketGenerator`, `InvoiceGenerator`, `EmailSender`.
- Todas las dependencias se inyectan por constructor → facilita el testing con mocks/stubs.

### Principios aplicados
- **SRP:** Cada clase tiene una sola responsabilidad (generar PDF ≠ enviar email ≠ procesar pago).
- **OCP:** Nuevos formatos de ticket o factura → nuevo adaptador, sin tocar el caso de uso.
- **DIP:** El caso de uso depende de abstracciones (puertos), no de implementaciones concretas.
- **Value Objects inmutables:** `Ticket`, `Invoice`, `EmailMessage`, `CheckoutResult` usan `Object.freeze`.
- **Test:** Todos los test deben seguir el modelo establecido en el proyecto (mock de dependencias externas, tests de integración con mocks de servicios externos) y deben pasar para que el commit este terminado.
- **Commits:** Se debe seguir el formato establecido en el proyecto (feat(service): description). Al completarse un commit este debe marcarse como terminado. El commit no se realiza automaticamente, al estar finalizado se solicita autorizacion del usuario.
- **Documentation:** Al final de cada commit se debe documentar los cambios realizados en el archivo `docs/commits.md`.

---

## Commits

### Commit 1 — `feat(ticketing): add Ticket entity and TicketGenerator port` *(1 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/ticketing/domain/Ticket.js`: entidad inmutable que representa un pasaje electrónico. Campos: `ticketId`, `bookingId`, `passengerName`, `flightNumber`, `origin`, `destination`, `departureDate`, `departureTime`, `seatNumber`, `cabinClass`, `issuedAt`. Se construye validando que todos los campos requeridos estén presentes. `Object.freeze(this)` para inmutabilidad.
- Crear `services/ticketing/domain/TicketGenerator.js`: puerto (clase abstracta) con método `async generate(ticket) → Promise<Buffer>`. Lanza `Error('Method not implemented.')` como los puertos existentes del proyecto.

**Tests:** `tests/ticketing/Ticket.test.js`
- Crea un `Ticket` válido y verifica todos los campos.
- Falla si falta `passengerName`, `flightNumber` u otro campo requerido.
- Verifica inmutabilidad (asignación lanza `TypeError` en strict mode).
- Verifica que `issuedAt` se autogenera si no se provee.

---

### Commit 2 — `feat(billing): add Invoice entity and InvoiceGenerator port` *(1 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/billing/domain/Invoice.js`: entidad inmutable que representa una factura. Campos: `invoiceId`, `bookingId`, `customerName`, `customerEmail`, `items` (array de `{ description, quantity, unitPrice }`), `totalAmount` (value object `Money`), `issuedAt`, `currency`. Valida que `items` no esté vacío, que `totalAmount` sea consistente con la suma de ítems, y que todos los campos requeridos estén presentes. `Object.freeze(this)` (y deep freeze de `items`).
- Crear `services/billing/domain/InvoiceGenerator.js`: puerto con método `async generate(invoice) → Promise<Buffer>`. Lanza `Error('Method not implemented.')`.

**Tests:** `tests/billing/Invoice.test.js`
- Crea un `Invoice` válido y verifica campos.
- Falla si `items` está vacío.
- Falla si `customerEmail` tiene formato inválido.
- Verifica inmutabilidad.
- Verifica que `invoiceId` se autogenera (UUID) si no se provee.

---

### Commit 3 — `feat(notifications): add EmailMessage value object and EmailSender port` *(0.5 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/notifications/domain/EmailMessage.js`: value object inmutable. Campos: `to` (email destino), `subject`, `body` (texto plano o HTML), `attachments` (array de `{ filename, content }` donde `content` es un `Buffer`). Valida formato de email con regex básico, `subject` no vacío. `Object.freeze(this)`.
- Crear `services/notifications/domain/EmailSender.js`: puerto con método `async send(emailMessage) → Promise<{ success, messageId }>`. Lanza `Error('Method not implemented.')`.

**Tests:** `tests/notifications/EmailMessage.test.js`
- Crea un `EmailMessage` válido sin adjuntos y verifica campos.
- Crea uno con adjuntos y verifica que se almacenan.
- Falla si `to` tiene formato de email inválido.
- Falla si `subject` está vacío.
- Verifica inmutabilidad.

---

### Commit 4 — `feat(ticketing): implement PDF ticket generator adapter` *(1.5 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/ticketing/adapters/PdfTicketGenerator.js`: implementa `TicketGenerator`. Usa la librería `pdfkit` para generar un PDF con los datos del pasaje electrónico. Contenido del PDF: título "Pasaje Electrónico — Malva Airlines", datos del vuelo (número, origen → destino, fecha, hora, asiento, clase), nombre del pasajero, código de reserva, fecha de emisión. Retorna un `Buffer` con el contenido del PDF.
- Agregar `pdfkit` como dependencia en `package.json`.

**Tests:** `tests/ticketing/PdfTicketGenerator.test.js`
- Genera un PDF para un `Ticket` válido y verifica que retorna un `Buffer` no vacío.
- Verifica que el Buffer comienza con el magic number de PDF (`%PDF`).
- Genera PDF con datos en español (caracteres especiales: tildes, ñ) y verifica que no falla.

---

### Commit 5 — `feat(billing): implement PDF invoice generator adapter` *(1.5 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/billing/adapters/PdfInvoiceGenerator.js`: implementa `InvoiceGenerator`. Usa `pdfkit` para generar una factura PDF. Contenido: encabezado "Factura — Malva Airlines", datos del cliente, tabla de ítems (descripción, cantidad, precio unitario, subtotal), total, moneda, fecha de emisión, número de factura. Retorna un `Buffer`.

**Tests:** `tests/billing/PdfInvoiceGenerator.test.js`
- Genera un PDF de factura válida y verifica que retorna un `Buffer` no vacío.
- Verifica que el Buffer comienza con `%PDF`.
- Genera factura con múltiples ítems (ej: 3 pasajes Economy + 1 tasa de embarque) y verifica que no falla.

---

### Commit 6 — `feat(notifications): implement SMTP email sender adapter` *(1.5 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/notifications/adapters/SmtpEmailSender.js`: implementa `EmailSender`. Usa `nodemailer` con configuración por variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). El método `send()` construye el mensaje con los adjuntos y lo envía vía SMTP. Retorna `{ success: true, messageId }` en éxito. En error de red, lanza la excepción para que la capa superior pueda reintentar.
- Agregar `nodemailer` como dependencia.
- Agregar variables de ejemplo en `.env.example` (crear si no existe).

**Tests:** `tests/notifications/SmtpEmailSender.test.js`
- Usa un mock/stub de `nodemailer.createTransport` para verificar que `sendMail` se llama con los parámetros correctos (`to`, `subject`, `html`, `attachments`).
- Verifica que retorna `{ success: true, messageId }` cuando `sendMail` resuelve correctamente.
- Verifica que lanza una excepción cuando `sendMail` falla (simula error SMTP).
- Verifica que los adjuntos se mapean correctamente al formato de Nodemailer (`{ filename, content }`).

---

### Commit 7 — `feat(checkout): add CheckoutResult value object` *(0.5 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/checkout/domain/CheckoutResult.js`: value object inmutable que encapsula el resultado completo del checkout. Campos: `bookingId`, `paymentResult` (el `PaymentResult` existente), `ticketPdf` (Buffer o null), `invoicePdf` (Buffer o null), `emailSent` (boolean), `emailError` (string o null). Factory methods estáticos:
  - `CheckoutResult.success(bookingId, paymentResult, ticketPdf, invoicePdf)` → email pendiente.
  - `CheckoutResult.paymentFailed(bookingId, paymentResult)` → sin PDFs ni email.
  - `CheckoutResult.withEmailResult(checkoutResult, emailSent, emailError)` → copia con resultado de email.

**Tests:** `tests/checkout/CheckoutResult.test.js`
- Crea un resultado exitoso y verifica todos los campos.
- Crea un resultado con pago fallido y verifica que `ticketPdf` y `invoicePdf` son null.
- Verifica inmutabilidad.
- Verifica que `withEmailResult` crea una nueva instancia sin mutar la original.

---

### Commit 8 — `feat(checkout): implement CheckoutService use case` *(2.5 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/checkout/domain/CheckoutService.js`: caso de uso orquestador. Recibe por constructor: `paymentGateway` (puerto existente), `ticketGenerator` (puerto), `invoiceGenerator` (puerto), `emailSender` (puerto).
- Método `async processCheckout(checkoutRequest) → CheckoutResult`:
  1. **Procesar pago:** llama a `paymentGateway.processPayment(paymentRequest)`. Si el pago no es `APPROVED`, retorna `CheckoutResult.paymentFailed(...)` inmediatamente.
  2. **Generar pasaje PDF:** construye un `Ticket` con los datos del vuelo y llama a `ticketGenerator.generate(ticket)`.
  3. **Generar factura PDF:** construye un `Invoice` con los datos de la compra y llama a `invoiceGenerator.generate(invoice)`.
  4. **Enviar email:** construye un `EmailMessage` con subject "Tu pasaje electrónico — Malva Airlines", cuerpo HTML con resumen de la compra, y adjunta los dos PDFs. Llama a `emailSender.send(emailMessage)`.
  5. **Si el email falla:** no revierte el pago (el pago ya se procesó con éxito). Registra el error en el resultado para que una capa superior pueda reintentar el envío o notificar al usuario por otro canal.
  6. Retorna `CheckoutResult.success(...)` con el resultado del email.

- Crear `services/checkout/domain/CheckoutRequest.js`: value object con los datos necesarios para el checkout: `bookingId`, `passengerName`, `passengerEmail`, `flightNumber`, `origin`, `destination`, `departureDate`, `departureTime`, `seatNumber`, `cabinClass`, `amount` (Money), `creditCardToken`. Validaciones completas. `Object.freeze(this)`.

**Tests:** `tests/checkout/CheckoutService.test.js`
- **Pago exitoso, email exitoso:** mock de todos los puertos resolviendo correctamente. Verifica que el resultado es `success`, que `paymentResult.isApproved()` es true, que `ticketPdf` y `invoicePdf` son Buffers no nulos, y que `emailSent` es true.
- **Pago rechazado:** mock del gateway retornando `REJECTED`. Verifica que el resultado es `paymentFailed`, que no se llaman `ticketGenerator`, `invoiceGenerator` ni `emailSender`.
- **Pago exitoso, email falla:** mock del gateway aprobando, generadores de PDF resolviendo, pero `emailSender.send()` lanzando error. Verifica que el pago NO se revierte, que `emailSent` es false, y que `emailError` contiene el mensaje de error.
- **Pago con error transitorio:** mock del gateway retornando `TRANSIENT_ERROR`. Verifica que se propaga correctamente (el `ResilientPaymentGateway` manejaría los reintentos antes de llegar aquí, pero `CheckoutService` debe manejar el caso donde aún así llega un error transitorio).
- **Validación de entrada:** `CheckoutRequest` sin email lanza error, sin `bookingId` lanza error, etc.

---

### Commit 9 — `feat(checkout): add seat release on payment failure` *(1 h)*

**Qué se hace:**
- Crear `services/checkout/domain/SeatReleaser.js`: puerto con método `async releaseSeats(bookingId) → Promise<void>`. Lanza `Error('Method not implemented.')`. Este puerto será implementado en la US de reservas (US5) cuando se tenga la base de datos; por ahora se define el contrato.
- Modificar `CheckoutService` para recibir opcionalmente un `SeatReleaser` por constructor. Si el pago es `REJECTED`, y existe un `SeatReleaser`, se invoca `seatReleaser.releaseSeats(bookingId)` para liberar los asientos bloqueados. Si no se inyectó (porque el módulo de seats aún no está implementado), se omite este paso sin fallar.
- Si la liberación falla, se registra el error pero no se lanza excepción (los asientos expirarán por TTL como mecanismo de seguridad, según `docs/seats/temporary-locking-mechanism.md`).

**Tests:** `tests/checkout/CheckoutService.seatRelease.test.js`
- **Pago rechazado con SeatReleaser inyectado:** verifica que se llama a `releaseSeats(bookingId)`.
- **Pago rechazado sin SeatReleaser:** verifica que no falla y retorna normalmente.
- **Pago rechazado, liberación falla:** verifica que el error se captura, no se propaga, y el resultado del checkout sigue siendo `paymentFailed` (sin excepción).
- **Pago exitoso:** verifica que NO se llama a `releaseSeats`.

---

### Commit 10 — `test(checkout): add integration test for full checkout flow` *(1 h)*

**Qué se hace:**
- Crear `tests/checkout/CheckoutIntegration.test.js`: test de integración que usa las implementaciones reales de `PdfTicketGenerator` y `PdfInvoiceGenerator` (no mocks), y mocks solo para `PaymentGateway` y `EmailSender` (porque dependen de servicios externos).
- Verificar el flujo completo end-to-end:
  1. El pago se aprueba (mock del gateway).
  2. Se generan los PDFs reales (con `pdfkit`) y se verifica que son Buffers válidos que comienzan con `%PDF`.
  3. Se llama al `EmailSender` mock con los dos PDFs adjuntos.
  4. El resultado final es exitoso con todos los campos correctos.
- Caso negativo: pago rechazado → no se generan PDFs, no se envía email, se liberan asientos.
- Documentar en `docs/ticketing/checkout-flow.md` un diagrama de secuencia del flujo completo.

---

## Resumen de archivos por commit

| # | Estado | Commit | Archivos nuevos / modificados | Tests |
|---|---|---|---|---|
| 1 | ✅ Completado | `feat(ticketing): add Ticket entity and TicketGenerator port` | `services/ticketing/domain/Ticket.js`, `services/ticketing/domain/TicketGenerator.js` | `tests/ticketing/Ticket.test.js` |
| 2 | ✅ Completado | `feat(billing): add Invoice entity and InvoiceGenerator port` | `services/billing/domain/Invoice.js`, `services/billing/domain/InvoiceGenerator.js` | `tests/billing/Invoice.test.js` |
| 3 | ✅ Completado | `feat(notifications): add EmailMessage value object and EmailSender port` | `services/notifications/domain/EmailMessage.js`, `services/notifications/domain/EmailSender.js` | `tests/notifications/EmailMessage.test.js` |
| 4 | ✅ Completado | `feat(ticketing): implement PDF ticket generator adapter` | `services/ticketing/adapters/PdfTicketGenerator.js`, `package.json` (+pdfkit) | `tests/ticketing/PdfTicketGenerator.test.js` |
| 5 | ✅ Completado | `feat(billing): implement PDF invoice generator adapter` | `services/billing/adapters/PdfInvoiceGenerator.js` | `tests/billing/PdfInvoiceGenerator.test.js` |
| 6 | ✅ Completado | `feat(notifications): implement SMTP email sender adapter` | `services/notifications/adapters/SmtpEmailSender.js`, `package.json` (+nodemailer), `.env.example` | `tests/notifications/SmtpEmailSender.test.js` |
| 7 | ✅ Completado | `feat(checkout): add CheckoutResult value object` | `services/checkout/domain/CheckoutResult.js` | `tests/checkout/CheckoutResult.test.js` |
| 8 | ✅ Completado | `feat(checkout): implement CheckoutService use case` | `services/checkout/domain/CheckoutService.js`, `services/checkout/domain/CheckoutRequest.js` | `tests/checkout/CheckoutService.test.js` |
| 9 | ⏳ Pendiente | `feat(checkout): add seat release on payment failure` | `services/checkout/domain/SeatReleaser.js`, `services/checkout/domain/CheckoutService.js` (mod) | `tests/checkout/CheckoutService.seatRelease.test.js` |
| 10 | ⏳ Pendiente | `test(checkout): add integration test for full checkout flow` | `docs/ticketing/checkout-flow.md` | `tests/checkout/CheckoutIntegration.test.js` |

---

## Distribución horaria por tarea del enunciado

| Tarea del enunciado | Commits | Horas |
|---|---|---|
| Conectar flujo de checkout con API de pagos (Sprint 0) | 7, 8 | 3 h |
| Confirmación de orden y liberación automática de asientos | 8, 9 | 3 h |
| Servicio de envío de emails con pasaje PDF y factura | 1, 2, 3, 4, 5, 6, 10 | 6 h |
| **Total** | | **12 h** |

---

## Verificación de criterios de aceptación

| Criterio | Verificado en |
|---|---|
| El pago se completa mediante la pasarela integrada | Commit 8: `CheckoutService` invoca `ResilientPaymentGateway.processPayment()` que ya implementa reintentos, circuit breaker y fallback (Sprint 0). Tests unitarios y de integración (commit 10) verifican pago exitoso, rechazado y con error transitorio. |
| El cliente recibe en su correo el pasaje digital y la factura | Commits 4-6: generan los PDFs y envían por email. Commit 8: el orquestador conecta todo el flujo. Commit 10: test de integración verifica que el email se envía con ambos adjuntos PDF. |

---

## Dependencias externas nuevas

| Paquete | Propósito | Justificación |
|---|---|---|
| `pdfkit` | Generación de PDFs | Librería madura, sin dependencias nativas, genera PDFs programáticamente sin templates HTML. |
| `nodemailer` | Envío de emails SMTP | Estándar de facto para email en Node.js. Soporta adjuntos, HTML, y múltiples transportes. |
