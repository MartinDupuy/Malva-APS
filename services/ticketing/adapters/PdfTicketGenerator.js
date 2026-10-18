'use strict';

const PDFDocument = require('pdfkit');
const TicketGenerator = require('../domain/TicketGenerator');

class PdfTicketGenerator extends TicketGenerator {
  /**
   * Generates a PDF buffer for a given Ticket entity.
   * @param {import('../domain/Ticket')} ticket
   * @returns {Promise<Buffer>}
   */
  async generate(ticket) {
    if (!ticket) {
      throw new Error('Ticket is required to generate PDF');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        // Header
        doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('Pasaje Electrónico — Malva Airlines', { align: 'center' });
        doc.moveDown(1.5);

        // Subheading / Reservation info
        doc.fontSize(12).font('Helvetica-Bold').text('Información de la Reserva:');
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(11);
        doc.text(`Código de Reserva (Booking ID): ${ticket.bookingId}`);
        doc.text(`Número de Pasaje (Ticket ID): ${ticket.ticketId}`);
        doc.text(`Pasajero: ${ticket.passengerName}`);
        const issuedDateStr =
          ticket.issuedAt instanceof Date
            ? ticket.issuedAt.toLocaleString('es-AR', { timeZone: 'UTC' })
            : String(ticket.issuedAt);
        doc.text(`Fecha de Emisión: ${issuedDateStr}`);
        doc.moveDown(1.5);

        // Flight details
        doc.font('Helvetica-Bold').fontSize(12).text('Detalles del Vuelo:');
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(11);
        doc.text(`Número de Vuelo: ${ticket.flightNumber}`);
        doc.text(`Itinerario: ${ticket.origin} → ${ticket.destination}`);
        doc.text(`Fecha de Salida: ${ticket.departureDate}`);
        doc.text(`Hora de Salida: ${ticket.departureTime}`);
        doc.text(`Asiento: ${ticket.seatNumber}`);
        doc.text(`Clase: ${ticket.cabinClass}`);
        doc.moveDown(2);

        // Footer / Instructions
        doc
          .fontSize(9)
          .font('Helvetica-Oblique')
          .text(
            'Por favor preséntese en el aeropuerto con al menos 2 horas de anticipación para vuelos nacionales y 3 horas para internacionales.',
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PdfTicketGenerator;
