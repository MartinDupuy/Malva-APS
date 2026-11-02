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

function PriceOption({ label, price, featured, availableSeats, passengers }) {
  const hasEnoughSeats = availableSeats === undefined || availableSeats >= passengers;
  const className = [
    'price-option',
    featured && 'featured',
    !hasEnoughSeats && 'unavailable'
  ].filter(Boolean).join(' ');
  return <div className={className}>
    <small>{label}</small>
    <strong>{formatPrice(price)}</strong>
    <span>{availableSeats === undefined ? 'por pasajero' : hasEnoughSeats ? `${availableSeats} asientos disponibles` : 'Sin cupo suficiente'}</span>
  </div>;
}

function priceAmount(price) {
  return typeof price === 'object' ? price.amount / 100 : price;
}

function formatFlightDate(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' })
    .format(new Date(`${date}T12:00:00`));
}

export function FlightCard({ flight, criteria = {}, token, onSelect }) {
  const [isSelecting, setIsSelecting] = useState(false);
  if (isSelecting) return <SeatSelection
    flight={flight}
    token={token}
    flightInstanceId={flight.flightInstanceId}
    passengerCount={criteria.passengers}
    cabinClass={criteria.cabinClass || 'all'}
    onBack={() => setIsSelecting(false)}
  />;
  const passengers = Number(criteria.passengers || 0);
  const maxFare = criteria.tariff === '' || criteria.tariff === undefined ? null : Number(criteria.tariff);
  const showEconomy = criteria.cabinClass !== 'firstClass'
    && (maxFare === null || priceAmount(flight.pricing.economy) <= maxFare);
  const showFirstClass = criteria.cabinClass !== 'economy'
    && (maxFare === null || priceAmount(flight.pricing.firstClass) <= maxFare);
  const availableSeats = flight.availableSeats;
  const flightDate = formatFlightDate(criteria.date);

  return <article className="flight-result-card">
    <div className="flight-card-top"><div><span className="flight-code">{flight.flightNumber}</span><span className="direct-badge">Vuelo directo</span></div><span className="flight-status">Disponible</span></div>
    <div className="flight-route-line"><div className="airport-time"><strong>{flight.departureTime}</strong><span>{flight.originAirport}</span></div><div className="route-duration"><span className="route-line" /><small>{getDuration(flight.departureTime, flight.arrivalTime)}</small></div><div className="airport-time arrival"><strong>{flight.arrivalTime}</strong><span>{flight.destinationAirport}</span></div></div>
    <div className="flight-card-bottom"><div className="flight-meta">{flightDate && <span><b>Fecha</b> {flightDate}</span>}<span><b>Disponibilidad</b> {availableSeats ? `${availableSeats.economy} Economy · ${availableSeats.firstClass} Primera` : `${flight.capacity.economy} Economy · ${flight.capacity.firstClass} Primera`}</span></div><div className="price-options">{showEconomy && <PriceOption label="Economy" price={flight.pricing.economy} featured availableSeats={availableSeats?.economy} passengers={passengers} />}{showFirstClass && <PriceOption label="Primera clase" price={flight.pricing.firstClass} availableSeats={availableSeats?.firstClass} passengers={passengers} />}</div><button className="select-flight" type="button" onClick={() => { setIsSelecting(true); onSelect?.(flight); }}>Elegir vuelo <span>→</span></button></div>
  </article>;
}
