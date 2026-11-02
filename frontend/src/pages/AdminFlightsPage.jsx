import { useState } from 'react';
import { useFlightForm } from '../hooks/useFlightForm';
import { useFlights } from '../hooks/useFlights';
import { FlightForm } from '../components/flights/FlightForm';
import { FlightTable } from '../components/flights/FlightTable';

export function AdminFlightsPage({ onNavigate, auth }) {
  const { flights, loading, error, saveFlight, cancelFlight } = useFlights(auth?.token);
  const { form, editingId, editFlight, resetForm, updateField, toggleDay } = useFlightForm();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveFlight(form, editingId);
      setNotice(editingId ? 'Itinerario actualizado correctamente.' : 'Itinerario publicado correctamente.');
      resetForm();
    } catch (saveError) {
      setNotice(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async flight => {
    if (!window.confirm(`¿Cancelar el vuelo ${flight.flightNumber}?`)) return;
    try { await cancelFlight(flight.id); setNotice('Itinerario cancelado.'); } catch (cancelError) { setNotice(cancelError.message); }
  };

  const userName = auth?.user?.name || 'Admin Grupo';
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => onNavigate && onNavigate('search')} style={{ cursor: 'pointer' }}>
          <span className="brand-mark">M</span>
          <span>malva<span className="brand-dot">.</span></span>
        </div>
        <nav>
          <a className="nav-item active" href="#admin"><span>▦</span> Itinerarios</a>
          <a className="nav-item" href="#occupancy"><span>◒</span> Reportes</a>
          <button
            className="nav-item"
            type="button"
            style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
            onClick={() => onNavigate && onNavigate('search')}
          >
            <span>✈</span> Vista Pasajero
          </button>
        </nav>
        <div className="sidebar-foot">
          <span className="avatar">{userInitials}</span>
          <div>
            <strong>{userName}</strong>
            <small>{auth?.role || 'ADMIN'}</small>
          </div>
          {auth && (
            <button
              type="button"
              className="auth-logout-btn"
              onClick={() => {
                auth.logout();
                onNavigate && onNavigate('search');
              }}
              title="Cerrar sesión"
            >
              Salir
            </button>
          )}
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Operaciones / Administración</span>
            <h1>Itinerarios</h1>
          </div>
          <div className="topbar-meta">
            <span className="live-dot" /> API conectada <span className="date-stamp">14 OCT 2026</span>
          </div>
        </header>
        <section className="content-grid">
          <div className="list-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Red aérea</span>
                <h2>Todos los itinerarios <span className="count-badge">{flights.length}</span></h2>
              </div>
              <button className="refresh-button" title="Actualizar lista" onClick={() => window.location.reload()}>↻</button>
            </div>
            {(error || notice) && <div className={error ? 'alert error' : 'alert success'}>{error || notice}</div>}
            <FlightTable flights={flights} loading={loading} onEdit={editFlight} onCancel={cancel} />
          </div>
          <aside className="form-panel">
            <FlightForm form={form} editingId={editingId} saving={saving} onChange={updateField} onToggleDay={toggleDay} onSubmit={submit} onReset={resetForm} />
          </aside>
        </section>
      </main>
    </div>
  );
}
