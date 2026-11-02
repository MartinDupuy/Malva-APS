const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la solicitud');
  return payload;
}

export const flightService = {
  async list(token) {
    return request('/flights', token);
  },

  async create(flight, token) {
    return request('/flights', token, { method: 'POST', body: JSON.stringify(flight) });
  },

  async update(id, flight, token) {
    return request(`/flights/${id}`, token, { method: 'PUT', body: JSON.stringify(flight) });
  },

  async cancel(id, token) {
    return request(`/flights/${id}`, token, { method: 'DELETE' });
  },
};
