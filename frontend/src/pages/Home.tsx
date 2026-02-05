import { useState, useEffect } from 'react';
import { korisniciApi } from '../api';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const [brojKorisnika, setBrojKorisnika] = useState<number>(0);

  useEffect(() => {
    loadBrojKorisnika();
  }, []);

  const loadBrojKorisnika = async () => {
    try {
      const users = await korisniciApi.getAll();
      setBrojKorisnika(users.length);
    } catch (err) {
      console.error('Greška pri učitavanju broja korisnika:', err);
    }
  };

  return (
    <div className="home-wrapper">
      <h1>Dobrodošli u HR aplikaciju</h1>
      <p>Broj korisnika u sistemu: {brojKorisnika}</p>
      <br />
      <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>
        Moj profil
      </a>
    </div>
  );
}
