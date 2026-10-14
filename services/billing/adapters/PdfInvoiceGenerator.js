'use strict';

const PDFDocument = require('pdfkit');
const InvoiceGenerator = require('../domain/InvoiceGenerator');
const Money = require('../../payments/domain/Money');

class PdfInvoiceGenerator extends InvoiceGenerator {
  /**
   * Generates a PDF buffer for a given Invoice entity.
   * @param {import('../domain/Invoice')} invoice
   * @returns {Promise<Buffer>}
   */
  async generate(invoice) {
    if (!invoice) {
      throw new Error('Invoice is required to generate PDF');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        // Header
        doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('Factura — Malva Airlines', { align: 'center' });
        doc.moveDown(1.5);

        // Invoice Metadata
        doc.font('Helvetica-Bold').fontSize(12).text('Datos del Comprobante:');
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(11);
        doc.text(`Número de Factura: ${invoice.invoiceId}`);
        doc.text(`Código de Reserva: ${invoice.bookingId}`);
        const issuedDateStr =
          invoice.issuedAt instanceof Date
            ? invoice.issuedAt.toLocaleString('es-AR', { timeZone: 'UTC' })
            : String(invoice.issuedAt);
        doc.text(`Fecha de Emisión: ${issuedDateStr}`);
        doc.text(`Moneda: ${invoice.currency}`);
        doc.moveDown(1.2);

        // Customer details
        doc.font('Helvetica-Bold').fontSize(12).text('Datos del Cliente:');
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(11);
        doc.text(`Nombre: ${invoice.customerName}`);
        doc.text(`Correo Electrónico: ${invoice.customerEmail}`);
        doc.moveDown(1.5);

        // Items table header
        doc.font('Helvetica-Bold').fontSize(12).text('Detalle de Conceptos Facturados:');
        doc.moveDown(0.8);

        // Table headers layout
        const startX = 50;
        const colDescX = startX;
        const colQtyX = 300;
        const colPriceX = 370;
        const colSubtotalX = 460;

        let currentY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Descripción', colDescX, currentY);
        doc.text('Cant.', colQtyX, currentY);
        doc.text('Precio Unit.', colPriceX, currentY);
        doc.text('Subtotal', colSubtotalX, currentY);

        doc.moveDown(0.5);
        currentY = doc.y;
        doc
          .moveTo(colDescX, currentY)
          .lineTo(colSubtotalX + 80, currentY)
          .stroke();
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica').fontSize(10);
        for (const item of invoice.items) {
          currentY = doc.y;
          const unitPriceAmount =
            item.unitPrice instanceof Money ? item.unitPrice.amount : item.unitPrice;
          const subtotalAmount = unitPriceAmount * item.quantity;

          const unitPriceFormatted = `${(unitPriceAmount / 100).toFixed(2)} ${invoice.currency}`;
          const subtotalFormatted = `${(subtotalAmount / 100).toFixed(2)} ${invoice.currency}`;

          doc.text(item.description, colDescX, currentY, { width: 240 });
          doc.text(String(item.quantity), colQtyX, currentY);
          doc.text(unitPriceFormatted, colPriceX, currentY);
          doc.text(subtotalFormatted, colSubtotalX, currentY);
          doc.moveDown(0.8);
        }

        doc.moveDown(0.5);
        currentY = doc.y;
        doc
          .moveTo(colDescX, currentY)
          .lineTo(colSubtotalX + 80, currentY)
          .stroke();
        doc.moveDown(0.8);

        // Total
        const totalFormatted = `${(invoice.totalAmount.amount / 100).toFixed(2)} ${invoice.currency}`;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`TOTAL FACTURADO: ${totalFormatted}`, colPriceX - 40, doc.y, { align: 'right' });

        doc.moveDown(2);

        // Footer
        doc
          .fontSize(9)
          .font('Helvetica-Oblique')
          .text('Comprobante emitido electrónicamente por Malva Airlines S.A. — IVA Responsable Inscripto', {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PdfInvoiceGenerator;
