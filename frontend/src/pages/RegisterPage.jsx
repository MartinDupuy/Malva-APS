import { useState } from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';

export function RegisterPage({ onNavigate, auth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (data) => {
    setLoading(true);
    setError('');
    try {
      await auth.register(data);
      // Auto-login after successful registration
      await auth.login({ email: data.email, password: data.password });
      onNavigate('search');
    } catch (err) {
      setError(err.message || 'Error al registrar usuario');
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
        <RegisterForm
          onSubmit={handleRegister}
          onSwitchToLogin={() => onNavigate('login')}
          loading={loading}
          error={error}
        />
      </section>
    </main>
  );
}
