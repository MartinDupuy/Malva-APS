import { FlightCard } from '../components/passenger/FlightCard';
import { SearchForm } from '../components/passenger/SearchForm';
import { useFlightSearch } from '../hooks/useFlightSearch';

export function PassengerSearchPage({ onNavigate, auth }) {
  const { results, isLoading, error, hasSearched, searchedCriteria, performSearch } = useFlightSearch();

  return (
    <main className="passenger-page">
      <header className="passenger-header">
        <div className="passenger-brand" onClick={() => onNavigate && onNavigate('search')}>
          <span className="brand-mark">M</span> malva<span className="brand-dot">.</span>
        </div>
        <nav>
          <a className="passenger-nav-active" href="#search">Buscar vuelos</a>
          <a href="#trips">Mis viajes</a>
          {auth?.isAuthenticated ? (
            <div className="auth-user-badge">
              {auth.role === 'ADMIN' && (
                <button
                  className="auth-admin-link"
                  type="button"
                  onClick={() => onNavigate && onNavigate('admin')}
                >
                  Panel Admin
                </button>
              )}
              <div className="auth-user-info">
                <span className="auth-user-name">{auth.user.name}</span>
                <span className="auth-user-role">{auth.role}</span>
              </div>
              <button
                className="auth-logout-btn"
                type="button"
                onClick={() => auth.logout()}
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              className="passenger-login"
              type="button"
              onClick={() => onNavigate && onNavigate('login')}
            >
              Ingresar
            </button>
          )}
        </nav>
      </header>

      <section className="search-hero">
        <div className="hero-copy">
          <span className="eyebrow">Malva Airlines / Tu próximo destino</span>
          <h1>Volá hacia<br /><em>lo que importa.</em></h1>
          <p>Encontrá tu próximo vuelo de forma simple, clara y sin escalas innecesarias.</p>
        </div>
        <div className="search-panel">
          <div className="search-panel-title">
            <div>
              <span className="eyebrow">Explorá la red</span>
              <h2>¿A dónde querés ir?</h2>
            </div>
            <span className="search-hint">IDA · VUELTA</span>
          </div>
          <SearchForm onSearch={performSearch} />
        </div>
      </section>

      <section className="results-section" id="search">
        <div className="results-heading">
          <div>
            <span className="eyebrow">Resultados de búsqueda</span>
            <h2>{hasSearched ? `${results.length} vuelos encontrados` : 'Vuelos disponibles'}</h2>
          </div>
          {hasSearched && <span className="results-note">Precios por pasajero · Impuestos incluidos</span>}
        </div>

        {isLoading && <div className="search-state"><span className="loader" /> Buscando las mejores opciones...</div>}
        {error && <div className="search-state error-state">{error}</div>}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="search-state">No encontramos vuelos para esos criterios.</div>
        )}
        {!isLoading && !error && results.length > 0 && (
          <div className="flight-results">
            {results.map(flight => <FlightCard key={flight.id} flight={flight} criteria={searchedCriteria} token={auth?.token} />)}
          </div>
        )}
        {!hasSearched && (
          <div className="search-state initial-state">
            <span className="plane-icon">✈</span>
            <strong>Tu viaje empieza acá.</strong>
            <span>Ingresá origen, destino y fecha para ver opciones.</span>
          </div>
        )}
      </section>

      <footer className="passenger-footer">
        <span>malva<span className="brand-dot">.</span></span>
        <span>Vuelos simples para momentos importantes.</span>
        <span>© 2026 Malva Airlines</span>
      </footer>
    </main>
  );
}
