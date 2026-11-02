import { searchAvailableFlights } from './passengerSearchService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function staffRequest(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'No se pudo completar la consulta.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const counterAgentService = {
  searchFlights: searchAvailableFlights,
  getManifest: (flightInstanceId, token) => staffRequest(
    `/bookings/search?flightInstanceId=${encodeURIComponent(flightInstanceId)}`,
    token
  ),
  getBooking: (bookingId, token) => staffRequest(`/bookings/${encodeURIComponent(bookingId)}`, token),
};
