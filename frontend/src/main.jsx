import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PassengerSearchPage } from './pages/PassengerSearchPage';
import { AdminFlightsPage } from './pages/AdminFlightsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuth } from './hooks/useAuth';
import './styles.css';
import './components/passenger/passenger-results.css';
import './components/auth/auth.css';

function App() {
  const auth = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'search';
  });

  const navigate = (view) => {
    setCurrentView(view);
    window.location.hash = view === 'search' ? '' : view;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentView(hash || 'search');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Strict route protection for admin page
  if (currentView === 'admin' && auth.role !== 'ADMIN') {
    return (
      <main className="auth-page">
        <header className="auth-header">
          <div className="auth-brand" onClick={() => navigate('search')}>
            <span className="brand-mark">M</span> malva<span className="brand-dot">.</span>
          </div>
          <button className="auth-logout-btn" type="button" onClick={() => navigate('search')}>
            Volver a inicio
          </button>
        </header>
        <section className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-error" style={{ marginBottom: 16 }}>
              Acceso restringido: Se requieren permisos de Administrador para acceder a esta sección.
            </div>
            <button
              className="auth-submit-btn"
              type="button"
              onClick={() => navigate(auth.isAuthenticated ? 'search' : 'login')}
            >
              {auth.isAuthenticated ? 'Ir al inicio' : 'Iniciar sesión como Administrador'}
            </button>
          </div>
        </section>
      </main>
    );
  }

  switch (currentView) {
    case 'login':
      return <LoginPage onNavigate={navigate} auth={auth} />;
    case 'register':
      return <RegisterPage onNavigate={navigate} auth={auth} />;
    case 'admin':
      return <AdminFlightsPage onNavigate={navigate} auth={auth} />;
    case 'search':
    default:
      return <PassengerSearchPage onNavigate={navigate} auth={auth} />;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
