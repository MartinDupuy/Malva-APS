'use strict';

const nodemailer = require('nodemailer');
const SmtpEmailSender = require('../../services/notifications/adapters/SmtpEmailSender');
const EmailSender = require('../../services/notifications/domain/EmailSender');
const EmailMessage = require('../../services/notifications/domain/EmailMessage');

jest.mock('nodemailer');

describe('SmtpEmailSender Adapter', () => {
  let mockSendMail;
  let mockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail = jest.fn();
    mockTransporter = {
      sendMail: mockSendMail,
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  test('should be an instance of EmailSender (hexagonal port)', () => {
    const sender = new SmtpEmailSender();
    expect(sender).toBeInstanceOf(EmailSender);
  });

  test('should initialize nodemailer transport using provided options or environment variables', () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = 'testuser';
    process.env.SMTP_PASS = 'testpass';

    new SmtpEmailSender();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 2525,
      secure: false,
      auth: {
        user: 'testuser',
        pass: 'testpass',
      },
    });
  });

  test('should call sendMail with correct parameters (to, subject, html, attachments) and return success with messageId', async () => {
    mockSendMail.mockResolvedValueOnce({
      messageId: '<msg-12345@malvaairlines.com>',
      response: '250 OK',
    });

    const sender = new SmtpEmailSender({ from: 'no-reply@malva.com' });
    const buffer = Buffer.from('%PDF-dummy');
    const emailMessage = new EmailMessage({
      to: 'client@example.com',
      subject: 'Tu pasaje y factura',
      body: '<p>Gracias por tu compra</p>',
      attachments: [{ filename: 'ticket.pdf', content: buffer }],
    });

    const result = await sender.send(emailMessage);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'no-reply@malva.com',
      to: 'client@example.com',
      subject: 'Tu pasaje y factura',
      html: '<p>Gracias por tu compra</p>',
      text: '<p>Gracias por tu compra</p>',
      attachments: [{ filename: 'ticket.pdf', content: buffer }],
    });

    expect(result).toEqual({
      success: true,
      messageId: '<msg-12345@malvaairlines.com>',
    });
  });

  test('should correctly map attachments to nodemailer format', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: 'msg-abc' });

    const sender = new SmtpEmailSender();
    const ticketBuf = Buffer.from('ticket data');
    const invoiceBuf = Buffer.from('invoice data');

    const emailMessage = new EmailMessage({
      to: 'passenger@example.com',
      subject: 'Documentos de Viaje',
      body: 'Adjuntos',
      attachments: [
        { filename: 'ticket.pdf', content: ticketBuf },
        { filename: 'invoice.pdf', content: invoiceBuf },
      ],
    });

    await sender.send(emailMessage);

    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.attachments).toEqual([
      { filename: 'ticket.pdf', content: ticketBuf },
      { filename: 'invoice.pdf', content: invoiceBuf },
    ]);
  });

  test('should throw an exception when sendMail fails (simulating SMTP error)', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Connection timeout to SMTP server'));

    const sender = new SmtpEmailSender();
    const emailMessage = new EmailMessage({
      to: 'passenger@example.com',
      subject: 'Fallo SMTP',
      body: 'Texto',
    });

    await expect(sender.send(emailMessage)).rejects.toThrow('Connection timeout to SMTP server');
  });

  test('should throw error when emailMessage is not provided', async () => {
    const sender = new SmtpEmailSender();
    await expect(sender.send(null)).rejects.toThrow('EmailMessage is required to send email');
  });
});
