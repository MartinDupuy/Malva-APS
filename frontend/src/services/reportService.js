const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar el reporte');
  return payload;
}

export const reportService = {
  getOccupancy(filters, token) {
    const params = new URLSearchParams(filters);
    return request(`/reports/occupancy?${params}`, token);
  },

  async downloadOccupancyPdf(filters, token) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/reports/occupancy.pdf?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || 'No se pudo exportar el reporte');
    }
    return response.blob();
  }
};