import { StatusPill } from '../ui/StatusPill';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function FlightTable({ flights, loading, onEdit, onCancel }) {
  if (loading) return <div className="empty-state">Cargando itinerarios...</div>;
  if (!flights.length) return <div className="empty-state"><strong>No hay itinerarios todavía.</strong><span>Creá el primero para empezar a operar la red.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>Vuelo</th><th>Ruta</th><th>Horario</th><th>Operación</th><th>Vigencia</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{flights.map(flight => <tr key={flight.id}><td><strong>{flight.flightNumber}</strong><small>{flight.id.slice(0, 8)}</small></td><td><span className="route">{flight.originAirport}<i>→</i>{flight.destinationAirport}</span></td><td>{flight.departureTime}<small>llega {flight.arrivalTime}</small></td><td><span className="day-list">{flight.operatingDays.join(' · ')}</span></td><td>{formatDate(flight.availabilityPeriod.startDate)}<small>hasta {formatDate(flight.availabilityPeriod.endDate)}</small></td><td><StatusPill status={flight.status} /></td><td><div className="row-actions"><button className="icon-button" title="Editar itinerario" onClick={() => onEdit(flight)}>✎</button>{flight.status !== 'CANCELLED' && <button className="icon-button danger" title="Cancelar itinerario" onClick={() => onCancel(flight)}>×</button>}</div></td></tr>)}</tbody></table></div>;
}
