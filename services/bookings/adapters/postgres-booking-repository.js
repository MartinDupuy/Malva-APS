const { Pool } = require('pg');
const { Booking } = require('../domain/booking');

class PostgresBookingRepository {
  constructor({ connectionString = process.env.DATABASE_URL } = {}) {
    if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL booking persistence');
    this.pool = new Pool({ connectionString });
    this.ready = this.pool.query(`CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, flight_instance_id TEXT NOT NULL, hold_id TEXT NOT NULL,
      passengers JSONB NOT NULL, status TEXT NOT NULL
    )`);
  }

  async create(booking) {
    await this.ready;
    await this.pool.query(
      `INSERT INTO bookings (id, flight_instance_id, hold_id, passengers, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET passengers = EXCLUDED.passengers, status = EXCLUDED.status`,
      [booking.id, booking.flightInstanceId, booking.holdId, JSON.stringify(booking.passengers), booking.status]
    );
    return booking;
  }

  async findById(bookingId) {
    await this.ready;
    const { rows } = await this.pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (!rows[0]) return null;
    return new Booking({
      id: rows[0].id,
      flightInstanceId: rows[0].flight_instance_id,
      holdId: rows[0].hold_id,
      passengers: rows[0].passengers,
      status: rows[0].status
    });
  }
}

module.exports = PostgresBookingRepository;