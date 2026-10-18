# Flujo Integral de Compra (Checkout Flow)

Este documento detalla la orquestación del proceso de compra de pasajes y facturación en Malva Airlines, implementado según la arquitectura hexagonal (puertos y adaptadores) en `CheckoutService`.

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    actor Pasajero as Pasajero / Frontend
    participant CS as CheckoutService
    participant PG as PaymentGateway (Puerto)
    participant TG as PdfTicketGenerator (Adaptador Real)
    participant IG as PdfInvoiceGenerator (Adaptador Real)
    participant ES as EmailSender (Puerto)
    participant SR as SeatReleaser (Puerto)

    Pasajero->>CS: processCheckout(checkoutRequest)
    Note over CS: 1. Procesamiento de Pago
    CS->>PG: processPayment(paymentRequest)
    
    alt Pago APROBADO (APPROVED)
        PG-->>CS: PaymentResult (APPROVED)
        
        Note over CS: 2. Generación de Pasaje Electrónico PDF
        CS->>TG: generate(ticket)
        TG-->>CS: ticketPdf (Buffer %PDF)
        
        Note over CS: 3. Generación de Factura PDF
        CS->>IG: generate(invoice)
        IG-->>CS: invoicePdf (Buffer %PDF)
        
        Note over CS: 4. Despacho de Correo Electrónico
        CS->>ES: send(emailMessage [con ticketPdf y invoicePdf])
        alt Envío de Email Exitoso
            ES-->>CS: { success: true, messageId }
        else Fallo en Envío de Email (Error de Red/SMTP)
            ES-->>CS: Error (Capturado y registrado)
            Note over CS: El pago no se revierte; se documenta emailError
        end
        
        CS-->>Pasajero: CheckoutResult (Éxito, PDFs adjuntos, estado de email)

    else Pago RECHAZADO (REJECTED)
        PG-->>CS: PaymentResult (REJECTED)
        
        opt SeatReleaser disponible
            Note over CS: Liberación automática de asientos bloqueados
            CS->>SR: releaseSeats(bookingId)
            SR-->>CS: Asientos liberados (o fallo capturado de forma tolerante)
        end
        
        CS-->>Pasajero: CheckoutResult.paymentFailed (Sin PDFs, sin envío de email)
    end
```

## Componentes y Puertos Involucrados

| Componente | Rol Arquitectónico | Responsabilidad |
|---|---|---|
| `CheckoutService` | Caso de uso / Orquestador | Coordina el cobro, la emisión de comprobantes, el envío del email y la liberación de asientos en fallos. |
| `PaymentGateway` | Puerto hexagonal | Abstracción de pasarela de pago (soporta implementaciones resilientes como Stripe/MercadoPago con fallback). |
| `TicketGenerator` | Puerto hexagonal | Abstracción para generar el documento de pasaje electrónico. Implementado por `PdfTicketGenerator` usando `pdfkit`. |
| `InvoiceGenerator` | Puerto hexagonal | Abstracción para generar la factura electrónica. Implementado por `PdfInvoiceGenerator` usando `pdfkit`. |
| `EmailSender` | Puerto hexagonal | Abstracción para el envío de notificaciones por email. Implementado por `SmtpEmailSender` usando `nodemailer`. |
| `SeatReleaser` | Puerto hexagonal | Abstracción para liberar bloqueos temporales de asientos cuando el pago no prospera. |

## Políticas de Tolerancia a Fallos

1. **Fallo en envío de correo:**
   Si la pasarela aprobó la transacción pero el servidor SMTP está inaccesible o arroja error, el cobro y la generación de documentos se conservan como válidos. El error se reporta en `CheckoutResult.emailError` con `emailSent: false` para permitir reintentos asíncronos o notificación por canal alternativo.
2. **Fallo en liberación de asientos:**
   Si la llamada a `releaseSeats()` arroja un error de conexión, este se captura y registra sin interrumpir la respuesta al cliente. Como mecanismo de contingencia, los asientos bloqueados cuentan con un TTL de expiración automática.
