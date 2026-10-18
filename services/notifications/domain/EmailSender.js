'use strict';

/**
 * EmailSender Interface (Port)
 *
 * In JS we don't have strict interfaces, so we define a class with methods that throw.
 * Adapters must implement this port.
 */
class EmailSender {
  /**
   * Sends an email message.
   * @param {import('./EmailMessage')} emailMessage - The email message to send.
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async send(emailMessage) {
    throw new Error('Method not implemented.');
  }
}

module.exports = EmailSender;
