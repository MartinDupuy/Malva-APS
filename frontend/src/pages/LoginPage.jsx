import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage({ onNavigate, auth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError('');
    try {
      const response = await auth.login(credentials);
      onNavigate(response.user?.role === 'ADMIN' ? 'admin' : response.user?.role === 'COUNTER_AGENT' ? 'counter' : 'search');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await auth.loginMockCounterAgent();
      onNavigate('counter');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar la sesión de demostración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <div className="auth-brand" onClick={() => onNavigate('search')}>
          <span className="brand-mark">M</span> malva<span className="brand-dot">.</span>
        </div>
        <button className="auth-logout-btn" type="button" onClick={() => onNavigate('search')}>
          Volver a búsqueda
        </button>
      </header>

      <section className="auth-container">
        <LoginForm
          onSubmit={handleLogin}
          onSwitchToRegister={() => onNavigate('register')}
          loading={loading}
          error={error}
        />
        {import.meta.env.VITE_ENABLE_COUNTER_AGENT_MOCK === 'true' && (
          <button className="auth-demo-btn" type="button" onClick={handleMockLogin} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar como empleado de mostrador (demo)'}
          </button>
        )}
      </section>
    </main>
  );
}
