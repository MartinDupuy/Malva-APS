const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function searchAvailableFlights(criteria) {
  const params = new URLSearchParams();
  const fields = ['origin', 'destination', 'date', 'passengers', 'tariff', 'cabinClass'];
  fields.forEach(field => {
    if (criteria[field]) params.set(field, String(criteria[field]));
  });
  const response = await fetch(`${API_URL}/flights/search?${params}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'No se pudieron buscar vuelos.');
  }
  return payload;
}
