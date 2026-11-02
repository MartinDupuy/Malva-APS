import { useState } from 'react';

export function LoginForm({ onSubmit, onSwitchToRegister, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    onSubmit({ email: email.trim(), password });
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2>Iniciar sesión</h2>
        <p>Ingresá tus credenciales para acceder a tu cuenta en Malva Airlines.</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="auth-submit-btn" type="submit" disabled={loading || !email || !password}>
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
        </button>
      </form>

      <div className="auth-footer-nav">
        ¿No tenés una cuenta?{' '}
        <button type="button" onClick={onSwitchToRegister}>
          Registrate acá
        </button>
      </div>
    </div>
  );
}
