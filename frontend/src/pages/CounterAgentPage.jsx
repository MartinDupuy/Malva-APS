import { useState } from 'react';
import { counterAgentService } from '../services/counterAgentService';

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

function initials(name) {
  return (name || 'EM').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function PassengerList({ bookings }) {
  if (!bookings.length) return <div className="counter-empty">No hay reservas confirmadas o retenidas para este vuelo.</div>;
  return <div className="counter-bookings">
    {bookings.map(booking => (
      <article className="counter-booking" key={booking.id}>
        <div className="counter-booking-heading">
          <strong>Reserva {booking.id}</strong>
          <span className={`counter-status ${booking.status.toLowerCase()}`}>{booking.status === 'HELD' ? 'Retenida' : 'Confirmada'}</span>
        </div>
        {booking.passengers.map((passenger, index) => (
          <div className="counter-passenger" key={`${booking.id}-${passenger.seatId}-${index}`}>
            <span>{passenger.name}</span><strong>Asiento {passenger.seatId}</strong>
          </div>
        ))}
      </article>
    ))}
  </div>;
}

export function CounterAgentPage({ onNavigate, auth }) {
  const [section, setSection] = useState('flights');
  const [criteria, setCriteria] = useState({ origin: '', destination: '', date: today, passengers: '1' });
  const [flights, setFlights] = useState([]);
  const [searched, setSearched] = useState(false);
  const [manifest, setManifest] = useState(null);
  const [bookingCode, setBookingCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const userName = auth?.user?.name || 'Empleado de mostrador';

  const updateCriteria = (event) => {
    const value = ['origin', 'destination'].includes(event.target.name)
      ? event.target.value.toUpperCase()
      : event.target.value;
    setCriteria(current => ({ ...current, [event.target.name]: value }));
  };

  const searchFlights = async (event) => {
    event.preventDefault();
    setLoading(true); setError(''); setManifest(null); setSearched(true);
    try {
      const results = await counterAgentService.searchFlights({
        ...criteria,
        passengers: Number(criteria.passengers),
        cabinClass: 'all'
      });
      setFlights(results);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  const openManifest = async (flight) => {
    setLoading(true); setError(''); setManifest(null);
    try {
      setManifest({ flight, ...(await counterAgentService.getManifest(flight.flightInstanceId, auth.token)) });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  const searchBooking = async (event) => {
    event.preventDefault();
    setLoading(true); setError(''); setBooking(null);
    try { setBooking(await counterAgentService.getBooking(bookingCode.trim(), auth.token)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  const logout = () => { auth.logout(); onNavigate('search'); };

  return <div className="counter-shell">
    <aside className="counter-sidebar">
      <button className="counter-brand" type="button" onClick={() => onNavigate('search')}><span className="brand-mark">M</span><span>malva<span className="brand-dot">.</span></span></button>
      <div className="counter-workspace-label">Atención presencial</div>
      <nav aria-label="Navegación de mostrador">
        <button className={`counter-nav-item ${section === 'flights' ? 'active' : ''}`} type="button" onClick={() => { setSection('flights'); setError(''); }}><span>✈</span> Vuelos y asientos</button>
        <button className={`counter-nav-item ${section === 'bookings' ? 'active' : ''}`} type="button" onClick={() => { setSection('bookings'); setError(''); }}><span>▤</span> Reservas y pasajeros</button>
      </nav>
      <div className="counter-profile">
        <span className="counter-avatar">{initials(userName)}</span>
        <div><strong>{userName}</strong><small>Empleado de mostrador</small></div>
        <button type="button" onClick={logout} aria-label="Cerrar sesión">Salir</button>
      </div>
    </aside>

    <main className="counter-main">
      <header className="counter-topbar">
        <div><span className="eyebrow">Operaciones / Mostrador</span><h1>{section === 'flights' ? 'Vuelos y asientos' : 'Reservas y pasajeros'}</h1></div>
        <span className="counter-demo-label">Modo demostración</span>
      </header>

      <section className="counter-content">
        {error && <div className="counter-alert" role="alert">{error}</div>}
        {section === 'flights' ? <>
          <div className="counter-section-title"><div><span className="eyebrow">Consulta rápida</span><h2>Buscar itinerarios</h2></div><p>Consultá disponibilidad y pasajeros para una fecha específica.</p></div>
          <form className="counter-search-form" onSubmit={searchFlights}>
            <label className="field"><span>Origen</span><input name="origin" value={criteria.origin} onChange={updateCriteria} placeholder="EZE" maxLength="3" pattern="[A-Za-z]{3}" required /></label>
            <label className="field"><span>Destino</span><input name="destination" value={criteria.destination} onChange={updateCriteria} placeholder="COR" maxLength="3" pattern="[A-Za-z]{3}" required /></label>
            <label className="field"><span>Fecha</span><input name="date" type="date" min={today} value={criteria.date} onChange={updateCriteria} required /></label>
            <label className="field"><span>Pasajeros</span><input name="passengers" type="number" min="1" max="9" value={criteria.passengers} onChange={updateCriteria} required /></label>
            <button className="counter-submit" type="submit" disabled={loading}>{loading ? 'Buscando…' : 'Buscar vuelos'}</button>
          </form>

          <div className="counter-results-heading"><h2>Resultados</h2>{searched && <span>{flights.length} vuelos disponibles</span>}</div>
          {loading && <div className="counter-empty">Consultando disponibilidad…</div>}
          {!loading && searched && flights.length === 0 && !error && <div className="counter-empty">No encontramos vuelos con cupo para esos criterios.</div>}
          <div className="counter-flight-list">
            {flights.map(flight => <article className="counter-flight-card" key={flight.flightInstanceId || flight.id}>
              <div className="counter-flight-code"><span>{flight.flightNumber}</span><small>{criteria.date}</small></div>
              <div className="counter-flight-route"><strong>{flight.departureTime}</strong><span>{flight.originAirport}</span><i>→</i><strong>{flight.arrivalTime}</strong><span>{flight.destinationAirport}</span></div>
              <div className="counter-flight-capacity"><span>Economy</span><strong>{flight.availableSeats?.economy ?? '—'} disponibles</strong><span>Primera</span><strong>{flight.availableSeats?.firstClass ?? '—'} disponibles</strong></div>
              <button type="button" className="counter-outline-button" onClick={() => openManifest(flight)} disabled={loading}>Ver pasajeros</button>
            </article>)}
          </div>
          {manifest && <section className="counter-manifest">
            <div className="counter-results-heading"><div><span className="eyebrow">{manifest.flight.flightNumber} · {criteria.date}</span><h2>Reservas del vuelo</h2></div><button className="counter-close" type="button" onClick={() => setManifest(null)}>Cerrar</button></div>
            <PassengerList bookings={manifest.bookings} />
          </section>}
        </> : <>
          <div className="counter-section-title"><div><span className="eyebrow">Atención de pasajeros</span><h2>Consultar una reserva</h2></div><p>Ingresá el código de reserva para ver su estado y asignación de asientos.</p></div>
          <form className="counter-booking-search" onSubmit={searchBooking}>
            <label className="field"><span>Código de reserva</span><input value={bookingCode} onChange={event => setBookingCode(event.target.value)} placeholder="Código de reserva" required /></label>
            <button className="counter-submit" type="submit" disabled={loading}>{loading ? 'Consultando…' : 'Consultar reserva'}</button>
          </form>
          {booking && <article className="counter-detail-card">
            <div className="counter-booking-heading"><div><span className="eyebrow">Código de reserva</span><h2>{booking.id}</h2></div><span className={`counter-status ${booking.status.toLowerCase()}`}>{booking.status === 'HELD' ? 'Retenida' : booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status}</span></div>
            <p className="counter-instance">Vuelo {booking.flightInstanceId}</p>
            <h3>Pasajeros y asientos</h3>
            {booking.passengers.map((passenger, index) => <div className="counter-passenger" key={`${passenger.seatId}-${index}`}><span>{passenger.name}</span><strong>Asiento {passenger.seatId}</strong></div>)}
          </article>}
        </>}
      </section>
    </main>
  </div>;
}
