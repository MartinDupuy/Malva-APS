'use strict';

const PdfInvoiceGenerator = require('../../services/billing/adapters/PdfInvoiceGenerator');
const InvoiceGenerator = require('../../services/billing/domain/InvoiceGenerator');
const Invoice = require('../../services/billing/domain/Invoice');
const Money = require('../../services/payments/domain/Money');

describe('PdfInvoiceGenerator Adapter', () => {
  let generator;

  beforeEach(() => {
    generator = new PdfInvoiceGenerator();
  });

  test('should be an instance of InvoiceGenerator (hexagonal port)', () => {
    expect(generator).toBeInstanceOf(InvoiceGenerator);
  });

  test('should generate a valid non-empty PDF Buffer for a valid Invoice', async () => {
    const invoice = new Invoice({
      invoiceId: 'INV-2026-001',
      bookingId: 'BK-777',
      customerName: 'María Eugenia Vidal',
      customerEmail: 'maria.vidal@example.com',
      items: [
        { description: 'Pasaje Buenos Aires - Bariloche', quantity: 1, unitPrice: 35000 },
      ],
      totalAmount: new Money(35000, 'USD'),
      currency: 'USD',
      issuedAt: new Date('2026-10-14T10:00:00Z'),
    });

    const pdfBuffer = await generator.generate(invoice);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(500);
  });

  test('should verify that generated Buffer starts with PDF magic number (%PDF)', async () => {
    const invoice = new Invoice({
      bookingId: 'BK-100',
      customerName: 'Juan Carlos Batman',
      customerEmail: 'batman@example.com',
      items: [
        { description: 'Vuelo Ida', quantity: 1, unitPrice: 10000 },
      ],
      totalAmount: 10000,
    });

    const pdfBuffer = await generator.generate(invoice);

    const magic = pdfBuffer.subarray(0, 4).toString('ascii');
    expect(magic).toBe('%PDF');
  });

  test('should generate invoice with multiple items (multiple tickets + boarding tax) correctly', async () => {
    const items = [
      { description: 'Pasaje Economy — Adulto', quantity: 3, unitPrice: 20000 }, // 60000
      { description: 'Tasa de Embarque Aeroportuaria', quantity: 3, unitPrice: 2500 }, // 7500
      { description: 'Equipaje en Bodega 23kg', quantity: 1, unitPrice: 5000 }, // 5000
    ]; // Total = 60000 + 7500 + 5000 = 72500

    const invoice = new Invoice({
      invoiceId: 'INV-MULTI-09',
      bookingId: 'BK-GRP-500',
      customerName: 'Familia González Peña',
      customerEmail: 'gonzalez.pena@example.com',
      items,
      totalAmount: new Money(72500, 'USD'),
      currency: 'USD',
    });

    const pdfBuffer = await generator.generate(invoice);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  test('should throw error when invoice is not provided', async () => {
    await expect(generator.generate(null)).rejects.toThrow('Invoice is required to generate PDF');
  });
});
