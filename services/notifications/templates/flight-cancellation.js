'use strict';

/**
 * Generates an email template for flight cancellations.
 *
 * @param {Object} data
 * @param {string} data.passengerName - Passenger's full name
 * @param {string} data.flightNumber - Flight code (e.g., 'AR1234')
 * @param {string} [data.origin] - Origin airport
 * @param {string} [data.destination] - Destination airport
 * @param {string} [data.departureTime] - Scheduled departure time
 * @returns {{ subject: string, body: string }}
 */
function flightCancellationTemplate({
  passengerName = 'Pasajero',
  flightNumber = '',
  origin = '',
  destination = '',
  departureTime = '',
} = {}) {
  const subject = `Cancelación de su vuelo ${flightNumber}`.trim();

  const routeText = origin && destination ? `${origin} → ${destination}` : '';

  const body = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #c62828; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Malva Airlines</h1>
      <p style="margin: 5px 0 0; font-size: 16px;">Aviso de Cancelación de Vuelo</p>
    </div>
    <div style="padding: 24px;">
      <p>Estimado/a <strong>${passengerName}</strong>,</p>
      <p>Lamentamos informarle que su vuelo <strong>${flightNumber}</strong>${routeText ? ` (${routeText})` : ''}${departureTime ? `, programado para las ${departureTime},` : ''} ha sido <strong>cancelado</strong>.</p>
      
      <div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #b71c1c;">Opciones para su reserva:</h3>
        <ul style="padding-left: 20px; margin: 10px 0 0;">
          <li><strong>Reprogramación gratuita:</strong> Puede seleccionar un nuevo vuelo en la misma ruta sin ningún cargo adicional.</li>
          <li><strong>Reembolso total:</strong> Puede solicitar la devolución completa del importe abonado mediante nuestro canal de atención.</li>
        </ul>
      </div>

      <p>Para gestionar su reprogramación o solicitar el reembolso correspondiente, ingrese a nuestra plataforma web o comuníquese con nuestro centro de atención al cliente mencionando su número de reserva.</p>
      <p>Lamentamos sinceramente los inconvenientes que esta situación pueda ocasionarle en sus planes de viaje.</p>
      <p style="margin-top: 30px;">Atentamente,<br><strong>El equipo de Malva Airlines</strong></p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, body };
}

module.exports = flightCancellationTemplate;
