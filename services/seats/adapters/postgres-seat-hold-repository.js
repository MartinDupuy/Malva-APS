const { Pool } = require('pg');
const { HOLD_STATUSES, SeatHold } = require('../domain/seat-hold');

class PostgresSeatHoldRepository {
  constructor({ connectionString = process.env.DATABASE_URL, seatsByFlightInstance, ttlMs = 600000 } = {}) {
    if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL seat persistence');
    this.pool = new Pool({ connectionString });
    this.seatsByFlightInstance = seatsByFlightInstance;
    this.ttlMs = ttlMs;
    this.ready = this._initialize();
  }

  async _initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS seat_holds (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        flight_instance_id TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS seat_hold_items (
        hold_id TEXT REFERENCES seat_holds(id) ON DELETE CASCADE,
        flight_instance_id TEXT NOT NULL,
        seat_id TEXT NOT NULL,
        status TEXT NOT NULL,
        PRIMARY KEY (hold_id, seat_id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS active_seat_hold
        ON seat_hold_items (flight_instance_id, seat_id) WHERE status = 'ACTIVE';
    `);
  }

  async getAvailability(flightInstanceId) {
    await this.ready;
    const { rows } = await this.pool.query(
      `SELECT seat_id FROM seat_hold_items
       WHERE flight_instance_id = $1 AND status = 'ACTIVE'
       AND EXISTS (SELECT 1 FROM seat_holds h WHERE h.id = hold_id AND h.expires_at > NOW())`,
      [flightInstanceId]
    );
    const held = new Set(rows.map(row => row.seat_id));
    return (this.seatsByFlightInstance.get(flightInstanceId) || []).map(seat => ({
      seat,
      status: held.has(seat.id) ? 'HELD' : 'AVAILABLE'
    }));
  }

  async createHold({ bookingId, flightInstanceId, seatIds }) {
    await this.ready;
    const client = await this.pool.connect();
    const id = require('crypto').randomUUID();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE seat_holds SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at <= NOW()");
      const expiresAt = new Date(Date.now() + this.ttlMs);
      await client.query(
        'INSERT INTO seat_holds (id, booking_id, flight_instance_id, expires_at, status) VALUES ($1, $2, $3, $4, $5)',
        [id, bookingId, flightInstanceId, expiresAt, HOLD_STATUSES.ACTIVE]
      );
      for (const seatId of seatIds) {
        await client.query(
          'INSERT INTO seat_hold_items (hold_id, flight_instance_id, seat_id, status) VALUES ($1, $2, $3, $4)',
          [id, flightInstanceId, seatId, HOLD_STATUSES.ACTIVE]
        );
      }
      await client.query('COMMIT');
      return new SeatHold({ id, bookingId, flightInstanceId, seatIds, expiresAt });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') throw new Error('one or more seats are already held');
      throw error;
    } finally {
      client.release();
    }
  }

  async getById(holdId) {
    await this.ready;
    const result = await this.pool.query('SELECT * FROM seat_holds WHERE id = $1', [holdId]);
    if (!result.rows[0]) return null;
    const items = await this.pool.query('SELECT seat_id FROM seat_hold_items WHERE hold_id = $1', [holdId]);
    return new SeatHold({ ...result.rows[0], seatIds: items.rows.map(row => row.seat_id), expiresAt: result.rows[0].expires_at });
  }

  async confirm(holdId) {
    await this.ready;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        "UPDATE seat_holds SET status = 'CONFIRMED' WHERE id = $1 AND status = 'ACTIVE' AND expires_at > NOW() RETURNING *",
        [holdId]
      );
      if (!result.rows[0]) throw new Error('seat hold has expired or is no longer active');
      await client.query("UPDATE seat_hold_items SET status = 'CONFIRMED' WHERE hold_id = $1", [holdId]);
      await client.query('COMMIT');
      return this.getById(holdId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancel(holdId) {
    await this.ready;
    await this.pool.query("UPDATE seat_holds SET status = 'CANCELLED' WHERE id = $1 AND status = 'ACTIVE'", [holdId]);
    await this.pool.query("UPDATE seat_hold_items SET status = 'CANCELLED' WHERE hold_id = $1 AND status = 'ACTIVE'", [holdId]);
    return this.getById(holdId);
  }
}

module.exports = PostgresSeatHoldRepository;