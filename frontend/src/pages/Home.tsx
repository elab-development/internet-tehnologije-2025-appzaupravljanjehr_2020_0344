import { useState, useEffect } from 'react';
import { dodeljeniCiljeviApi, dodeljeniKpiApi, oceneApi, odmoriApi, korisniciApi, organizacioneJediniceApi, radnaMestaApi, ciljeviApi, kpiApi } from '../api';
import type { DodeljeniCilj, DodeljeniKPI, KorisnikFull, Ocena, Odmor, StanjeOdmora, Korisnik } from '../types';
import { Button } from '../components/Button';
import './Home.css';
import './Pregled.css';

interface HomeProps {
  onNavigate: (page: string) => void;
  currentUser?: KorisnikFull | null;
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('sr-RS');
};

const danas = () => new Date().toISOString().slice(0, 10);

export function Home({ onNavigate, currentUser }: HomeProps) {
  const [dodeljeniCiljevi, setDodeljeniCiljevi] = useState<DodeljeniCilj[]>([]);
  const [loading, setLoading] = useState(true);
  const jeAdmin = currentUser?.role === 'superuser' || currentUser?.role === 'administrator';
  const jeRukovodilac = currentUser?.role === 'rukovodilac';
  const [dodeljeniKpi, setDodeljeniKpi] = useState<DodeljeniKPI[]>([]);
  const [ocene, setOcene] = useState<Ocena[]>([]);
  const [odmori, setOdmori] = useState<Odmor[]>([]);
  const [stanjeOdmora, setStanjeOdmora] = useState<StanjeOdmora | null>(null);
  const obradjujeZahteve = jeAdmin || jeRukovodilac;

  useEffect(() => {
    if (currentUser && currentUser.role !== 'superuser') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadData = async () => {
    const [ciljeviRes, odmoriRes, stanjeRes, kpiRes, oceneRes] = await Promise.allSettled([
      dodeljeniCiljeviApi.getAll(),
      odmoriApi.getAll(),
      odmoriApi.stanje(),
      dodeljeniKpiApi.getAll(),
      oceneApi.getAll(),
    ]);

    if (ciljeviRes.status === 'fulfilled') {
      setDodeljeniCiljevi(ciljeviRes.value.filter((dc: DodeljeniCilj) => dc.zaposleni === currentUser?.id));
    } else {
      console.error('Greška pri učitavanju ciljeva:', ciljeviRes.reason);
    }
    if (odmoriRes.status === 'fulfilled') setOdmori(odmoriRes.value);
    else console.error('Greška pri učitavanju odmora:', odmoriRes.reason);
    if (stanjeRes.status === 'fulfilled') setStanjeOdmora(stanjeRes.value);
    else console.error('Greška pri učitavanju stanja odmora:', stanjeRes.reason);
    if (kpiRes.status === 'fulfilled') setDodeljeniKpi(kpiRes.value);
    else console.error('Greška pri učitavanju KPI:', kpiRes.reason);
    if (oceneRes.status === 'fulfilled') setOcene(oceneRes.value);
    else console.error('Greška pri učitavanju ocena:', oceneRes.reason);

    setLoading(false);
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
            <Button variant="primary" onClick={() => onNavigate('users')}>Korisnici</Button>
            <Button variant="primary" onClick={() => onNavigate('novi-cilj')}>Novi cilj</Button>
            <Button variant="primary" onClick={() => onNavigate('dodela-ciljeva')}>Dodela ciljeva</Button>
            <Button variant="primary" onClick={() => onNavigate('kpi')}>KPI</Button>
            <Button variant="primary" onClick={() => onNavigate('dodela-kpi')}>Dodela KPI</Button>
            <Button variant="primary" onClick={() => onNavigate('napredak-kpi')}>Napredak KPI</Button>
            <Button variant="primary" onClick={() => onNavigate('ocenjivanje')}>Ocenjivanje</Button>
            <Button variant="primary" onClick={() => onNavigate('koeficijenti')}>Težinski koeficijenti</Button>
            <Button variant="primary" onClick={() => onNavigate('odmori')}>Odmori</Button>
            <Button variant="primary" onClick={() => onNavigate('plate')}>Plate</Button>
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

  const mojiOdmori = odmori.filter(o => o.zaposleni === currentUser?.id);
  const zahteviNaCekanju = odmori.filter(o => o.zaposleni !== currentUser?.id && o.status === 'na_cekanju');
  const mojiKpi = dodeljeniKpi.filter(d => d.korisnik === currentUser?.id);
  const aktivniKpi = mojiKpi.filter(d => d.datum_Do >= danas());
  const mojeOcene = ocene.filter(o => o.zaposleni === currentUser?.id);
  const klasaProgress = (procenat: number) => procenat >= 100 ? 'uspeh' : procenat >= 50 ? '' : 'upozorenje';

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

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-vrednost">{aktivniCiljevi.length}</div>
          <div className="stat-naziv">Aktivni ciljevi</div>
        </div>
        <div className="stat-tile">
          <div className="stat-vrednost">{aktivniKpi.length}</div>
          <div className="stat-naziv">Aktivni KPI</div>
        </div>
        <div className="stat-tile uspeh">
          <div className="stat-vrednost">{stanjeOdmora ? stanjeOdmora.preostalo : '—'}</div>
          <div className="stat-naziv">Preostalo dana odmora{stanjeOdmora ? ` (${stanjeOdmora.godina})` : ''}</div>
        </div>
        {obradjujeZahteve ? (
          <div className="stat-tile upozorenje">
            <div className="stat-vrednost">{zahteviNaCekanju.length}</div>
            <div className="stat-naziv">Zahtevi za odmor na čekanju</div>
          </div>
        ) : (
          <div className="stat-tile">
            <div className="stat-vrednost">{mojeOcene.length}</div>
            <div className="stat-naziv">Moje evaluacije</div>
          </div>
        )}
      </div>

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

        <div className="dashboard-card">
          <h3>Moji KPI ({aktivniKpi.length})</h3>
          {aktivniKpi.length === 0 ? (
            <p className="no-data">Nemate aktivnih KPI</p>
          ) : (
            <ul className="goals-list">
              {aktivniKpi.map(d => (
                <li key={d.id}>
                  <span className="goal-name">
                    {d.kpi_naziv}
                    <div className="progress" style={{ marginTop: '6px' }}>
                      <div className={`progress-bar ${klasaProgress(d.procenat)}`} style={{ width: `${Math.min(d.procenat, 100)}%` }} />
                    </div>
                  </span>
                  <span className="goal-type">{d.procenat}%</span>
                  <span className="goal-date">do {formatDate(d.datum_Do)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="quick-links" style={{ marginTop: '16px' }}>
            <Button variant="outline" onClick={() => onNavigate('napredak-kpi')}>Napredak KPI</Button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Moji odmori ({mojiOdmori.length})</h3>
          {mojiOdmori.length === 0 ? (
            <p className="no-data">Nemate podnetih zahteva za odmor</p>
          ) : (
            <ul className="goals-list">
              {mojiOdmori.map(o => (
                <li key={o.id}>
                  <span className="goal-name">{formatDate(o.datum_Od)} - {formatDate(o.datum_Do)}</span>
                  <span className="goal-date">{o.broj_dana} dana</span>
                  <span className={`status-badge ${o.status}`}>{o.status_naziv}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="quick-links" style={{ marginTop: '16px' }}>
            <Button variant="primary" onClick={() => onNavigate('novi-zahtev-odmor')}>+ Novi zahtev</Button>
            <Button variant="outline" onClick={() => onNavigate('odmori')}>Svi odmori</Button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Moje evaluacije ({mojeOcene.length})</h3>
          {mojeOcene.length === 0 ? (
            <p className="no-data">Nemate evidentiranih ocena</p>
          ) : (
            <ul className="goals-list">
              {mojeOcene.map(o => (
                <li key={o.id}>
                  <span className="goal-name">{formatDate(o.datum_Od)} - {formatDate(o.datum_Do)}</span>
                  <span className="goal-type">zbirna {o.zbirna_ocena ?? '—'}</span>
                  <span className="goal-date">{o.rukovodilac_ime || '—'}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="quick-links" style={{ marginTop: '16px' }}>
            <Button variant="outline" onClick={() => onNavigate('ocenjivanje')}>Ocenjivanje</Button>
          </div>
        </div>

        {obradjujeZahteve && (
          <div className="dashboard-card">
            <h3>Zahtevi za odmor na čekanju ({zahteviNaCekanju.length})</h3>
            {zahteviNaCekanju.length === 0 ? (
              <p className="no-data">Nema zahteva koji čekaju obradu</p>
            ) : (
              <ul className="goals-list">
                {zahteviNaCekanju.map(o => (
                  <li key={o.id}>
                    <span className="goal-name">{o.zaposleni_ime}</span>
                    <span className="goal-date">{formatDate(o.datum_Od)} - {formatDate(o.datum_Do)} ({o.broj_dana} dana)</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="quick-links" style={{ marginTop: '16px' }}>
              <Button variant="outline" onClick={() => onNavigate('odmori')}>Obradi zahteve</Button>
            </div>
          </div>
        )}   
      </div>
    </div>
  );
}
