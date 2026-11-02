const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || 'No se pudo completar la reserva.');
    error.status = response.status;
    throw error;
  }
  return body;
}

export const getSeatAvailability = flightInstanceId => request(`/flights/${encodeURIComponent(flightInstanceId)}/availability`);

export const createBooking = (flightInstanceId, passengers, token) =>
  request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ flightInstanceId, passengers })
  });

export const confirmBooking = (bookingId, token) =>
  request(`/bookings/${bookingId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
