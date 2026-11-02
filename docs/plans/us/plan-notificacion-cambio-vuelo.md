# Plan de Implementación – Notificaciones por Cambios de Vuelo

| Campo | Valor |
|---|---|
| **Rama** | `us/notificacion-cambio-vuelo` |
| **User Story** | Como pasajero, quiero recibir correos automáticos si un vuelo reservado cambia de horario o es cancelado, de forma que pueda reprogramar mi viaje a tiempo. |
| **Story Points** | 2 |
| **Presupuesto total** | 6 horas |

---

## Decisiones de diseño

### Estrategia general

La funcionalidad se implementa **sin introducir un event bus ni patrón Observer**, ya que el codebase actual usa llamadas directas y no existe ningún sistema de eventos. Introducir un bus sería un overkill para SP 2. En su lugar:

1. Se crea un **caso de uso `NotifyFlightChange`** en el servicio de notificaciones que orquesta: buscar bookings afectados → construir emails → enviarlos.
2. Se **inyecta como dependencia opcional** en `FlightController`, que lo invoca tras una actualización o cancelación exitosa.
3. La notificación es **fire-and-forget**: si falla el envío de emails, el vuelo ya fue actualizado (no se revierte). Los errores se loguean pero no bloquean la respuesta HTTP.

### Módulos afectados

```
services/
├── bookings/
│   └── adapters/
│       ├── in-memory-booking-repository.js   ← MODIFICAR (agregar findByFlightInstanceId)
│       └── postgres-booking-repository.js    ← MODIFICAR (agregar findByFlightInstanceId)
├── flights/
│   └── adapters/
│       └── flight-controller.js              ← MODIFICAR (inyectar y llamar notificador)
└── notifications/
    ├── domain/
    │   ├── EmailMessage.js                   (existente, sin cambios)
    │   └── EmailSender.js                    (existente, sin cambios)
    ├── adapters/
    │   └── SmtpEmailSender.js                (existente, sin cambios)
    ├── templates/                            ← NUEVO
    │   ├── flight-schedule-change.js         ← NUEVO
    │   └── flight-cancellation.js            ← NUEVO
    └── use-cases/
        └── notify-flight-change.js           ← NUEVO

server.js                                     ← MODIFICAR (wiring de dependencias)

tests/
├── bookings/
│   └── booking-repository.test.js            ← NUEVO
├── notifications/
│   ├── flight-schedule-change-template.test.js  ← NUEVO
│   ├── flight-cancellation-template.test.js     ← NUEVO
│   └── NotifyFlightChange.test.js               ← NUEVO
└── flights/
    └── flight-notification-integration.test.js  ← NUEVO
```

### Principios aplicados

| Principio | Aplicación |
|---|---|
| **SRP** | Los use cases de vuelos no manejan notificaciones; `NotifyFlightChange` se encarga exclusivamente de eso. |
| **OCP** | `FlightController` acepta un notificador opcional — si no se pasa, funciona igual que antes (open for extension, closed for modification). |
| **DIP** | `NotifyFlightChange` depende del port `EmailSender` (abstracción), no de `SmtpEmailSender` (implementación). |
| **Inmutabilidad** | Las plantillas de email son funciones puras que retornan strings. |

### Convención de commits

Formato: `tipo(alcance): descripción en minúsculas`

---

## Commits

### Commit 1 · `feat(bookings): add findByFlightInstanceId to booking repositories`

| Estimación | 1 h |
|---|---|
| Estado | ✅ COMPLETADO |

#### Qué se hace

1. **`services/bookings/adapters/in-memory-booking-repository.js`** — Agregar método `findByFlightInstanceId(flightInstanceId)`:
   - Itera sobre el Map interno y retorna un array de bookings cuyo `flightInstanceId` coincida.
   - Retorna array vacío si no hay coincidencias.
   - Solo retorna bookings con status `CONFIRMED` (los `HELD` o `CANCELLED` no deben notificarse).

2. **`services/bookings/adapters/postgres-booking-repository.js`** — Agregar método `findByFlightInstanceId(flightInstanceId)`:
   - Query: `SELECT * FROM bookings WHERE flight_instance_id = $1 AND status = 'CONFIRMED'`.
   - Mapea resultados al formato del dominio (parsear `passengers` de JSON).

#### Tests

**`tests/bookings/booking-repository.test.js`** — Tests unitarios para `InMemoryBookingRepository.findByFlightInstanceId`:
- ✅ Retorna array vacío cuando no hay bookings para el flightInstanceId dado.
- ✅ Retorna solo bookings CONFIRMED que coincidan con el flightInstanceId.
- ✅ No retorna bookings con status HELD o CANCELLED.
- ✅ Retorna múltiples bookings si hay varias reservas para el mismo vuelo.

---

### Commit 2 · `feat(notifications): add email templates for flight changes`

| Estimación | 1.5 h |
|---|---|
| Estado | ✅ COMPLETADO |

#### Qué se hace

1. **`services/notifications/templates/flight-schedule-change.js`** — Función pura que recibe `{ passengerName, flightNumber, origin, destination, oldDepartureTime, newDepartureTime, oldArrivalTime, newArrivalTime }` y retorna un objeto `{ subject, body }`:
   - `subject`: `"Cambio de horario en su vuelo {flightNumber}"`.
   - `body`: HTML con saludo personalizado, detalle del cambio (horario anterior → nuevo), recomendación de reprogramar, y pie de firma de la aerolínea.

2. **`services/notifications/templates/flight-cancellation.js`** — Función pura que recibe `{ passengerName, flightNumber, origin, destination, departureTime }` y retorna un objeto `{ subject, body }`:
   - `subject`: `"Cancelación de su vuelo {flightNumber}"`.
   - `body`: HTML con saludo personalizado, detalle del vuelo cancelado, instrucciones para solicitar reprogramación o reembolso, y pie de firma.

#### Tests

**`tests/notifications/flight-schedule-change-template.test.js`**:
- ✅ Retorna subject con el número de vuelo.
- ✅ El body contiene el nombre del pasajero.
- ✅ El body contiene el horario anterior y el nuevo.
- ✅ El body contiene origen y destino.

**`tests/notifications/flight-cancellation-template.test.js`**:
- ✅ Retorna subject con el número de vuelo.
- ✅ El body contiene el nombre del pasajero.
- ✅ El body contiene los datos del vuelo cancelado.
- ✅ El body contiene información de reprogramación/reembolso.

---

### Commit 3 · `feat(notifications): add NotifyFlightChange use case`

| Estimación | 2 h |
|---|---|
| Estado | ✅ COMPLETADO |

#### Qué se hace

1. **`services/notifications/use-cases/notify-flight-change.js`** — Clase `NotifyFlightChange`:
   - **Constructor**: recibe `{ bookingRepository, emailSender }`.
   - **Método `execute({ flight, previousFlight, changeType })`**:
     - `changeType` es `'SCHEDULE_CHANGE'` o `'CANCELLATION'`.
     - Llama a `bookingRepository.findByFlightInstanceId(flight.id)` para obtener bookings confirmados.
     - Extrae todos los pasajeros (con email) de los bookings encontrados.
     - Para cada pasajero, genera el `EmailMessage` usando la plantilla correspondiente según `changeType`.
     - Llama a `emailSender.send()` para cada mensaje. Usa `Promise.allSettled()` para no fallar si un envío individual falla.
     - Retorna `{ sent: number, failed: number }` como resumen.
   - Si no hay bookings afectados, retorna `{ sent: 0, failed: 0 }` inmediatamente.

#### Tests

**`tests/notifications/NotifyFlightChange.test.js`**:
- ✅ Retorna `{ sent: 0, failed: 0 }` cuando no hay bookings para el vuelo.
- ✅ Envía email a todos los pasajeros de bookings confirmados con template de cambio de horario.
- ✅ Envía email a todos los pasajeros de bookings confirmados con template de cancelación.
- ✅ Envía emails a pasajeros de múltiples bookings para el mismo vuelo.
- ✅ Usa `Promise.allSettled` — un fallo en un envío no impide los demás; reporta `failed` correctamente.
- ✅ Llama a `emailSender.send()` con un `EmailMessage` válido (verifica `to`, `subject`, `body`).
- ✅ No envía emails si el booking tiene status distinto de CONFIRMED (delegado al repository, se verifica con mock).

---

### Commit 4 · `feat(flights): integrate notifications on flight update and cancel`

| Estimación | 1.5 h |
|---|---|
| Estado | ✅ COMPLETADO |

#### Qué se hace

1. **`services/flights/adapters/flight-controller.js`** — Modificar:
   - El constructor acepta un parámetro opcional `{ notifyFlightChange }` (instancia del use case).
   - En `update()`: tras la actualización exitosa, si se recibió `notifyFlightChange`, invocarlo con `{ flight: updatedFlight, previousFlight: originalFlight, changeType: 'SCHEDULE_CHANGE' }`. La llamada es fire-and-forget (`.catch(err => console.error(...))`), no bloquea la respuesta HTTP.
   - En `cancel()`: tras la cancelación exitosa, si se recibió `notifyFlightChange`, invocarlo con `{ flight: cancelledFlight, changeType: 'CANCELLATION' }`. Misma estrategia fire-and-forget.
   - Si `notifyFlightChange` no fue inyectado, el controller funciona exactamente igual que antes (retrocompatibilidad).

2. **`server.js`** — Modificar el wiring:
   - Instanciar `NotifyFlightChange` con el `bookingRepository` y `emailSender` (crear `SmtpEmailSender` si las variables de entorno SMTP están configuradas, caso contrario no inyectar notificador).
   - Pasar la instancia al `FlightController`.

#### Tests

**`tests/flights/flight-notification-integration.test.js`**:
- ✅ Al hacer `PUT /api/flights/:id` con cambios de horario, se invoca `notifyFlightChange.execute()` con `changeType: 'SCHEDULE_CHANGE'` y los datos del vuelo anterior y nuevo.
- ✅ Al hacer `DELETE /api/flights/:id`, se invoca `notifyFlightChange.execute()` con `changeType: 'CANCELLATION'`.
- ✅ Si `notifyFlightChange` no fue inyectado, update y cancel funcionan sin error (retrocompatibilidad).
- ✅ Si la notificación falla, la respuesta HTTP sigue siendo exitosa (fire-and-forget).
- ✅ **Test end-to-end**: crear vuelo → crear booking con pasajeros → confirmar booking → cancelar vuelo → verificar que `emailSender.send()` fue llamado con los emails de los pasajeros.

---

## Resumen de archivos por commit

| # | Estado | Commit | Archivos modificados/creados | Tests |
|---|---|---|---|---|
| 1 | ✅ | `feat(bookings): add findByFlightInstanceId to booking repositories` | `in-memory-booking-repository.js`, `postgres-booking-repository.js` | `booking-repository.test.js` |
| 2 | ✅ | `feat(notifications): add email templates for flight changes` | `flight-schedule-change.js`, `flight-cancellation.js` | `flight-schedule-change-template.test.js`, `flight-cancellation-template.test.js` |
| 3 | ✅ | `feat(notifications): add NotifyFlightChange use case` | `notify-flight-change.js` | `NotifyFlightChange.test.js` |
| 4 | ✅ | `feat(flights): integrate notifications on flight update and cancel` | `flight-controller.js`, `server.js` | `flight-notification-integration.test.js` |

---

## Distribución horaria por tarea del enunciado

| Tarea del enunciado | Commits | Horas |
|---|---|---|
| Desarrollar evento/trigger backend que detecte modificaciones o cancelaciones | Commit 1, Commit 4 | 2.5 h |
| Diseñar e implementar plantillas de email | Commit 2 | 1.5 h |
| Implementar envío masivo/asíncrono de notificaciones | Commit 3 | 2 h |
| **Total** | | **6 h** |

---

## Verificación de criterios de aceptación

| Criterio | Commits que lo cubren |
|---|---|
| Al modificar un vuelo, los pasajeros con pasajes confirmados reciben correo informativo | Commits 1 + 2 + 3 + 4 (test e2e en Commit 4) |
| Al cancelar un vuelo, los pasajeros con pasajes confirmados reciben correo informativo | Commits 1 + 2 + 3 + 4 (test e2e en Commit 4) |

---

## Dependencias externas nuevas

| Paquete | Propósito | Justificación |
|---|---|---|
| — | — | No se requieren dependencias nuevas. `nodemailer` ya está instalado. |

