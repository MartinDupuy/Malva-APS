'use strict';

/**
 * SeatReleaser Interface (Port)
 *
 * Defines the contract to release locked/reserved seats.
 * Adapters must implement this port.
 */
class SeatReleaser {
  /**
   * Releases locked seats for a given bookingId.
   * @param {string} bookingId
   * @returns {Promise<void>}
   */
  async releaseSeats(bookingId) {
    throw new Error('Method not implemented.');
  }
}

module.exports = SeatReleaser;
