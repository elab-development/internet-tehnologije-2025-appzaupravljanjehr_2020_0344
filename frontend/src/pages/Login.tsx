import { useState } from 'react';
import { Button } from '../components/Button';
import slikaLogin from '../assets/slikazaLogIn.jpg';
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
            <Button type="submit" variant="primary" className="btn-login">Prijava</Button>
          </form>
        </div>

        <div className="slika-sekcija">
          <img src={slikaLogin} alt="HR Aplikacija" className="login-slika" />
        </div>
      </div>
    </div>
  );
}
