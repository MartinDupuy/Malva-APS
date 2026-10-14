'use strict';

const Ticket = require('../../services/ticketing/domain/Ticket');
const TicketGenerator = require('../../services/ticketing/domain/TicketGenerator');

describe('Ticket Entity and TicketGenerator Port', () => {
  const validTicketData = {
    ticketId: 'TKT-123456',
    bookingId: 'BOOKING-999',
    passengerName: 'Jane Doe',
    flightNumber: 'MV-101',
    origin: 'EZE',
    destination: 'MAD',
    departureDate: '2026-11-15',
    departureTime: '18:30',
    seatNumber: '14A',
    cabinClass: 'Economy',
    issuedAt: new Date('2026-10-14T10:00:00Z'),
  };

  describe('Ticket creation', () => {
    test('should create a valid ticket and set all fields', () => {
      const ticket = new Ticket(validTicketData);

      expect(ticket.ticketId).toBe('TKT-123456');
      expect(ticket.bookingId).toBe('BOOKING-999');
      expect(ticket.passengerName).toBe('Jane Doe');
      expect(ticket.flightNumber).toBe('MV-101');
      expect(ticket.origin).toBe('EZE');
      expect(ticket.destination).toBe('MAD');
      expect(ticket.departureDate).toBe('2026-11-15');
      expect(ticket.departureTime).toBe('18:30');
      expect(ticket.seatNumber).toBe('14A');
      expect(ticket.cabinClass).toBe('Economy');
      expect(ticket.issuedAt).toEqual(new Date('2026-10-14T10:00:00Z'));
    });

    test('should auto-generate issuedAt when not provided', () => {
      const { issuedAt, ...dataWithoutIssuedAt } = validTicketData;
      const before = Date.now();
      const ticket = new Ticket(dataWithoutIssuedAt);
      const after = Date.now();

      expect(ticket.issuedAt).toBeInstanceOf(Date);
      expect(ticket.issuedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(ticket.issuedAt.getTime()).toBeLessThanOrEqual(after);
    });

    test('should auto-generate ticketId when not provided', () => {
      const { ticketId, ...dataWithoutTicketId } = validTicketData;
      const ticket = new Ticket(dataWithoutTicketId);

      expect(typeof ticket.ticketId).toBe('string');
      expect(ticket.ticketId.length).toBeGreaterThan(0);
    });

    test('should support positional arguments', () => {
      const ticket = new Ticket(
        'TKT-POS-1',
        'BOOK-1',
        'John Smith',
        'MV-202',
        'MVD',
        'AEP',
        '2026-12-01',
        '09:00',
        '2C',
        'Business',
        new Date('2026-10-14T08:00:00Z')
      );

      expect(ticket.ticketId).toBe('TKT-POS-1');
      expect(ticket.bookingId).toBe('BOOK-1');
      expect(ticket.passengerName).toBe('John Smith');
      expect(ticket.flightNumber).toBe('MV-202');
      expect(ticket.origin).toBe('MVD');
      expect(ticket.destination).toBe('AEP');
      expect(ticket.departureDate).toBe('2026-12-01');
      expect(ticket.departureTime).toBe('09:00');
      expect(ticket.seatNumber).toBe('2C');
      expect(ticket.cabinClass).toBe('Business');
      expect(ticket.issuedAt).toEqual(new Date('2026-10-14T08:00:00Z'));
    });
  });

  describe('Validation of required fields', () => {
    test('should throw error when passengerName is missing', () => {
      const { passengerName, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('passengerName is required');
    });

    test('should throw error when flightNumber is missing', () => {
      const { flightNumber, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('flightNumber is required');
    });

    test('should throw error when bookingId is missing', () => {
      const { bookingId, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('bookingId is required');
    });

    test('should throw error when origin is missing', () => {
      const { origin, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('origin is required');
    });

    test('should throw error when destination is missing', () => {
      const { destination, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('destination is required');
    });

    test('should throw error when departureDate is missing', () => {
      const { departureDate, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('departureDate is required');
    });

    test('should throw error when departureTime is missing', () => {
      const { departureTime, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('departureTime is required');
    });

    test('should throw error when seatNumber is missing', () => {
      const { seatNumber, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('seatNumber is required');
    });

    test('should throw error when cabinClass is missing', () => {
      const { cabinClass, ...data } = validTicketData;
      expect(() => new Ticket(data)).toThrow('cabinClass is required');
    });

    test('should throw error when required fields are empty or whitespace strings', () => {
      expect(() => new Ticket({ ...validTicketData, passengerName: '   ' })).toThrow('passengerName is required');
      expect(() => new Ticket({ ...validTicketData, flightNumber: '' })).toThrow('flightNumber is required');
    });

    test('should throw error when no data is provided', () => {
      expect(() => new Ticket()).toThrow('bookingId is required');
    });
  });

  describe('Immutability', () => {
    test('should be frozen and throw TypeError when trying to mutate properties', () => {
      const ticket = new Ticket(validTicketData);

      expect(Object.isFrozen(ticket)).toBe(true);
      expect(() => {
        ticket.passengerName = 'Modified Name';
      }).toThrow(TypeError);

      expect(() => {
        ticket.flightNumber = 'MV-999';
      }).toThrow(TypeError);

      expect(() => {
        ticket.newField = 'illegal';
      }).toThrow(TypeError);
    });
  });

  describe('TicketGenerator port', () => {
    test('generate() method should throw "Method not implemented."', async () => {
      const generator = new TicketGenerator();
      const ticket = new Ticket(validTicketData);

      await expect(generator.generate(ticket)).rejects.toThrow('Method not implemented.');
    });
  });
});
