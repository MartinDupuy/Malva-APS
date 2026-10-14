'use strict';

const Invoice = require('../../services/billing/domain/Invoice');
const InvoiceGenerator = require('../../services/billing/domain/InvoiceGenerator');
const Money = require('../../services/payments/domain/Money');

describe('Invoice Entity and InvoiceGenerator Port', () => {
  const sampleItems = [
    { description: 'Flight Ticket - Economy', quantity: 2, unitPrice: 5000 },
    { description: 'Baggage Fee', quantity: 1, unitPrice: 2000 },
  ]; // Total = 2*5000 + 1*2000 = 12000

  const validInvoiceData = {
    invoiceId: 'INV-1001',
    bookingId: 'BOOKING-999',
    customerName: 'Jane Doe',
    customerEmail: 'jane.doe@example.com',
    items: sampleItems,
    totalAmount: new Money(12000, 'USD'),
    currency: 'USD',
    issuedAt: new Date('2026-10-14T10:00:00Z'),
  };

  describe('Invoice creation', () => {
    test('should create a valid invoice and verify all fields', () => {
      const invoice = new Invoice(validInvoiceData);

      expect(invoice.invoiceId).toBe('INV-1001');
      expect(invoice.bookingId).toBe('BOOKING-999');
      expect(invoice.customerName).toBe('Jane Doe');
      expect(invoice.customerEmail).toBe('jane.doe@example.com');
      expect(invoice.items).toHaveLength(2);
      expect(invoice.items[0].description).toBe('Flight Ticket - Economy');
      expect(invoice.items[0].quantity).toBe(2);
      expect(invoice.items[0].unitPrice).toBeInstanceOf(Money);
      expect(invoice.items[0].unitPrice.amount).toBe(5000);
      expect(invoice.totalAmount).toBeInstanceOf(Money);
      expect(invoice.totalAmount.amount).toBe(12000);
      expect(invoice.currency).toBe('USD');
      expect(invoice.issuedAt).toEqual(new Date('2026-10-14T10:00:00Z'));
    });

    test('should auto-generate invoiceId when not provided', () => {
      const { invoiceId, ...dataWithoutInvoiceId } = validInvoiceData;
      const invoice = new Invoice(dataWithoutInvoiceId);

      expect(typeof invoice.invoiceId).toBe('string');
      expect(invoice.invoiceId.length).toBeGreaterThan(0);
    });

    test('should auto-generate issuedAt when not provided', () => {
      const { issuedAt, ...dataWithoutIssuedAt } = validInvoiceData;
      const before = Date.now();
      const invoice = new Invoice(dataWithoutIssuedAt);
      const after = Date.now();

      expect(invoice.issuedAt).toBeInstanceOf(Date);
      expect(invoice.issuedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(invoice.issuedAt.getTime()).toBeLessThanOrEqual(after);
    });

    test('should accept items with Money instances as unitPrice', () => {
      const itemsWithMoney = [
        { description: 'Seat Selection', quantity: 1, unitPrice: new Money(12000, 'USD') },
      ];
      const invoice = new Invoice({
        ...validInvoiceData,
        items: itemsWithMoney,
        totalAmount: new Money(12000, 'USD'),
      });

      expect(invoice.items[0].unitPrice.amount).toBe(12000);
    });

    test('should support positional arguments', () => {
      const invoice = new Invoice(
        'INV-POS',
        'BOOK-POS',
        'John Smith',
        'john@example.com',
        [{ description: 'Single Ticket', quantity: 1, unitPrice: 8000 }],
        new Money(8000, 'USD'),
        'USD',
        new Date('2026-10-14T09:00:00Z')
      );

      expect(invoice.invoiceId).toBe('INV-POS');
      expect(invoice.bookingId).toBe('BOOK-POS');
      expect(invoice.customerName).toBe('John Smith');
      expect(invoice.customerEmail).toBe('john@example.com');
      expect(invoice.totalAmount.amount).toBe(8000);
    });
  });

  describe('Validation', () => {
    test('should throw error if items is empty', () => {
      expect(() => new Invoice({ ...validInvoiceData, items: [] })).toThrow('items must be a non-empty array');
    });

    test('should throw error if items is not an array', () => {
      expect(() => new Invoice({ ...validInvoiceData, items: null })).toThrow('items must be a non-empty array');
    });

    test('should throw error if customerEmail has invalid format', () => {
      const invalidEmails = ['invalid', 'plainaddress', '@missingusername.com', 'user@.com', 'user@domain'];
      for (const email of invalidEmails) {
        expect(() => new Invoice({ ...validInvoiceData, customerEmail: email })).toThrow(
          'customerEmail must be a valid email address'
        );
      }
    });

    test('should throw error if bookingId is missing or empty', () => {
      expect(() => new Invoice({ ...validInvoiceData, bookingId: '' })).toThrow('bookingId is required');
      expect(() => new Invoice({ ...validInvoiceData, bookingId: null })).toThrow('bookingId is required');
    });

    test('should throw error if customerName is missing or empty', () => {
      expect(() => new Invoice({ ...validInvoiceData, customerName: '   ' })).toThrow('customerName is required');
      expect(() => new Invoice({ ...validInvoiceData, customerName: null })).toThrow('customerName is required');
    });

    test('should throw error if totalAmount does not match the sum of items', () => {
      expect(
        () =>
          new Invoice({
            ...validInvoiceData,
            totalAmount: new Money(99999, 'USD'),
          })
      ).toThrow(/does not match sum of items/);
    });

    test('should throw error if an item description is empty', () => {
      expect(
        () =>
          new Invoice({
            ...validInvoiceData,
            items: [{ description: '', quantity: 1, unitPrice: 12000 }],
          })
      ).toThrow('Item description is required');
    });

    test('should throw error if an item quantity is not a positive integer', () => {
      expect(
        () =>
          new Invoice({
            ...validInvoiceData,
            items: [{ description: 'Test', quantity: 0, unitPrice: 12000 }],
          })
      ).toThrow('Item quantity must be a positive integer');

      expect(
        () =>
          new Invoice({
            ...validInvoiceData,
            items: [{ description: 'Test', quantity: -1, unitPrice: 12000 }],
          })
      ).toThrow('Item quantity must be a positive integer');
    });
  });

  describe('Immutability and deep freeze', () => {
    test('should be deeply frozen (entity, items array, and item objects)', () => {
      const invoice = new Invoice(validInvoiceData);

      expect(Object.isFrozen(invoice)).toBe(true);
      expect(Object.isFrozen(invoice.items)).toBe(true);
      expect(Object.isFrozen(invoice.items[0])).toBe(true);

      expect(() => {
        invoice.customerName = 'Changed Name';
      }).toThrow(TypeError);

      expect(() => {
        invoice.items.push({ description: 'Extra', quantity: 1, unitPrice: 100 });
      }).toThrow(TypeError);

      expect(() => {
        invoice.items[0].quantity = 999;
      }).toThrow(TypeError);
    });
  });

  describe('InvoiceGenerator port', () => {
    test('generate() method should throw "Method not implemented."', async () => {
      const generator = new InvoiceGenerator();
      const invoice = new Invoice(validInvoiceData);

      await expect(generator.generate(invoice)).rejects.toThrow('Method not implemented.');
    });
  });
});
