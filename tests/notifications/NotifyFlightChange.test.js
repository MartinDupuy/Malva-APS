'use strict';

const NotifyFlightChange = require('../../services/notifications/use-cases/notify-flight-change');
const EmailMessage = require('../../services/notifications/domain/EmailMessage');

describe('NotifyFlightChange use case', () => {
  let mockBookingRepository;
  let mockEmailSender;
  let notifyFlightChange;

  const sampleFlight = {
    id: 'flight-uuid-1',
    flightNumber: 'AR1300',
    originAirport: 'EZE',
    destinationAirport: 'MIA',
    departureTime: '23:30',
    arrivalTime: '07:15',
  };

  const samplePreviousFlight = {
    id: 'flight-uuid-1',
    flightNumber: 'AR1300',
    originAirport: 'EZE',
    destinationAirport: 'MIA',
    departureTime: '21:00',
    arrivalTime: '04:45',
  };

  beforeEach(() => {
    mockBookingRepository = {
      findByFlightInstanceId: jest.fn(),
    };
    mockEmailSender = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
    };
    notifyFlightChange = new NotifyFlightChange({
      bookingRepository: mockBookingRepository,
      emailSender: mockEmailSender,
    });
  });

  test('requires bookingRepository and emailSender in constructor', () => {
    expect(() => new NotifyFlightChange()).toThrow('bookingRepository is required');
    expect(() => new NotifyFlightChange({ bookingRepository: {} })).toThrow('emailSender is required');
  });

  test('returns { sent: 0, failed: 0 } when flight is not provided or has no id', async () => {
    const res = await notifyFlightChange.execute();
    expect(res).toEqual({ sent: 0, failed: 0 });
    expect(mockBookingRepository.findByFlightInstanceId).not.toHaveBeenCalled();
  });

  test('throws error for invalid changeType', async () => {
    await expect(
      notifyFlightChange.execute({ flight: sampleFlight, changeType: 'UNKNOWN' })
    ).rejects.toThrow('Invalid changeType: UNKNOWN');
  });

  test('returns { sent: 0, failed: 0 } when no bookings exist for the flight', async () => {
    mockBookingRepository.findByFlightInstanceId.mockResolvedValue([]);

    const result = await notifyFlightChange.execute({
      flight: sampleFlight,
      previousFlight: samplePreviousFlight,
      changeType: 'SCHEDULE_CHANGE',
    });

    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(mockBookingRepository.findByFlightInstanceId).toHaveBeenCalledWith('flight-uuid-1');
    expect(mockEmailSender.send).not.toHaveBeenCalled();
  });

  test('sends email to all passengers of confirmed bookings with schedule change template', async () => {
    mockBookingRepository.findByFlightInstanceId.mockResolvedValue([
      {
        id: 'booking-1',
        passengers: [
          { name: 'Lionel Messi', email: 'lionel@messi.com', seatId: 'E1' },
          { name: 'Antonela Roccuzzo', email: 'antonela@messi.com', seatId: 'E2' },
        ],
      },
    ]);

    const result = await notifyFlightChange.execute({
      flight: sampleFlight,
      previousFlight: samplePreviousFlight,
      changeType: 'SCHEDULE_CHANGE',
    });

    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(mockEmailSender.send).toHaveBeenCalledTimes(2);

    const firstCallArg = mockEmailSender.send.mock.calls[0][0];
    expect(firstCallArg).toBeInstanceOf(EmailMessage);
    expect(firstCallArg.to).toBe('lionel@messi.com');
    expect(firstCallArg.subject).toBe('Cambio de horario en su vuelo AR1300');
    expect(firstCallArg.body).toContain('Lionel Messi');
    expect(firstCallArg.body).toContain('21:00'); // old
    expect(firstCallArg.body).toContain('23:30'); // new

    const secondCallArg = mockEmailSender.send.mock.calls[1][0];
    expect(secondCallArg.to).toBe('antonela@messi.com');
  });

  test('sends email to all passengers of confirmed bookings with cancellation template', async () => {
    mockBookingRepository.findByFlightInstanceId.mockResolvedValue([
      {
        id: 'booking-2',
        passengers: [
          { name: 'Angel Di Maria', email: 'angel@fideo.com', seatId: 'E3' },
        ],
      },
    ]);

    const result = await notifyFlightChange.execute({
      flight: sampleFlight,
      changeType: 'CANCELLATION',
    });

    expect(result).toEqual({ sent: 1, failed: 0 });
    expect(mockEmailSender.send).toHaveBeenCalledTimes(1);

    const callArg = mockEmailSender.send.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(EmailMessage);
    expect(callArg.to).toBe('angel@fideo.com');
    expect(callArg.subject).toBe('Cancelación de su vuelo AR1300');
    expect(callArg.body).toContain('Angel Di Maria');
    expect(callArg.body).toContain('cancelado');
  });

  test('sends emails across multiple bookings for the same flight', async () => {
    mockBookingRepository.findByFlightInstanceId.mockResolvedValue([
      {
        id: 'b-1',
        passengers: [{ name: 'Pasajero 1', email: 'p1@test.com' }],
      },
      {
        id: 'b-2',
        passengers: [{ name: 'Pasajero 2', email: 'p2@test.com' }],
      },
      {
        id: 'b-3',
        passengers: [{ name: 'Pasajero 3', email: 'p3@test.com' }],
      },
    ]);

    const result = await notifyFlightChange.execute({
      flight: sampleFlight,
      changeType: 'CANCELLATION',
    });

    expect(result).toEqual({ sent: 3, failed: 0 });
    expect(mockEmailSender.send).toHaveBeenCalledTimes(3);
  });

  test('uses Promise.allSettled and reports failures without crashing', async () => {
    mockBookingRepository.findByFlightInstanceId.mockResolvedValue([
      {
        id: 'b-1',
        passengers: [
          { name: 'Good Email', email: 'good@test.com' },
          { name: 'Failing Email', email: 'fail@test.com' },
        ],
      },
    ]);

    mockEmailSender.send
      .mockResolvedValueOnce({ messageId: 'ok' })
      .mockRejectedValueOnce(new Error('SMTP connection refused'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await notifyFlightChange.execute({
      flight: sampleFlight,
      changeType: 'CANCELLATION',
    });

    expect(result).toEqual({ sent: 1, failed: 1 });
    consoleSpy.mockRestore();
  });
});
