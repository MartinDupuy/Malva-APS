const PDFDocument = require('pdfkit');

class PdfOccupancyReportGenerator {
  async generate(report) {
    if (!report) throw new Error('report is required to generate PDF');

    return new Promise((resolve, reject) => {
      try {
        const document = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks = [];
        document.on('data', chunk => chunks.push(chunk));
        document.on('end', () => resolve(Buffer.concat(chunks)));
        document.on('error', reject);

        document.font('Helvetica-Bold').fontSize(18).text('Malva Airlines - Occupancy Report');
        document.moveDown(0.5);
        document.font('Helvetica').fontSize(10)
          .text(`Period: ${report.filters.from} to ${report.filters.to}`)
          .text(`Flight: ${report.filters.flightId || 'All'}`)
          .text(`Class: ${report.filters.cabinClass}`);
        document.moveDown(1);

        document.font('Helvetica-Bold').fontSize(12).text('Summary');
        this._writeMetrics(document, report.totals.total);
        document.moveDown(1);

        document.font('Helvetica-Bold').fontSize(12).text('Details');
        document.moveDown(0.4);
        this._writeTableHeader(document);
        document.moveDown(0.5);

        for (const row of report.rows) {
          for (const [cabinClass, metrics] of Object.entries(row.classes)) {
            if (document.y > 740) {
              document.addPage();
              this._writeTableHeader(document);
              document.moveDown(0.5);
            }
            const rowY = document.y;
            document.font('Helvetica').fontSize(9)
              .text(`${row.flightNumber} / ${row.date}`, 40, rowY)
              .text(cabinClass, 180, rowY)
              .text(String(metrics.capacity), 270, rowY)
              .text(String(metrics.occupied), 340, rowY)
              .text(`${metrics.occupancyPercentage}%`, 420, rowY);
            document.moveDown(0.5);
          }
        }

        document.moveDown(1);
        document.font('Helvetica-Oblique').fontSize(8)
          .text('Generated from confirmed seat reservations.');
        document.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  _writeTableHeader(document) {
    const headerY = document.y;
    document.font('Helvetica-Bold').fontSize(9)
      .text('Flight / Date', 40, headerY)
      .text('Class', 180, headerY)
      .text('Capacity', 270, headerY)
      .text('Occupied', 340, headerY)
      .text('Rate', 420, headerY);
  }

  _writeMetrics(document, metrics) {
    document.font('Helvetica').fontSize(10)
      .text(`Capacity: ${metrics.capacity}`)
      .text(`Occupied: ${metrics.occupied}`)
      .text(`Available: ${metrics.available}`)
      .text(`Occupancy: ${metrics.occupancyPercentage}%`);
  }
}

module.exports = PdfOccupancyReportGenerator;