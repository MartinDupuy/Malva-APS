import { useEffect, useState } from 'react';
import { useBooking } from '../../hooks/useBooking';

export function SeatSelection({ flight, token, flightInstanceId = flight.id, passengerCount, cabinClass = 'all', onBack }) {
  const { seats, selectedSeatIds, toggleSeat, clearSelection, booking, reserve, confirm, error, isLoading } = useBooking(flight, token, flightInstanceId);
  const [passengers, setPassengers] = useState({});
  const requestedCount = Number(passengerCount);
  const hasRequestedCount = Number.isInteger(requestedCount) && requestedCount > 0;
  const seatLimit = hasRequestedCount ? requestedCount : 9;
  const allowedClasses = cabinClass === 'all' ? ['economy', 'firstClass'] : [cabinClass];
  const initialClass = cabinClass === 'firstClass' ? 'firstClass' : 'economy';
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const availableCounts = seats.reduce((counts, seat) => {
    if (seat.status === 'AVAILABLE') counts[seat.cabinClass] += 1;
    return counts;
  }, { economy: 0, firstClass: 0 });

  useEffect(() => {
    if (cabinClass === 'all' && hasRequestedCount
      && availableCounts[selectedClass] < requestedCount) {
      const classes = ['economy', 'firstClass'];
      const alternative = classes.find(cabin => availableCounts[cabin] >= requestedCount);
      if (alternative) setSelectedClass(alternative);
    }
  }, [seats, cabinClass, hasRequestedCount, requestedCount, selectedClass]);

  const visibleSeats = seats.filter(seat => seat.cabinClass === selectedClass);
  const selectedSeats = visibleSeats.filter(seat => selectedSeatIds.includes(seat.id));
  const updatePassenger = (seatId, field, value) => setPassengers(current => ({ ...current, [seatId]: { ...current[seatId], [field]: value } }));
  const submit = async event => {
    event.preventDefault();
    if (hasRequestedCount && selectedSeats.length !== requestedCount) return;
    await reserve(selectedSeats.map(seat => ({ seatId: seat.id, ...passengers[seat.id] })));
  };
  const changeClass = nextClass => {
    setSelectedClass(nextClass);
    clearSelection();
    setPassengers({});
  };

  return <main className="booking-page">
    <button className="text-button" type="button" onClick={onBack}>← Volver a resultados</button>
    <div className="booking-heading">
      <span className="eyebrow">Reserva de pasajes</span>
      <h1>{flight.originAirport} → {flight.destinationAirport}</h1>
      <p>{hasRequestedCount ? `Seleccioná ${requestedCount} asientos en la clase buscada.` : 'Elegí hasta 9 asientos.'} El bloqueo dura 10 minutos.</p>
    </div>
    {error && <div className="alert error" style={{ margin: '12px 0', padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '6px' }}>{error.message}</div>}
    {!token && (
      <div className="alert info" style={{ margin: '12px 0', padding: '12px', background: '#e3f2fd', color: '#1565c0', borderRadius: '6px' }}>
        Iniciá sesión como pasajero para poder confirmar tu reserva con tus datos de usuario.
      </div>
    )}
    {booking ? (
      booking.status === 'CONFIRMED' ? (
        <section className="booking-confirmation success" style={{ borderLeft: '4px solid #2e7d32' }}>
          <span className="eyebrow" style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Compra Confirmada</span>
          <h2>¡Tu reserva está confirmada con éxito!</h2>
          <p>Identificador de reserva: <strong>{booking.id}</strong></p>
          <p>Vuelo: <strong>{flight.flightNumber}</strong> ({flight.originAirport} → {flight.destinationAirport})</p>
          {booking.passengers && booking.passengers.length > 0 && (
            <div style={{ margin: '16px 0', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '14px' }}>
              <strong>Pasajeros confirmados:</strong>
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {booking.passengers.map(p => (
                  <li key={p.seatId} style={{ marginBottom: '4px' }}>
                    <strong>{p.name}</strong> ({p.email}) — Asiento {seats.find(s => s.id === p.seatId)?.number || p.seatId}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginTop: '20px' }}>
            <button className="primary-button" type="button" onClick={onBack}>
              Volver a búsqueda de vuelos
            </button>
          </div>
        </section>
      ) : (
        <section className="booking-confirmation">
          <span className="eyebrow">Asientos bloqueados</span>
          <h2>Reserva lista para confirmar</h2>
          <p>Identificador: <strong>{booking.id}</strong></p>
          <p>Los asientos se encuentran retenidos temporalmente a tu nombre.</p>
          <button className="primary-button" type="button" onClick={confirm} disabled={isLoading}>
            {isLoading ? 'Confirmando compra...' : 'Confirmar compra'}
          </button>
        </section>
      )
    ) : (
      <form onSubmit={submit}>
        <div className="cabin-tabs">
          <strong>Clase:</strong>
          {allowedClasses.map(cabin => {
            const label = cabin === 'economy' ? 'Economy' : 'Primera Clase';
            const enoughSeats = !hasRequestedCount || availableCounts[cabin] >= requestedCount;
            return <button
              key={cabin}
              className={selectedClass === cabin ? 'cabin-tab selected' : 'cabin-tab'}
              type="button"
              disabled={!enoughSeats || isLoading}
              onClick={() => changeClass(cabin)}
            >
              {label} · {availableCounts[cabin]} disponibles
            </button>;
          })}
        </div>
        <div className="seat-grid">
          {visibleSeats.map(seat => <button
            key={seat.id}
            type="button"
            disabled={seat.status !== 'AVAILABLE' || isLoading}
            className={`seat ${seat.cabinClass} ${selectedSeatIds.includes(seat.id) ? 'selected' : ''}`}
            onClick={() => toggleSeat(seat.id, seatLimit)}
          >{seat.number}</button>)}
        </div>
        {selectedSeats.map(seat => <div className="passenger-row" key={seat.id}>
          <strong>Asiento {seat.number}</strong>
          <input required placeholder="Nombre completo" value={passengers[seat.id]?.name || ''} onChange={event => updatePassenger(seat.id, 'name', event.target.value)} />
          <input required type="email" placeholder="Email" value={passengers[seat.id]?.email || ''} onChange={event => updatePassenger(seat.id, 'email', event.target.value)} />
        </div>)}
        <button className="primary-button" type="submit" disabled={isLoading || selectedSeats.length === 0 || (hasRequestedCount && selectedSeats.length !== requestedCount)}>
          {hasRequestedCount && selectedSeats.length < requestedCount
            ? `Seleccioná ${requestedCount - selectedSeats.length} asiento${requestedCount - selectedSeats.length === 1 ? '' : 's'} más`
            : `Bloquear ${selectedSeats.length} asiento${selectedSeats.length === 1 ? '' : 's'}`}
        </button>
      </form>
    )}
  </main>;
}
