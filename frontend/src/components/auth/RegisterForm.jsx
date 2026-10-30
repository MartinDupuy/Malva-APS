import { useState } from 'react';

export function RegisterForm({ onSubmit, onSwitchToLogin, loading, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError('');

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    onSubmit({ name: name.trim(), email: email.trim(), password });
  };

  const displayError = localError || error;

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2>Crear una cuenta</h2>
        <p>Registrate para gestionar tus reservas y vuelos en Malva Airlines.</p>
      </div>

      {displayError && <div className="auth-error">{displayError}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-name">Nombre completo</label>
          <input
            id="register-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Ej: Ana Perez"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Contraseña (mínimo 6 caracteres)</label>
          <input
            id="register-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm-password">Confirmar contraseña</label>
          <input
            id="register-confirm-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className="auth-submit-btn" type="submit" disabled={loading || !name || !email || !password}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <div className="auth-footer-nav">
        ¿Ya tenés una cuenta?{' '}
        <button type="button" onClick={onSwitchToLogin}>
          Iniciá sesión acá
        </button>
      </div>
    </div>
  );
}
