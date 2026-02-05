import { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error: string | null;
}

export function Login({ onLogin, error }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="login-body">
      <div className="login-forma">
        <div className="login-sekcija">
          <h1>Ulogujte se</h1>
          <p className="podnaslov">Unesite Vaše kredencijale</p>

          {error && (
            <p className="error-message">{error}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="forma-grupa">
              <input
                type="text"
                id="username"
                name="username"
                required
                autoComplete="username"
                placeholder="Korisničko ime"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="forma-grupa">
              <div className="password-polje">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="Lozinka"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  aria-label="Show password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <button type="submit" className="btn-login">Prijava</button>
          </form>
        </div>

        <div className="slika-sekcija">
          <div className="slika-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#435e8d" width="120" height="120">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <h2>HR Aplikacija</h2>
            <p>Sistem za upravljanje ljudskim resursima</p>
          </div>
        </div>
      </div>
    </div>
  );
}
