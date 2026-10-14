'use strict';

/**
 * InvoiceGenerator Interface (Port)
 *
 * In JS we don't have strict interfaces, so we define a class with methods that throw.
 * Adapters must implement this port.
 */
class InvoiceGenerator {
  /**
   * Generates an invoice document as a Buffer.
   * @param {import('./Invoice')} invoice - The invoice entity.
   * @returns {Promise<Buffer>}
   */
  async generate(invoice) {
    throw new Error('Method not implemented.');
  }
}

module.exports = InvoiceGenerator;
