import { useState } from 'react';
import { reportService } from '../services/reportService';

export function useOccupancyReport(token) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async filters => {
    setLoading(true);
    setError('');
    try {
      const nextReport = await reportService.getOccupancy(filters, token);
      setReport(nextReport);
      return nextReport;
    } catch (requestError) {
      setError(requestError.message);
      setReport(null);
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async filters => {
    const blob = await reportService.downloadOccupancyPdf(filters, token);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `occupancy-report-${filters.from}-${filters.to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return { report, loading, error, loadReport, downloadPdf };
}