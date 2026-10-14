'use strict';

const EmailMessage = require('../../services/notifications/domain/EmailMessage');
const EmailSender = require('../../services/notifications/domain/EmailSender');

describe('EmailMessage Value Object and EmailSender Port', () => {
  const validMessageData = {
    to: 'passenger@example.com',
    subject: 'Tu pasaje electrónico — Malva Airlines',
    body: '<h1>Gracias por tu compra</h1><p>Adjunto encontrarás tu pasaje.</p>',
  };

  describe('EmailMessage creation', () => {
    test('should create a valid EmailMessage without attachments', () => {
      const message = new EmailMessage(validMessageData);

      expect(message.to).toBe('passenger@example.com');
      expect(message.subject).toBe('Tu pasaje electrónico — Malva Airlines');
      expect(message.body).toBe('<h1>Gracias por tu compra</h1><p>Adjunto encontrarás tu pasaje.</p>');
      expect(message.attachments).toEqual([]);
    });

    test('should create a valid EmailMessage with attachments', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 simulated pdf');
      const attachments = [
        { filename: 'ticket.pdf', content: pdfBuffer },
        { filename: 'invoice.pdf', content: pdfBuffer },
      ];

      const message = new EmailMessage({
        ...validMessageData,
        attachments,
      });

      expect(message.attachments).toHaveLength(2);
      expect(message.attachments[0].filename).toBe('ticket.pdf');
      expect(message.attachments[0].content).toEqual(pdfBuffer);
      expect(message.attachments[1].filename).toBe('invoice.pdf');
      expect(message.attachments[1].content).toEqual(pdfBuffer);
    });

    test('should support positional arguments', () => {
      const buffer = Buffer.from('test');
      const message = new EmailMessage(
        'user@example.com',
        'Hello World',
        'Body content',
        [{ filename: 'file.txt', content: buffer }]
      );

      expect(message.to).toBe('user@example.com');
      expect(message.subject).toBe('Hello World');
      expect(message.body).toBe('Body content');
      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0].filename).toBe('file.txt');
    });

    test('should default body to empty string if not provided', () => {
      const message = new EmailMessage({
        to: 'user@example.com',
        subject: 'Notification',
      });

      expect(message.body).toBe('');
      expect(message.attachments).toEqual([]);
    });
  });

  describe('Validation', () => {
    test('should throw error when "to" has an invalid email format', () => {
      const invalidEmails = ['', '   ', 'notanemail', 'user@', '@domain.com', 'user@domain', null, undefined];
      for (const email of invalidEmails) {
        expect(() => new EmailMessage({ ...validMessageData, to: email })).toThrow(
          'to must be a valid email address'
        );
      }
    });

    test('should throw error when "subject" is missing or empty', () => {
      expect(() => new EmailMessage({ ...validMessageData, subject: '' })).toThrow('subject is required');
      expect(() => new EmailMessage({ ...validMessageData, subject: '   ' })).toThrow('subject is required');
      expect(() => new EmailMessage({ ...validMessageData, subject: null })).toThrow('subject is required');
    });

    test('should throw error when "attachments" is not an array', () => {
      expect(() => new EmailMessage({ ...validMessageData, attachments: 'invalid' })).toThrow(
        'attachments must be an array'
      );
    });

    test('should throw error when attachment is missing filename', () => {
      expect(
        () =>
          new EmailMessage({
            ...validMessageData,
            attachments: [{ filename: '', content: Buffer.from('data') }],
          })
      ).toThrow('Attachment filename is required');
    });

    test('should throw error when attachment content is not a Buffer', () => {
      expect(
        () =>
          new EmailMessage({
            ...validMessageData,
            attachments: [{ filename: 'ticket.pdf', content: 'not-a-buffer' }],
          })
      ).toThrow('Attachment content must be a Buffer');
    });
  });

  describe('Immutability', () => {
    test('should freeze the EmailMessage instance and its attachments', () => {
      const message = new EmailMessage({
        ...validMessageData,
        attachments: [{ filename: 'ticket.pdf', content: Buffer.from('dummy') }],
      });

      expect(Object.isFrozen(message)).toBe(true);
      expect(Object.isFrozen(message.attachments)).toBe(true);
      expect(Object.isFrozen(message.attachments[0])).toBe(true);

      expect(() => {
        message.to = 'other@example.com';
      }).toThrow(TypeError);

      expect(() => {
        message.subject = 'New subject';
      }).toThrow(TypeError);

      expect(() => {
        message.attachments.push({ filename: 'new.pdf', content: Buffer.from('') });
      }).toThrow(TypeError);

      expect(() => {
        message.attachments[0].filename = 'modified.pdf';
      }).toThrow(TypeError);
    });
  });

  describe('EmailSender port', () => {
    test('send() method should throw "Method not implemented."', async () => {
      const sender = new EmailSender();
      const message = new EmailMessage(validMessageData);

      await expect(sender.send(message)).rejects.toThrow('Method not implemented.');
    });
  });
});
