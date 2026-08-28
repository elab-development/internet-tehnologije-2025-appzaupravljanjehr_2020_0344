import { useState, useEffect } from 'react';
import { dodeljeniKpiApi, ostvareniKpiApi, korisniciApi } from '../api';
import type { DodeljeniKPI, Korisnik, KorisnikFull } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

interface NapredakKPIProps {
  currentUser: KorisnikFull;
  onDodela?: () => void;
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('sr-RS');
};

const danas = () => new Date().toISOString().slice(0, 10);

export function NapredakKPI({ currentUser, onDodela }: NapredakKPIProps) {
  const jeAdmin = currentUser.role === 'superuser' || currentUser.role === 'administrator';
  const mozeDaUpravlja = jeAdmin || currentUser.role === 'rukovodilac';

  const [dodeljeni, setDodeljeni] = useState<DodeljeniKPI[]>([]);
  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filterKorisnik, setFilterKorisnik] = useState('');
  const [samoAktivni, setSamoAktivni] = useState(true);
  const [otvoren, setOtvoren] = useState<DodeljeniKPI | null>(null);
  const [unos, setUnos] = useState({ ostvarena_vrednost: '', datum: danas(), opis: '' });
  const [cuvanje, setCuvanje] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const pozivi: Promise<any>[] = [dodeljeniKpiApi.getAll()];
      if (mozeDaUpravlja) pozivi.push(korisniciApi.getAll());
      const [dodeljeniData, korisniciData] = await Promise.all(pozivi);
      setDodeljeni(dodeljeniData);
      if (korisniciData) setKorisnici(korisniciData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri učitavanju napretka.');
    } finally {
      setLoading(false);
    }
  };

  const korisniciZaFilter = korisnici.filter(k => {
    if (currentUser.role === 'rukovodilac') return k.rukovodilac === currentUser.id || k.id === currentUser.id;
    return true;
  });

  const filtrirani = dodeljeni.filter(d => {
    if (filterKorisnik && d.korisnik !== Number(filterKorisnik)) return false;
    if (samoAktivni && d.datum_Do < danas()) return false;
    return true;
  });

  const smeDaUnosi = (d: DodeljeniKPI) => {
    if (jeAdmin) return true;
    if (currentUser.role === 'rukovodilac') {
      const k = korisnici.find(x => x.id === d.korisnik);
      return !!k && k.rukovodilac === currentUser.id;
    }
    return false;
  };

  const otvoriDetalj = async (d: DodeljeniKPI) => {
    setError(null);
    setSuccess(null);
    if (otvoren?.id === d.id) {
      setOtvoren(null);
      return;
    }
    try {
      const detalj = await dodeljeniKpiApi.getById(d.id);
      setOtvoren(detalj);
      setUnos({ ostvarena_vrednost: '', datum: danas(), opis: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri učitavanju istorije.');
    }
  };

  const osvezi = async (id: number) => {
    const [lista, detalj] = await Promise.all([dodeljeniKpiApi.getAll(), dodeljeniKpiApi.getById(id)]);
    setDodeljeni(lista);
    setOtvoren(detalj);
  };

  const handleUnos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otvoren) return;
    setError(null);
    setSuccess(null);

    if (unos.ostvarena_vrednost === '' || Number(unos.ostvarena_vrednost) < 0) {
      setError('Ostvarena vrednost mora biti broj veći ili jednak nuli.');
      return;
    }
    if (!unos.datum) {
      setError('Datum je obavezan.');
      return;
    }

    setCuvanje(true);
    try {
      await ostvareniKpiApi.create({
        dodeljeni_kpi: otvoren.id,
        ostvarena_vrednost: unos.ostvarena_vrednost,
        datum: unos.datum,
        opis: unos.opis,
      });
      setSuccess('Napredak je evidentiran.');
      setUnos({ ostvarena_vrednost: '', datum: danas(), opis: '' });
      await osvezi(otvoren.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri unosu napretka.');
    } finally {
      setCuvanje(false);
    }
  };

  const obrisiUnos = async (id: number) => {
    if (!otvoren) return;
    if (!window.confirm('Obrisati ovaj unos napretka?')) return;
    try {
      await ostvareniKpiApi.delete(id);
      await osvezi(otvoren.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri brisanju unosa.');
    }
  };

  const obrisiDodelu = async (d: DodeljeniKPI) => {
    if (!window.confirm(`Ukloniti KPI "${d.kpi_naziv}" zaposlenom ${d.korisnik_ime}?`)) return;
    try {
      await dodeljeniKpiApi.delete(d.id);
      setSuccess('Dodela KPI je uklonjena.');
      if (otvoren?.id === d.id) setOtvoren(null);
      setDodeljeni(await dodeljeniKpiApi.getAll());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri uklanjanju dodele.');
    }
  };

  const klasaProgress = (procenat: number) => procenat >= 100 ? 'uspeh' : procenat >= 50 ? '' : 'upozorenje';

  if (loading) {
    return <div className="pregled-wrapper"><div className="pregled-card">Učitavanje...</div></div>;
  }

  return (
    <div className="pregled-wrapper">
      <div className="pregled-card">
        <div className="pregled-header">
          <h1 className="pregled-title">Napredak KPI</h1>
          {mozeDaUpravlja && onDodela && <Button variant="primary" onClick={onDodela}>Dodela KPI</Button>}
        </div>

        {error && <div className="poruka greska">{error}</div>}
        {success && <div className="poruka uspeh">{success}</div>}

        <div className="forma-red" style={{ alignItems: 'flex-end', marginBottom: '10px' }}>
          {mozeDaUpravlja && (
            <div className="form-group">
              <label htmlFor="filterKorisnik">Zaposleni</label>
              <select id="filterKorisnik" className="form-control" value={filterKorisnik} onChange={(e) => setFilterKorisnik(e.target.value)}>
                <option value="">-- Svi --</option>
                {korisniciZaFilter.map(k => <option key={k.id} value={k.id}>{k.first_name} {k.last_name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: '0 0 auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={samoAktivni} onChange={(e) => setSamoAktivni(e.target.checked)} />
              Samo aktivni periodi
            </label>
          </div>
        </div>

        {filtrirani.length === 0 ? (
          <div className="prazno">Nema dodeljenih KPI.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                {mozeDaUpravlja && <th>Zaposleni</th>}
                <th>KPI</th>
                <th>Period</th>
                <th>Target</th>
                <th>Ostvareno</th>
                <th style={{ minWidth: '160px' }}>Napredak</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrirani.map(d => (
                <tr key={d.id} className={otvoren?.id === d.id ? 'izabran' : ''}>
                  {mozeDaUpravlja && <td>{d.korisnik_ime}</td>}
                  <td><strong>{d.kpi_naziv}</strong>{d.kpi_opis && <div className="help-text">{d.kpi_opis}</div>}</td>
                  <td>{formatDate(d.datum_Od)} - {formatDate(d.datum_Do)}</td>
                  <td>{Number(d.kpi_target).toLocaleString('sr-RS')}</td>
                  <td>{d.poslednja_vrednost !== null && d.poslednja_vrednost !== undefined ? Number(d.poslednja_vrednost).toLocaleString('sr-RS') : '—'}</td>
                  <td>
                    <div className="progress">
                      <div className={`progress-bar ${klasaProgress(d.procenat)}`} style={{ width: `${Math.min(d.procenat, 100)}%` }} />
                    </div>
                    <div className="progress-tekst">{d.procenat}% ({d.broj_unosa} unosa)</div>
                  </td>
                  <td>
                    <div className="tabela-akcije">
                      <Button variant="outline" onClick={() => otvoriDetalj(d)}>{otvoren?.id === d.id ? 'Sakrij' : 'Napredak'}</Button>
                      {smeDaUnosi(d) && <Button variant="danger" onClick={() => obrisiDodelu(d)}>Ukloni</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {otvoren && (
        <div className="pregled-card">
          <div className="pregled-header">
            <h2 className="pregled-title" style={{ fontSize: '22px' }}>
              {otvoren.kpi_naziv} — {otvoren.korisnik_ime}
            </h2>
            <Button variant="cancel" onClick={() => setOtvoren(null)}>Zatvori</Button>
          </div>

          <div className="stat-grid">
            <div className="stat-tile">
              <div className="stat-vrednost">{Number(otvoren.kpi_target).toLocaleString('sr-RS')}</div>
              <div className="stat-naziv">Target</div>
            </div>
            <div className="stat-tile">
              <div className="stat-vrednost">{otvoren.poslednja_vrednost !== null && otvoren.poslednja_vrednost !== undefined ? Number(otvoren.poslednja_vrednost).toLocaleString('sr-RS') : '—'}</div>
              <div className="stat-naziv">Poslednja vrednost</div>
            </div>
            <div className={`stat-tile ${klasaProgress(otvoren.procenat)}`}>
              <div className="stat-vrednost">{otvoren.procenat}%</div>
              <div className="stat-naziv">Ostvarenje</div>
            </div>
          </div>

          {smeDaUnosi(otvoren) && (
            <form onSubmit={handleUnos} style={{ marginBottom: '20px' }}>
              <div className="pregled-subtitle" style={{ marginTop: 0 }}>Unos napretka</div>
              <div className="forma-red" style={{ alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label htmlFor="ostvarena_vrednost" className="required">Ostvarena vrednost</label>
                  <input type="number" id="ostvarena_vrednost" className="form-control" min="0" step="0.01" value={unos.ostvarena_vrednost} onChange={(e) => { setUnos({ ...unos, ostvarena_vrednost: e.target.value }); setError(null); }} />
                </div>
                <div className="form-group">
                  <label htmlFor="datum" className="required">Datum</label>
                  <input type="date" id="datum" className="form-control" value={unos.datum} onChange={(e) => setUnos({ ...unos, datum: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="opisUnosa">Komentar</label>
                  <input type="text" id="opisUnosa" className="form-control" value={unos.opis} onChange={(e) => setUnos({ ...unos, opis: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: '0 0 auto' }}>
                  <Button type="submit" variant="save" disabled={cuvanje}>{cuvanje ? 'Čuvanje...' : 'Evidentiraj'}</Button>
                </div>
              </div>
            </form>
          )}

          <div className="pregled-subtitle">Istorija unosa</div>
          {!otvoren.istorija || otvoren.istorija.length === 0 ? (
            <div className="prazno">Još nema unosa napretka.</div>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Ostvarena vrednost</th>
                  <th>% targeta</th>
                  <th>Komentar</th>
                  <th>Uneo</th>
                  {smeDaUnosi(otvoren) && <th></th>}
                </tr>
              </thead>
              <tbody>
                {otvoren.istorija.map(u => (
                  <tr key={u.id}>
                    <td>{formatDate(u.datum)}</td>
                    <td>{Number(u.ostvarena_vrednost).toLocaleString('sr-RS')}</td>
                    <td>{(Number(u.ostvarena_vrednost) / Number(otvoren.kpi_target) * 100).toFixed(1)}%</td>
                    <td>{u.opis || '—'}</td>
                    <td>{u.rukovodilac_ime || '—'}</td>
                    {smeDaUnosi(otvoren) && <td><Button variant="danger" onClick={() => obrisiUnos(u.id)}>Obriši</Button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
