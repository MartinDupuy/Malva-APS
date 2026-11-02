'use strict';

const flightScheduleChangeTemplate = require('../../services/notifications/templates/flight-schedule-change');

describe('flightScheduleChangeTemplate', () => {
  const sampleData = {
    passengerName: 'Carlos Gardel',
    flightNumber: 'AR1234',
    origin: 'EZE',
    destination: 'COR',
    oldDepartureTime: '10:00',
    newDepartureTime: '14:30',
    oldArrivalTime: '11:30',
    newArrivalTime: '16:00',
  };

  test('returns subject with the flight number', () => {
    const { subject } = flightScheduleChangeTemplate(sampleData);
    expect(subject).toBe('Cambio de horario en su vuelo AR1234');
  });

  test('body contains the passenger name', () => {
    const { body } = flightScheduleChangeTemplate(sampleData);
    expect(body).toContain('Carlos Gardel');
  });

  test('body contains the old and new schedule times', () => {
    const { body } = flightScheduleChangeTemplate(sampleData);
    expect(body).toContain('10:00');
    expect(body).toContain('14:30');
    expect(body).toContain('11:30');
    expect(body).toContain('16:00');
  });

  test('body contains origin and destination airports', () => {
    const { body } = flightScheduleChangeTemplate(sampleData);
    expect(body).toContain('EZE → COR');
  });

  test('handles default / missing parameters gracefully', () => {
    const { subject, body } = flightScheduleChangeTemplate();
    expect(subject).toBe('Cambio de horario en su vuelo');
    expect(body).toContain('Pasajero');
    expect(body).toContain('Malva Airlines');
  });
});
