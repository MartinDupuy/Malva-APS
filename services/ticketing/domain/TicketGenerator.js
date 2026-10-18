'use strict';

/**
 * TicketGenerator Interface (Port)
 *
 * In JS we don't have strict interfaces, so we define a class with methods that throw.
 * Adapters must implement this port.
 */
class TicketGenerator {
  /**
   * Generates a ticket document as a Buffer.
   * @param {import('./Ticket')} ticket - The ticket entity.
   * @returns {Promise<Buffer>}
   */
  async generate(ticket) {
    throw new Error('Method not implemented.');
  }
}

module.exports = TicketGenerator;
