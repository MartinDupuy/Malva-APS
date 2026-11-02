'use strict';

const flightCancellationTemplate = require('../../services/notifications/templates/flight-cancellation');

describe('flightCancellationTemplate', () => {
  const sampleData = {
    passengerName: 'Maria Elena Walsh',
    flightNumber: 'AR5678',
    origin: 'AEP',
    destination: 'MDZ',
    departureTime: '08:15',
  };

  test('returns subject with the flight number', () => {
    const { subject } = flightCancellationTemplate(sampleData);
    expect(subject).toBe('Cancelación de su vuelo AR5678');
  });

  test('body contains the passenger name', () => {
    const { body } = flightCancellationTemplate(sampleData);
    expect(body).toContain('Maria Elena Walsh');
  });

  test('body contains origin, destination and departure time', () => {
    const { body } = flightCancellationTemplate(sampleData);
    expect(body).toContain('AR5678');
    expect(body).toContain('AEP → MDZ');
    expect(body).toContain('08:15');
  });

  test('body contains rescheduling and refund information', () => {
    const { body } = flightCancellationTemplate(sampleData);
    expect(body).toContain('Reprogramación');
    expect(body).toContain('Reembolso');
  });

  test('handles default / missing parameters gracefully', () => {
    const { subject, body } = flightCancellationTemplate();
    expect(subject).toBe('Cancelación de su vuelo');
    expect(body).toContain('Pasajero');
    expect(body).toContain('Malva Airlines');
  });
});
