'use strict';

/**
 * Generates an email template for flight schedule changes.
 *
 * @param {Object} data
 * @param {string} data.passengerName - Passenger's full name
 * @param {string} data.flightNumber - Flight code (e.g., 'AR1234')
 * @param {string} [data.origin] - Origin airport
 * @param {string} [data.destination] - Destination airport
 * @param {string} [data.oldDepartureTime] - Original departure time
 * @param {string} [data.newDepartureTime] - New departure time
 * @param {string} [data.oldArrivalTime] - Original arrival time
 * @param {string} [data.newArrivalTime] - New arrival time
 * @returns {{ subject: string, body: string }}
 */
function flightScheduleChangeTemplate({
  passengerName = 'Pasajero',
  flightNumber = '',
  origin = '',
  destination = '',
  oldDepartureTime = '',
  newDepartureTime = '',
  oldArrivalTime = '',
  newArrivalTime = '',
} = {}) {
  const subject = `Cambio de horario en su vuelo ${flightNumber}`.trim();

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
    <div style="background-color: #7b1fa2; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Malva Airlines</h1>
      <p style="margin: 5px 0 0; font-size: 16px;">Aviso de Cambio de Horario</p>
    </div>
    <div style="padding: 24px;">
      <p>Estimado/a <strong>${passengerName}</strong>,</p>
      <p>Le informamos que se ha producido una modificación en el horario programado para su vuelo <strong>${flightNumber}</strong>${routeText ? ` (${routeText})` : ''}.</p>
      
      <div style="background-color: #f3e5f5; border-left: 4px solid #7b1fa2; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #4a148c;">Detalle del nuevo itinerario:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${oldDepartureTime || newDepartureTime ? `
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Salida anterior:</td>
            <td style="padding: 6px 0; color: #888; text-decoration: line-through;">${oldDepartureTime || 'N/D'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #7b1fa2;">Nueva salida:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #7b1fa2;">${newDepartureTime || 'N/D'}</td>
          </tr>
          ` : ''}
          ${oldArrivalTime || newArrivalTime ? `
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Llegada anterior:</td>
            <td style="padding: 6px 0; color: #888; text-decoration: line-through;">${oldArrivalTime || 'N/D'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #7b1fa2;">Nueva llegada:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #7b1fa2;">${newArrivalTime || 'N/D'}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p>Si este nuevo horario no se ajusta a sus planes de viaje, puede gestionar la reprogramación de su vuelo sin costo adicional comunicándose con nuestro centro de atención o ingresando a nuestra plataforma.</p>
      <p style="margin-top: 30px;">Atentamente,<br><strong>El equipo de Malva Airlines</strong></p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, body };
}

module.exports = flightScheduleChangeTemplate;
