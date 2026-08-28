import * as React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  userRole?: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function Layout({ children, isAuthenticated, userRole, onLogout, onNavigate }: LayoutProps) {
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const upravljaCiljevima = userRole && ['superuser', 'administrator', 'rukovodilac'].includes(userRole);
  const upravljaStruktorm = userRole && ['superuser', 'administrator'].includes(userRole);

  const link = (page: string, tekst: string) => (
    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(page); }}>{tekst}</a>
  );

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="logo">
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>HR aplikacija</a>
        </div>
        <div className="nav-links">
          {upravljaCiljevima ? (
          <div className="dropdown">
            <a href="#" onClick={(e) => e.preventDefault()} className="dropdown-toggle-link">Ciljevi</a>
            <div className="dropdown-menu">
              {link('novi-cilj', 'Novi cilj')}
              {link('dodela-ciljeva', 'Dodela ciljeva')}
              <div className="dropdown-divider"></div>
              {link('kpi', 'KPI')}
              {link('dodela-kpi', 'Dodela KPI')}
              {link('napredak-kpi', 'Napredak KPI')}
            </div>
          </div>
          ) : (
            link('napredak-kpi', 'Moji KPI')
          )}

          {upravljaStruktorm ? (
            <div className="dropdown">
              <a href="#" onClick={(e) => e.preventDefault()} className="dropdown-toggle-link">Ocenjivanje</a>
              <div className="dropdown-menu">
                {link('ocenjivanje', 'Ocenjivanje')}
                {link('koeficijenti', 'Težinski koeficijenti')}
              </div>
            </div>
          ) : (
            link('ocenjivanje', 'Ocenjivanje')
          )}

          {link('odmori', 'Odmori')}
          {upravljaStruktorm && link('plate', 'Plate')}
          {link('users', 'Korisnici')}

          {upravljaStruktorm && (
          <div className="dropdown">
            <button className="dropdown-toggle" title="Dodaj novo">
              <svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" viewBox="0 0 24 24" width="24px" height="24px">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
            <div className="dropdown-menu">
              {link('profile-create', 'Novi korisnik')}
              <div className="dropdown-divider"></div>
              {link('organizaciona-jedinica', 'Nova org. jedinica')}
              {link('radno-mesto', 'Novo radno mesto')}
            </div>
          </div>
          )}

          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }} style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }} title="Profil">
            <svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" viewBox="0 0 24 24" width="24px" height="24px">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }} title="Odjavi se">
            <svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" viewBox="0 0 24 24" width="24px" height="24px">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </a>
        </div>
      </nav>

      <div className="container">
        {children}
      </div>
    </div>
  );
}
