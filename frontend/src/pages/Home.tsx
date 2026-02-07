import { useState, useEffect } from 'react';
import { dodeljeniCiljeviApi } from '../api';
import type { DodeljeniCilj, KorisnikFull } from '../types';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
  currentUser?: KorisnikFull | null;
}

export function Home({ onNavigate, currentUser }: HomeProps) {
  const [dodeljeniCiljevi, setDodeljeniCiljevi] = useState<DodeljeniCilj[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'superuser') {
      loadDodeljeniCiljevi();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  
  const loadDodeljeniCiljevi = async () => {
    try {
      const data = await dodeljeniCiljeviApi.getAll();
      console.log('Dodeljeni ciljevi iz API:', data);
      setDodeljeniCiljevi(data);
    } catch (err) {
      console.error('Greška pri učitavanju ciljeva:', err);
    } finally {
      setLoading(false);
    }
  };


  if (currentUser?.role === 'superuser') {
    return (
      <div className="home-wrapper">
        <h1>Dobrodošli, {currentUser.first_name} {currentUser.last_name}</h1>
        <div style={{ textAlign: 'center' }}>
          <span className="role-badge superuser">Superuser</span>
        </div>
        <div className="superuser-message">
          <p>Kao superuser imate pristup svim funkcionalnostima sistema.</p>
          <div className="quick-links">
            <button onClick={() => onNavigate('users')}>Korisnici</button>
            <button onClick={() => onNavigate('novi-cilj')}>Novi cilj</button>
            <button onClick={() => onNavigate('dodela-ciljeva')}>Dodela ciljeva</button>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aktivniCiljevi = dodeljeniCiljevi.filter(dc => {
    const datumDo = new Date(dc.datum_Do);
    datumDo.setHours(0, 0, 0, 0);
    return datumDo >= today;
  });

  const istorijaCiljeva = dodeljeniCiljevi.filter(dc => {
    const datumDo = new Date(dc.datum_Do);
    datumDo.setHours(0, 0, 0, 0);
    return datumDo < today;
  });

  if (loading) {
    return <div className="home-wrapper"><p>Učitavanje...</p></div>;
  }


  return (
    <div className="home-wrapper">
      <h1>Dobrodošli, {currentUser?.first_name} {currentUser?.last_name}</h1>
      <div style={{ textAlign: 'center' }}>
        <span className="role-badge">{currentUser?.role}</span>
      </div>

      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
        Ukupno ciljeva: {dodeljeniCiljevi.length}
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Aktivni ciljevi ({aktivniCiljevi.length})</h3>
          {aktivniCiljevi.length === 0 ? (
            <p className="no-data">Nemate aktivnih ciljeva</p>
          ) : (
            <ul className="goals-list">
              {aktivniCiljevi.map(dc => (
                <li key={dc.id}>
                  <span className="goal-name">{dc.cilj_naziv}</span>
                  <span className="goal-type">{dc.tip_cilja_naziv}</span>
                  <span className="goal-date">
                    {new Date(dc.datum_Od).toLocaleDateString('sr-RS')} - {new Date(dc.datum_Do).toLocaleDateString('sr-RS')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Istorija ciljeva ({istorijaCiljeva.length})</h3>
          {istorijaCiljeva.length === 0 ? (
            <p className="no-data">Nemate završenih ciljeva</p>
          ) : (
            <ul className="goals-list history">
              {istorijaCiljeva.map(dc => (
                <li key={dc.id}>
                  <span className="goal-name">{dc.cilj_naziv}</span>
                  <span className="goal-type">{dc.tip_cilja_naziv}</span>
                  <span className="goal-date">završen {new Date(dc.datum_Do).toLocaleDateString('sr-RS')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
