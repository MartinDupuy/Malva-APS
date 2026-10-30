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

### Commit 3: `feat(notifications): add EmailMessage value object and EmailSender port`
- **Hash:** `711f93d`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/notifications/domain/EmailMessage.js`: Value object inmutable que representa un mensaje de correo electrónico con validación de destinatario (`to`), asunto no vacío (`subject`), cuerpo de mensaje (`body`), y array de adjuntos (`attachments`) con validación de nombre de archivo y contenido en `Buffer`. Aplica inmutabilidad profunda (`Object.freeze` a la instancia, al array y a cada adjunto).
  - `services/notifications/domain/EmailSender.js`: Puerto hexagonal (clase abstracta) con método `async send(emailMessage)` que lanza `Method not implemented.`.
  - `tests/notifications/EmailMessage.test.js`: Suite de pruebas unitarias que cubren creación con y sin adjuntos, soporte de parámetros posicionales, validación de emails y campos requeridos, validación de buffers en adjuntos, inmutabilidad profunda y contrato del puerto.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 3 como completado.
- **Resultado de tests:** Exitoso (57 tests pasando en 6 suites).

### Commit 4: `feat(ticketing): implement PDF ticket generator adapter`
- **Hash:** `2543c3e`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `package.json`: Agregada dependencia `pdfkit` (^0.20.2).
  - `services/ticketing/adapters/PdfTicketGenerator.js`: Adaptador que implementa el puerto `TicketGenerator`. Utiliza la biblioteca `pdfkit` para generar un documento PDF en memoria y retornarlo como `Buffer`. Incluye encabezado con título "Pasaje Electrónico — Malva Airlines", sección de información de la reserva (`bookingId`, `ticketId`, `passengerName`, `issuedAt`) y sección de detalles del vuelo (`flightNumber`, `origin` → `destination`, `departureDate`, `departureTime`, `seatNumber`, `cabinClass`).
  - `tests/ticketing/PdfTicketGenerator.test.js`: Suite de pruebas unitarias que comprueban la generación de un Buffer no vacío, la presencia del magic number `%PDF`, el soporte de caracteres especiales en español (acentos, eñes) sin fallos, el cumplimiento del contrato del puerto `TicketGenerator` y el manejo de error si no se provee el ticket.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 4 como completado.
- **Resultado de tests:** Exitoso (62 tests pasando en 7 suites).

### Commit 5: `feat(billing): implement PDF invoice generator adapter`
- **Hash:** `6d3c03c`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/billing/adapters/PdfInvoiceGenerator.js`: Adaptador que implementa el puerto `InvoiceGenerator`. Genera facturas en PDF utilizando `pdfkit` retornando un `Buffer`. Incluye encabezado "Factura — Malva Airlines", metadata del comprobante (`invoiceId`, `bookingId`, `issuedAt`, `currency`), datos del cliente (`customerName`, `customerEmail`), tabla detallada de ítems con descripción, cantidad, precio unitario y subtotal, total facturado y pie legal.
  - `tests/billing/PdfInvoiceGenerator.test.js`: Suite de pruebas unitarias que validan la generación de un `Buffer` no vacío, formato del magic number `%PDF`, soporte de múltiples ítems (pasajes, tasas, equipajes), soporte de caracteres especiales y manejo de excepciones ante inputs nulos.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 5 como completado.
- **Resultado de tests:** Exitoso (67 tests pasando en 8 suites).

### Commit 6: `feat(notifications): implement SMTP email sender adapter`
- **Hash:** `b4fa8ac`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `package.json`: Agregada dependencia `nodemailer` (^6.10.1).
  - `.env.example`: Variables de entorno de ejemplo para configuración SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
  - `services/notifications/adapters/SmtpEmailSender.js`: Adaptador que implementa el puerto `EmailSender`. Utiliza `nodemailer` configurado por opciones o variables de entorno. Envía correos con soporte HTML y texto plano, adjuntos en formato Buffer, y retorna `{ success: true, messageId }`. En caso de fallo de red o SMTP, propaga el error para permitir reintentos en capas superiores.
  - `tests/notifications/SmtpEmailSender.test.js`: Suite de pruebas unitarias con mock de `nodemailer`, validando configuración del transporte, parámetros correctos en `sendMail` (`to`, `subject`, `html`, `attachments`), mapeo de adjuntos, retorno de `{ success: true, messageId }` y propagación de errores SMTP.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 6 como completado.
- **Resultado de tests:** Exitoso (73 tests pasando en 9 suites).

### Commit 7: `feat(checkout): add CheckoutResult value object`
- **Hash:** `6979b3b`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/checkout/domain/CheckoutResult.js`: Value object inmutable que encapsula el resultado completo del flujo de compra y checkout. Campos: `bookingId`, `paymentResult`, `ticketPdf`, `invoicePdf`, `emailSent`, `emailError`. Provee static factories `success()`, `paymentFailed()`, y `withEmailResult()` para inmutabilidad sin efectos colaterales, además de validación de campos requeridos y `Object.freeze`.
  - `tests/checkout/CheckoutResult.test.js`: Suite de pruebas unitarias cubriendo las fábricas estáticas `success`, `paymentFailed`, actualización inmutable con `withEmailResult`, validación de campos obligatorios y garantía de inmutabilidad estricta.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 7 como completado.
- **Resultado de tests:** Exitoso (82 tests pasando en 10 suites).

### Commit 8: `feat(checkout): implement CheckoutService use case`
- **Hash:** `9eda611`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/checkout/domain/CheckoutRequest.js`: Value object que encapsula y valida los datos de entrada para la compra: `bookingId`, `passengerName`, `passengerEmail`, `flightNumber`, `origin`, `destination`, `departureDate`, `departureTime`, `seatNumber`, `cabinClass`, `amount` (`Money`), y `creditCardToken`. Inmutable (`Object.freeze`).
  - `services/checkout/domain/CheckoutService.js`: Caso de uso orquestador hexagonal. Recibe `paymentGateway`, `ticketGenerator`, `invoiceGenerator` y `emailSender`. Orquesta el flujo: (1) procesar pago con pasarela; si no es aprobado retorna `CheckoutResult.paymentFailed`, (2) generar pasaje electrónico PDF, (3) generar factura PDF, (4) despachar email con ambos PDFs adjuntos, registrando cualquier fallo de correo sin revertir el pago aprobado.
  - `tests/checkout/CheckoutService.test.js`: Suite de pruebas unitarias cubriendo flujos exitosos completos, pagos rechazados, errores transitorios de pasarela, manejo tolerante a fallos de email sin revertir cobro, y validación estricta de parámetros y dependencias.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 8 como completado.
- **Resultado de tests:** Exitoso (94 tests pasando en 11 suites).

### Commit 9: `feat(checkout): add seat release on payment failure`
- **Hash:** `c90794d`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `services/checkout/domain/SeatReleaser.js`: Puerto hexagonal (clase abstracta) con método `async releaseSeats(bookingId) → Promise<void>`.
  - `services/checkout/domain/CheckoutService.js`: Modificado para inyectar opcionalmente un `SeatReleaser`. Si el pago es rechazado (`REJECTED`), invoca automáticamente la liberación de asientos asociados a la reserva. Si la liberación falla o lanza excepción, captura el error para garantizar resiliencia mientras los asientos expiran por TTL. Si el pago es aprobado, omite la liberación.
  - `tests/checkout/CheckoutService.seatRelease.test.js`: Suite de pruebas unitarias cubriendo contrato del puerto `SeatReleaser`, llamada exitosa a `releaseSeats` en rechazo, comportamiento sin releaser inyectado, manejo seguro ante fallos en el servicio de asientos y ausencia de liberación en pagos aprobados.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 9 como completado.
- **Resultado de tests:** Exitoso (99 tests pasando en 12 suites).

### Commit 10: `test(checkout): add integration test for full checkout flow`
- **Hash:** `4bae2dc`
- **Fecha:** 2026-10-14
- **Archivos creados/modificados:**
  - `docs/ticketing/checkout-flow.md`: Documentación de arquitectura con diagrama de secuencia Mermaid detallando el flujo end-to-end, interacción entre puertos y adaptadores, y políticas de tolerancia a fallos.
  - `tests/checkout/CheckoutIntegration.test.js`: Test de integración end-to-end conectando `CheckoutService` con adaptadores reales (`PdfTicketGenerator` y `PdfInvoiceGenerator`) y mocks de puertos externos (`PaymentGateway`, `EmailSender`, `SeatReleaser`). Valida generación real de Buffers PDF con cabecera `%PDF`, despacho vía email de los adjuntos binarios reales, liberación de asientos en caso negativo y preservación del pago ante fallos de correo.
  - `docs/plans/us/plan-emision-facturacion.md`: Marcado de commit 10 como completado.
- **Resultado de tests:** Exitoso (102 tests pasando en 13 suites).

## US: Autenticación, Control de Acceso y Gestión de Roles

### Commit 1: `feat(auth): add User entity and Roles constants`
- **Hash:** `8b12fd5`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `services/auth/domain/Roles.js`: Constantes inmutables de roles (`PASSENGER`, `ADMIN`, `COUNTER_AGENT`), array `ALL_ROLES` y función de validación `isValidRole`.
  - `services/auth/domain/User.js`: Entidad inmutable que representa un usuario del sistema, con validación de campos requeridos (`name`, `email`, `passwordHash`), rol por defecto (`PASSENGER`), autogeneración de `id` (UUID) y `createdAt`, y `Object.freeze`.
  - `tests/auth/Roles.test.js`: Suite de pruebas unitarias que cubren definición de roles, inmutabilidad de constantes y validación de roles.
  - `tests/auth/User.test.js`: Suite de pruebas unitarias que cubren creación válida, rol por defecto, validaciones de campos, trim de strings, autogeneración de ID y fecha, argumentos posicionales e inmutabilidad profunda.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 1 como completado.
- **Resultado de tests:** Exitoso (160 tests pasando en 23 suites).

### Commit 2: `feat(auth): add PasswordHasher port and BcryptPasswordHasher adapter`
- **Hash:** `e1985f3`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `package.json`: Agregada dependencia `bcryptjs` (^3.0.3).
  - `services/auth/domain/PasswordHasher.js`: Puerto hexagonal (clase abstracta) con métodos `async hash(plainPassword)` y `async compare(plainPassword, hashedPassword)` que lanzan `Method not implemented.`.
  - `services/auth/adapters/BcryptPasswordHasher.js`: Adaptador que implementa el puerto `PasswordHasher` usando `bcryptjs`. Permite configurar salt rounds (default 10) y valida entradas antes de hashear o comparar.
  - `tests/auth/BcryptPasswordHasher.test.js`: Suite de pruebas unitarias que cubren cumplimiento del contrato del puerto, hashing con salt aleatorio, comparación correcta e incorrecta, manejo de entradas vacías y herencia del puerto.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 2 como completado.
- **Resultado de tests:** Exitoso (168 tests pasando en 24 suites).

### Commit 3: `feat(auth): add TokenService port and JwtTokenService adapter`
- **Hash:** `b7c46b2`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `package.json`: Agregada dependencia `jsonwebtoken` (^9.0.2).
  - `.env.example`: Agregadas variables de entorno de ejemplo `JWT_SECRET` y `JWT_EXPIRES_IN`.
  - `services/auth/domain/TokenService.js`: Puerto hexagonal (clase abstracta) con métodos `sign(payload)` y `verify(token)` que lanzan `Method not implemented.`.
  - `services/auth/adapters/JwtTokenService.js`: Adaptador que implementa el puerto `TokenService` con `jsonwebtoken`. Permite configurar secreto y tiempo de expiración (default 8h). Valida payload y token.
  - `tests/auth/JwtTokenService.test.js`: Suite de pruebas unitarias que cubren cumplimiento del contrato del puerto, firma y decodificación de tokens JWT, detección de tokens manipulados, manejo de expiración y validación de entradas.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 3 como completado.
- **Resultado de tests:** Exitoso (177 tests pasando en 25 suites).

### Commit 4: `feat(auth): implement RegisterUser use case`
- **Hash:** `5881f7e`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `services/auth/adapters/InMemoryUserRepository.js`: Repositorio de usuarios en memoria con búsqueda por email (normalizado/insensible a mayúsculas), búsqueda por ID y creación.
  - `services/auth/use-cases/RegisterUser.js`: Caso de uso para registrar nuevos usuarios con validación de contraseña mínima (>= 6 caracteres), verificación de email duplicado, hashing seguro de contraseña y persistencia sin exponer el hash en la respuesta.
  - `tests/auth/RegisterUser.test.js`: Suite de pruebas unitarias que cubren registro exitoso, rol por defecto PASSENGER, roles explícitos ADMIN y COUNTER_AGENT, rechazo de emails duplicados, validación de contraseña corta/vacía y validaciones delegadas a la entidad User.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 4 como completado.
- **Resultado de tests:** Exitoso (185 tests pasando en 26 suites).

### Commit 5: `feat(auth): implement LoginUser use case`
- **Hash:** `8c847d5`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `services/auth/use-cases/LoginUser.js`: Caso de uso para inicio de sesión seguro, con validación de credenciales (búsqueda de usuario, comparación de contraseñas con bcrypt), mensaje genérico de error ('invalid credentials') para evitar filtrado de usuarios existentes, y emisión de token JWT firmado que incluye ID de usuario, email y rol asignado.
  - `tests/auth/LoginUser.test.js`: Suite de pruebas unitarias que cubren inicio de sesión exitoso, generación y verificación del token JWT, asignación correcta de roles (PASSENGER, ADMIN, COUNTER_AGENT), rechazo por email inexistente o contraseña incorrecta, validación de parámetros del constructor y entradas vacías/inválidas.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 5 como completado.
- **Resultado de tests:** Exitoso (193 tests pasando en 27 suites).

### Commit 6: `feat(auth): add authentication and authorization middlewares`
- **Hash:** `5439aa3`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `infra/auth-middleware.js`: Middleware Express de autenticación que valida tokens JWT en el header `Authorization: Bearer <token>`, adjunta `req.user` (`userId`, `email`, `role`) a la solicitud y responde 401 Unauthorized ante tokens ausentes, malformados o expirados.
  - `infra/role-middleware.js`: Factory function `requireRole` que valida que el usuario autenticado posea uno de los roles autorizados; responde 403 Forbidden ante permisos insuficientes y 401 si la petición no está autenticada.
  - `tests/auth/auth-middleware.test.js`: Suite de pruebas unitarias cubriendo autenticación exitosa, headers en mayúsculas/minúsculas, ausencia de cabecera Authorization, esquemas no-Bearer, tokens vacíos, manipulados o expirados.
  - `tests/auth/role-middleware.test.js`: Suite de pruebas unitarias verificando acceso concedido para roles autorizados individuales y múltiples (array o varargs), bloqueo 403 para roles insuficientes y 401 ante usuario no autenticado.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 6 como completado.
- **Resultado de tests:** Exitoso (208 tests pasando en 29 suites).

### Commit 7: `feat(auth): add auth endpoints and protect existing routes`
- **Hash:** `e2793d3`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `services/auth/adapters/AuthController.js`: Controlador HTTP para endpoints de autenticación (`register` y `login`) con manejo adecuado de códigos de respuesta (201, 200, 400, 401, 409).
  - `infra/auth-router.js`: Router Express que expone las rutas `POST /register` y `POST /login`.
  - `infra/flight-router.js`: Modificado para aceptar opcionalmente middlewares de autenticación y rol de administrador, protegiendo mutaciones (`POST /`, `PUT /:id`, `DELETE /:id`) y manteniendo públicas las búsquedas de vuelos.
  - `infra/booking-router.js`: Modificado para aceptar opcionalmente middleware de autenticación, protegiendo creación y confirmación de reservas.
  - `server.js`: Instanciadas dependencias del módulo auth, montado `auth-router` bajo `/api/auth` y agregada opción `protectRoutes` en `createApp`.
  - `tests/auth/AuthIntegration.test.js`: Suite completa de pruebas de integración end-to-end con servidor Express real, cubriendo registro (201, 409 duplicado, 400 validación), login (200 con JWT, 401 credenciales inválidas), acceso público a búsqueda de vuelos, bloqueo 401 de rutas sin token, bloqueo 403 a pasajero en rutas de administrador y flujo exitoso de reserva autenticada.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 7 como completado.
- **Resultado de tests:** Exitoso (219 tests pasando en 30 suites).

### Commit 8: `feat(auth): add login and register pages to frontend`
- **Hash:** `8385a70`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `frontend/src/services/authService.js`: Servicio cliente HTTP para llamadas a `/api/auth/register` y `/api/auth/login`.
  - `frontend/src/hooks/useAuth.js`: Hook React para gestión de estado de autenticación, persistencia en `localStorage`, login, registro y cierre de sesión.
  - `frontend/src/components/auth/auth.css`: Estilos visuales con la identidad de marca de Malva Airlines para tarjetas de autenticación, formularios, estados de error y badges de usuario.
  - `frontend/src/components/auth/LoginForm.jsx`: Formulario interactivo de inicio de sesión con validación de campos requeridos y visualización de errores.
  - `frontend/src/components/auth/RegisterForm.jsx`: Formulario interactivo de registro con validación de coincidencia de contraseñas y longitud mínima.
  - `frontend/src/pages/LoginPage.jsx`: Pantalla de inicio de sesión integrada con redirección inteligente según rol.
  - `frontend/src/pages/RegisterPage.jsx`: Pantalla de registro de usuarios con auto-login posterior.
  - `frontend/src/pages/PassengerSearchPage.jsx`: Actualizado para mostrar estado de sesión, nombre y rol del usuario, acceso directo a panel de administración si corresponde y botón de salida.
  - `frontend/src/pages/AdminFlightsPage.jsx`: Actualizado para mostrar información del administrador en sesión y permitir volver a la vista pública.
  - `frontend/src/main.jsx`: Configurado enrutador por hash para alternar entre vista pública de pasajeros (por defecto), Login, Registro y Administración protegida con bloqueo si el rol no es ADMIN.
  - `docs/plans/us/plan-autenticacion-acceso-roles.md`: Marcado de commit 8 como completado.
- **Resultado de tests:** Compilación frontend exitosa (`vite build`) y 219 tests pasando en 30 suites.

### Commit 9: `fix(api): add root endpoint and resolve dev server module conflict`
- **Hash:** `Pendiente`
- **Fecha:** 2026-10-30
- **Archivos creados/modificados:**
  - `server.js`: Agregado endpoint informativo en `GET /` que devuelve estado de la API, URL del frontend y rutas principales, evitando la respuesta por defecto `Cannot GET /`.
  - Eliminada carpeta residual `frontend/node_modules/` que generaba conflicto de resolución de módulos con Rolldown en el servidor de desarrollo de Vite.
- **Resultado de tests:** Exitoso (219 tests pasando en 30 suites).
