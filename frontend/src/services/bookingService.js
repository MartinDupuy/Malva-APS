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

export const getSeatAvailability = flightId => request(`/flights/${flightId}/availability`);
export const createBooking = (flightInstanceId, passengers) => request('/bookings', {
  method: 'POST', body: JSON.stringify({ flightInstanceId, passengers })
});
export const confirmBooking = bookingId => request(`/bookings/${bookingId}/confirm`, { method: 'POST' });