class OccupancyReportController {
  constructor({ getOccupancyReport, pdfGenerator }) {
    this.getOccupancyReport = getOccupancyReport;
    this.pdfGenerator = pdfGenerator;
  }

  async json(request, response) {
    try {
      const report = await this.getOccupancyReport.execute(this._filters(request));
      return response.status(200).json(report);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }
  }

  async pdf(request, response) {
    try {
      const report = await this.getOccupancyReport.execute(this._filters(request));
      const document = await this.pdfGenerator.generate(report);
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="occupancy-report.pdf"'
      });
      return response.status(200).send(document);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }
  }

  _filters(request) {
    return {
      from: request.query.from,
      to: request.query.to,
      flightId: request.query.flightId || null,
      cabinClass: request.query.cabinClass || 'all'
    };
  }
}

module.exports = OccupancyReportController;