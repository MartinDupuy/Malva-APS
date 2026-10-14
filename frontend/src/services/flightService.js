const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la solicitud');
  return payload;
}

export const flightService = {
  async list() {
    return request('/flights');
  },

  async create(flight) {
    return request('/flights', { method: 'POST', body: JSON.stringify(flight) });
  },

  async update(id, flight) {
    return request(`/flights/${id}`, { method: 'PUT', body: JSON.stringify(flight) });
  },

  async cancel(id) {
    return request(`/flights/${id}`, { method: 'DELETE' });
  },
};
