import { useEffect, useState } from 'react';
import { useFlights } from '../hooks/useFlights';
import { useOccupancyReport } from '../hooks/useOccupancyReport';

function dateValue(date) {
  return date.toISOString().slice(0, 10);
}

function initialFilters() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return { from: dateValue(today), to: dateValue(end), flightId: '', cabinClass: 'all' };
}

export function AdminOccupancyPage({ onNavigate, auth }) {
  const { flights, loading: flightsLoading } = useFlights(auth?.token);
  const { report, loading, error, loadReport, downloadPdf } = useOccupancyReport(auth?.token);
  const [filters, setFilters] = useState(initialFilters);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport(filters).catch(() => {});
  }, []);

  const updateFilter = event => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
  };

  const submit = async event => {
    event.preventDefault();
    setNotice('');
    try { await loadReport(filters); } catch { /* displayed by the hook */ }
  };

  const exportReport = async () => {
    setExporting(true);
    setNotice('');
    try {
      await downloadPdf(filters);
      setNotice('Reporte PDF descargado correctamente.');
    } catch (exportError) {
      setNotice(exportError.message);
    } finally {
      setExporting(false);
    }
  };

  const userName = auth?.user?.name || 'Admin Grupo';
  const userInitials = userName.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();
  const totals = report?.totals?.total;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => onNavigate('search')} style={{ cursor: 'pointer' }}>
          <span className="brand-mark">M</span><span>malva<span className="brand-dot">.</span></span>
        </div>
        <nav>
          <a className="nav-item" href="#admin"><span>▦</span> Itinerarios</a>
          <a className="nav-item active" href="#occupancy"><span>◒</span> Reportes</a>
          <button className="nav-item" type="button" onClick={() => onNavigate('search')}>
            <span>✈</span> Vista Pasajero
          </button>
        </nav>
        <div className="sidebar-foot">
          <span className="avatar">{userInitials}</span>
          <div><strong>{userName}</strong><small>{auth?.role || 'ADMIN'}</small></div>
          <button type="button" className="auth-logout-btn" onClick={() => { auth.logout(); onNavigate('search'); }}>Salir</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><span className="breadcrumb">Operaciones / Análisis</span><h1>Ocupación</h1></div>
          <div className="topbar-meta"><span className="live-dot" /> API conectada</div>
        </header>
        <section className="report-content">
          <form className="report-filters" onSubmit={submit}>
            <label className="field"><span>Desde</span><input name="from" type="date" value={filters.from} onChange={updateFilter} required /></label>
            <label className="field"><span>Hasta</span><input name="to" type="date" value={filters.to} onChange={updateFilter} required /></label>
            <label className="field"><span>Vuelo</span><select name="flightId" value={filters.flightId} onChange={updateFilter}><option value="">Todos los vuelos</option>{flights.map(flight => <option key={flight.id} value={flight.id}>{flight.flightNumber}</option>)}</select></label>
            <label className="field"><span>Clase</span><select name="cabinClass" value={filters.cabinClass} onChange={updateFilter}><option value="all">Todas</option><option value="economy">Economy</option><option value="firstClass">First class</option></select></label>
            <button className="primary-button report-submit" type="submit" disabled={loading || flightsLoading}>{loading ? 'Consultando...' : 'Consultar'}</button>
            <button className="secondary-button" type="button" onClick={exportReport} disabled={!report || exporting}>{exporting ? 'Generando...' : 'Exportar PDF'}</button>
          </form>
          {(error || notice) && <div className={error ? 'alert error' : 'alert success'}>{error || notice}</div>}
          {report && <>
            <div className="report-summary">
              <div><span>Ocupación total</span><strong>{totals.occupancyPercentage}%</strong></div>
              <div><span>Asientos ocupados</span><strong>{totals.occupied}</strong></div>
              <div><span>Disponibles</span><strong>{totals.available}</strong></div>
              <div><span>Salidas analizadas</span><strong>{report.rows.length}</strong></div>
            </div>
            <div className="report-layout">
              <section className="report-panel"><div className="section-heading"><div><span className="eyebrow">Distribución</span><h2>Ocupación por salida</h2></div></div><div className="occupancy-chart">{report.rows.map(row => Object.entries(row.classes).map(([cabinClass, metrics]) => <div className="chart-row" key={`${row.flightId}-${row.date}-${cabinClass}`}><div className="chart-label"><strong>{row.flightNumber}</strong><span>{row.date} / {cabinClass}</span></div><div className="chart-track"><i style={{ width: `${Math.min(metrics.occupancyPercentage, 100)}%` }} /></div><b>{metrics.occupancyPercentage}%</b></div>))}</div></section>
              <section className="report-panel table-wrap"><table><thead><tr><th>Vuelo / fecha</th><th>Clase</th><th>Capacidad</th><th>Ocupados</th><th>Disponibles</th><th>Porcentaje</th></tr></thead><tbody>{report.rows.flatMap(row => Object.entries(row.classes).map(([cabinClass, metrics]) => <tr key={`${row.flightId}-${row.date}-${cabinClass}`}><td><strong>{row.flightNumber}</strong><small>{row.date}</small></td><td>{cabinClass}</td><td>{metrics.capacity}</td><td>{metrics.occupied}</td><td>{metrics.available}</td><td><span className="status-pill status-active">{metrics.occupancyPercentage}%</span></td></tr>))}</tbody></table></section>
            </div>
          </>}
          {!report && !loading && <div className="empty-state"><strong>Sin datos para mostrar</strong><span>Selecciona un rango y consulta el reporte.</span></div>}
        </section>
      </main>
    </div>
  );
}