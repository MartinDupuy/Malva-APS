import { useState } from 'react';
import { useFlightForm } from '../hooks/useFlightForm';
import { useFlights } from '../hooks/useFlights';
import { FlightForm } from '../components/flights/FlightForm';
import { FlightTable } from '../components/flights/FlightTable';

export function AdminFlightsPage() {
  const { flights, loading, error, saveFlight, cancelFlight } = useFlights();
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

  return <div className="admin-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><span>malva<span className="brand-dot">.</span></span></div><nav><a className="nav-item active" href="#flights"><span>▦</span> Itinerarios</a><a className="nav-item" href="#routes"><span>⌁</span> Rutas</a><a className="nav-item" href="#reports"><span>◒</span> Reportes</a></nav><div className="sidebar-foot"><span className="avatar">AG</span><div><strong>Admin Grupo</strong><small>Operaciones</small></div><span className="more">···</span></div></aside><main className="main-content"><header className="topbar"><div><span className="breadcrumb">Operaciones / Administración</span><h1>Itinerarios</h1></div><div className="topbar-meta"><span className="live-dot" /> API conectada <span className="date-stamp">14 OCT 2026</span></div></header><section className="content-grid"><div className="list-panel"><div className="section-heading"><div><span className="eyebrow">Red aérea</span><h2>Todos los itinerarios <span className="count-badge">{flights.length}</span></h2></div><button className="refresh-button" title="Actualizar lista" onClick={() => window.location.reload()}>↻</button></div>{(error || notice) && <div className={error ? 'alert error' : 'alert success'}>{error || notice}</div>}<FlightTable flights={flights} loading={loading} onEdit={editFlight} onCancel={cancel} /></div><aside className="form-panel"><FlightForm form={form} editingId={editingId} saving={saving} onChange={updateField} onToggleDay={toggleDay} onSubmit={submit} onReset={resetForm} /></aside></section></main></div>;
}
