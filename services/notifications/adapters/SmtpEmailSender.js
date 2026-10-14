'use strict';

const nodemailer = require('nodemailer');
const EmailSender = require('../domain/EmailSender');

class SmtpEmailSender extends EmailSender {
  /**
   * @param {Object} [options]
   * @param {string} [options.host]
   * @param {number|string} [options.port]
   * @param {string} [options.user]
   * @param {string} [options.pass]
   * @param {string} [options.from]
   * @param {Object} [transporter] Optional injected Nodemailer transporter
   */
  constructor(options = {}, transporter = null) {
    super();

    this.from = options.from || process.env.SMTP_FROM || '"Malva Airlines" <no-reply@malvaairlines.com>';

    if (transporter) {
      this.transporter = transporter;
    } else {
      const host = options.host || process.env.SMTP_HOST;
      const port = Number(options.port || process.env.SMTP_PORT) || 587;
      const user = options.user || process.env.SMTP_USER;
      const pass = options.pass || process.env.SMTP_PASS;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  /**
   * Sends an email message via SMTP.
   * @param {import('../domain/EmailMessage')} emailMessage
   * @returns {Promise<{ success: boolean, messageId: string }>}
   */
  async send(emailMessage) {
    if (!emailMessage) {
      throw new Error('EmailMessage is required to send email');
    }

    const attachments = (emailMessage.attachments || []).map(att => ({
      filename: att.filename,
      content: att.content,
    }));

    const mailOptions = {
      from: this.from,
      to: emailMessage.to,
      subject: emailMessage.subject,
      html: emailMessage.body,
      text: emailMessage.body,
      attachments,
    };

    const info = await this.transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info && info.messageId ? info.messageId : undefined,
    };
  }
}

module.exports = SmtpEmailSender;
