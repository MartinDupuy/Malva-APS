import { useState } from 'react';
import { SeatSelection } from './SeatSelection';

function formatPrice(price) {
  const amount = typeof price === 'object' ? price.amount / 100 : price;
  const currency = typeof price === 'object' ? price.currency : 'ARS';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

function getDuration(departureTime, arrivalTime) {
  const [departureHours, departureMinutes] = departureTime.split(':').map(Number);
  const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
  const minutes = (arrivalHours * 60 + arrivalMinutes) - (departureHours * 60 + departureMinutes);
  const normalizedMinutes = minutes < 0 ? minutes + 24 * 60 : minutes;
  return `${Math.floor(normalizedMinutes / 60)} h ${normalizedMinutes % 60} min`;
}

function PriceOption({ label, price, featured }) {
  return <div className={featured ? 'price-option featured' : 'price-option'}><small>{label}</small><strong>{formatPrice(price)}</strong><span>por pasajero</span></div>;
}

export function FlightCard({ flight, onSelect }) {
  const [isSelecting, setIsSelecting] = useState(false);
  if (isSelecting) return <SeatSelection flight={flight} onBack={() => setIsSelecting(false)} />;

  return <article className="flight-result-card">
    <div className="flight-card-top"><div><span className="flight-code">{flight.flightNumber}</span><span className="direct-badge">Vuelo directo</span></div><span className="flight-status">Disponible</span></div>
    <div className="flight-route-line"><div className="airport-time"><strong>{flight.departureTime}</strong><span>{flight.originAirport}</span></div><div className="route-duration"><span className="route-line" /><small>{getDuration(flight.departureTime, flight.arrivalTime)}</small></div><div className="airport-time arrival"><strong>{flight.arrivalTime}</strong><span>{flight.destinationAirport}</span></div></div>
    <div className="flight-card-bottom"><div className="flight-meta"><span><b>Opera</b> {flight.operatingDays.join(' · ')}</span><span><b>Disponibilidad</b> {flight.capacity.economy} Economy · {flight.capacity.firstClass} Primera</span></div><div className="price-options"><PriceOption label="Economy" price={flight.pricing.economy} featured /><PriceOption label="Primera clase" price={flight.pricing.firstClass} /></div><button className="select-flight" type="button" onClick={() => { setIsSelecting(true); onSelect?.(flight); }}>Elegir vuelo <span>→</span></button></div>
  </article>;
}
