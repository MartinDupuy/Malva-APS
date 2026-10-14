'use strict';

const PdfTicketGenerator = require('../../services/ticketing/adapters/PdfTicketGenerator');
const TicketGenerator = require('../../services/ticketing/domain/TicketGenerator');
const Ticket = require('../../services/ticketing/domain/Ticket');

describe('PdfTicketGenerator Adapter', () => {
  let generator;

  beforeEach(() => {
    generator = new PdfTicketGenerator();
  });

  test('should be an instance of TicketGenerator (hexagonal port)', () => {
    expect(generator).toBeInstanceOf(TicketGenerator);
  });

  test('should generate a valid non-empty PDF Buffer for a valid Ticket', async () => {
    const ticket = new Ticket({
      ticketId: 'TKT-987654',
      bookingId: 'BK-123',
      passengerName: 'Carlos Gardel',
      flightNumber: 'MV-505',
      origin: 'EZE',
      destination: 'MAD',
      departureDate: '2026-11-20',
      departureTime: '22:15',
      seatNumber: '03B',
      cabinClass: 'Business',
      issuedAt: new Date('2026-10-14T12:00:00Z'),
    });

    const pdfBuffer = await generator.generate(ticket);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(500);
  });

  test('should verify that generated Buffer starts with PDF magic number (%PDF)', async () => {
    const ticket = new Ticket({
      bookingId: 'BK-456',
      passengerName: 'John Doe',
      flightNumber: 'MV-101',
      origin: 'AEP',
      destination: 'COR',
      departureDate: '2026-12-05',
      departureTime: '08:00',
      seatNumber: '12F',
      cabinClass: 'Economy',
    });

    const pdfBuffer = await generator.generate(ticket);

    const header = pdfBuffer.subarray(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });

  test('should generate PDF with Spanish special characters (tildes, ñ) without errors', async () => {
    const ticket = new Ticket({
      bookingId: 'BK-ES-789',
      passengerName: 'Iñaki Muñoz Peñaloza',
      flightNumber: 'MV-303',
      origin: 'MDZ',
      destination: 'BUE',
      departureDate: '2026-11-10',
      departureTime: '15:30',
      seatNumber: '01A',
      cabinClass: 'Primera Clase',
    });

    const pdfBuffer = await generator.generate(ticket);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  test('should throw error if ticket is not provided', async () => {
    await expect(generator.generate(null)).rejects.toThrow('Ticket is required to generate PDF');
  });
});
