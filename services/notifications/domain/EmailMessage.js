'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EmailMessage {
  /**
   * @param {Object} data
   * @param {string} data.to
   * @param {string} data.subject
   * @param {string} [data.body]
   * @param {Array<{ filename: string, content: Buffer }>} [data.attachments]
   */
  constructor(dataOrTo = {}, ...rest) {
    let data;
    if (typeof dataOrTo === 'object' && dataOrTo !== null) {
      data = { ...dataOrTo };
    } else {
      data = {
        to: dataOrTo,
        subject: rest[0],
        body: rest[1],
        attachments: rest[2],
      };
    }

    if (!data.to || typeof data.to !== 'string' || !EMAIL_REGEX.test(data.to.trim())) {
      throw new Error('to must be a valid email address');
    }

    if (!data.subject || (typeof data.subject === 'string' && data.subject.trim() === '')) {
      throw new Error('subject is required');
    }

    const rawAttachments = data.attachments || [];
    if (!Array.isArray(rawAttachments)) {
      throw new Error('attachments must be an array');
    }

    const frozenAttachments = rawAttachments.map(att => {
      if (!att || typeof att !== 'object') {
        throw new Error('Each attachment must be an object');
      }
      if (!att.filename || (typeof att.filename === 'string' && att.filename.trim() === '')) {
        throw new Error('Attachment filename is required');
      }
      if (!Buffer.isBuffer(att.content)) {
        throw new Error('Attachment content must be a Buffer');
      }

      return Object.freeze({
        filename: att.filename.trim(),
        content: att.content,
      });
    });

    this.to = data.to.trim();
    this.subject = typeof data.subject === 'string' ? data.subject.trim() : data.subject;
    this.body = data.body || '';
    this.attachments = Object.freeze(frozenAttachments);

    Object.freeze(this);
  }
}

module.exports = EmailMessage;
