import { useState, useEffect } from 'react';
import { plateApi, isplateApi, radnaMestaApi } from '../api';
import type { Plata, Isplata, PlatePregled, RadnoMesto } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('sr-RS');
};

const formatIznos = (iznos: string | null | undefined) => {
  if (iznos === null || iznos === undefined || iznos === '') return '—';
  return Number(iznos).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function Plate() {
  const [plate, setPlate] = useState<Plata[]>([]);
  const [radnaMesta, setRadnaMesta] = useState<RadnoMesto[]>([]);
  const [pregled, setPregled] = useState<PlatePregled[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [plataForm, setPlataForm] = useState({ id: null as number | null, radno_mesto: '', bruto: '', neto: '' });
  const [plataLoading, setPlataLoading] = useState(false);

  const [izabraniZaposleni, setIzabraniZaposleni] = useState<PlatePregled | null>(null);
  const [isplate, setIsplate] = useState<Isplata[]>([]);
  const [isplataForm, setIsplataForm] = useState({ datum_isplate: '', iznos_bruto: '', iznos_neto: '', bonus: '0' });
  const [isplataLoading, setIsplataLoading] = useState(false);
  const [pretraga, setPretraga] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plateData, rmData, pregledData] = await Promise.all([
        plateApi.getAll(),
        radnaMestaApi.getAll(),
        plateApi.pregled(),
      ]);
      setPlate(plateData);
      setRadnaMesta(rmData);
      setPregled(pregledData);
      if (izabraniZaposleni) {
        const osvezen = pregledData.find(p => p.id === izabraniZaposleni.id) || null;
        setIzabraniZaposleni(osvezen);
      }
    } catch (err: any) {
      console.error('Greska pri ucitavanju plata:', err);
      setError(err.response?.data?.error || 'Greška pri učitavanju podataka o platama.');
    } finally {
      setLoading(false);
    }
  };

  const radnaMestaBezPlate = radnaMesta.filter(rm => !plate.some(p => p.radno_mesto === rm.id));

  const resetPlataForm = () => setPlataForm({ id: null, radno_mesto: '', bruto: '', neto: '' });

  const handlePlataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPlataForm({ ...plataForm, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handlePlataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!plataForm.id && !plataForm.radno_mesto) {
      setError('Radno mesto je obavezno.');
      return;
    }
    if (plataForm.bruto === '' || plataForm.neto === '') {
      setError('Bruto i neto iznos su obavezni.');
      return;
    }
    if (Number(plataForm.bruto) < 0 || Number(plataForm.neto) < 0) {
      setError('Iznosi ne mogu biti negativni.');
      return;
    }
    if (Number(plataForm.neto) > Number(plataForm.bruto)) {
      setError('Neto iznos ne može biti veći od bruto iznosa.');
      return;
    }

    setPlataLoading(true);
    try {
      if (plataForm.id) {
        await plateApi.update(plataForm.id, { bruto: plataForm.bruto, neto: plataForm.neto });
        setSuccess('Plata je uspešno izmenjena.');
      } else {
        await plateApi.create({ radno_mesto: Number(plataForm.radno_mesto), bruto: plataForm.bruto, neto: plataForm.neto });
        setSuccess('Plata je uspešno sačuvana.');
      }
      resetPlataForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri čuvanju plate.');
    } finally {
      setPlataLoading(false);
    }
  };

  const izmeniPlatu = (p: Plata) => {
    setPlataForm({ id: p.id, radno_mesto: String(p.radno_mesto), bruto: p.bruto, neto: p.neto });
    setError(null);
    setSuccess(null);
  };

  const obrisiPlatu = async (p: Plata) => {
    if (!window.confirm(`Obrisati platu za radno mesto "${p.radno_mesto_naziv}"?`)) return;
    try {
      await plateApi.delete(p.id);
      setSuccess('Plata je obrisana.');
      if (plataForm.id === p.id) resetPlataForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri brisanju plate.');
    }
  };

  const izaberiZaposlenog = async (z: PlatePregled) => {
    setIzabraniZaposleni(z);
    setError(null);
    setSuccess(null);
    setIsplataForm({
      datum_isplate: '',
      iznos_bruto: z.bruto || '',
      iznos_neto: z.neto || '',
      bonus: '0',
    });
    try {
      const data = await isplateApi.getAll({ korisnik: z.id });
      setIsplate(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri učitavanju isplata.');
    }
  };

  const handleIsplataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsplataForm({ ...isplataForm, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleIsplataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!izabraniZaposleni) return;
    setError(null);
    setSuccess(null);

    if (!isplataForm.datum_isplate) {
      setError('Datum isplate je obavezan.');
      return;
    }
    if (isplataForm.iznos_bruto === '' || isplataForm.iznos_neto === '') {
      setError('Bruto i neto iznos su obavezni.');
      return;
    }
    if (Number(isplataForm.iznos_bruto) < 0 || Number(isplataForm.iznos_neto) < 0 || Number(isplataForm.bonus || 0) < 0) {
      setError('Nevalidan unos: iznosi ne mogu biti negativni.');
      return;
    }
    if (Number(isplataForm.iznos_neto) > Number(isplataForm.iznos_bruto)) {
      setError('Neto iznos ne može biti veći od bruto iznosa.');
      return;
    }

    setIsplataLoading(true);
    try {
      await isplateApi.create({
        korisnik: izabraniZaposleni.id,
        datum_isplate: isplataForm.datum_isplate,
        iznos_bruto: isplataForm.iznos_bruto,
        iznos_neto: isplataForm.iznos_neto,
        bonus: isplataForm.bonus || '0',
      });
      setSuccess(`Isplata za ${izabraniZaposleni.ime} je uspešno evidentirana.`);
      setIsplataForm({ ...isplataForm, datum_isplate: '', bonus: '0' });
      const [data] = await Promise.all([isplateApi.getAll({ korisnik: izabraniZaposleni.id }), loadData()]);
      setIsplate(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri evidentiranju isplate.');
    } finally {
      setIsplataLoading(false);
    }
  };

  const obrisiIsplatu = async (i: Isplata) => {
    if (!izabraniZaposleni) return;
    if (!window.confirm(`Obrisati isplatu od ${formatDate(i.datum_isplate)}?`)) return;
    try {
      await isplateApi.delete(i.id);
      setSuccess('Isplata je obrisana.');
      const [data] = await Promise.all([isplateApi.getAll({ korisnik: izabraniZaposleni.id }), loadData()]);
      setIsplate(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri brisanju isplate.');
    }
  };

  const filtriraniPregled = pregled.filter(p =>
    pretraga === '' ||
    p.ime.toLowerCase().includes(pretraga.toLowerCase()) ||
    (p.radno_mesto_naziv || '').toLowerCase().includes(pretraga.toLowerCase()) ||
    (p.organizaciona_jedinica_naziv || '').toLowerCase().includes(pretraga.toLowerCase())
  );

  if (loading) {
    return <div className="pregled-wrapper"><div className="pregled-card">Učitavanje...</div></div>;
  }

  return (
    <div className="pregled-wrapper">
      <div className="pregled-card">
        <div className="pregled-header">
          <h1 className="pregled-title">Plate i benefiti</h1>
        </div>

        {error && <div className="poruka greska">{error}</div>}
        {success && <div className="poruka uspeh">{success}</div>}

        <div className="pregled-subtitle">Plate po radnom mestu</div>

        <form onSubmit={handlePlataSubmit} style={{ marginBottom: '20px' }}>
          <div className="forma-red">
            <div className="form-group">
              <label htmlFor="radno_mesto" className="required">Radno mesto</label>
              {plataForm.id ? (
                <input
                  type="text"
                  className="form-control"
                  value={radnaMesta.find(rm => rm.id === Number(plataForm.radno_mesto))?.naziv || ''}
                  disabled
                />
              ) : (
                <select
                  id="radno_mesto"
                  name="radno_mesto"
                  className="form-control"
                  value={plataForm.radno_mesto}
                  onChange={handlePlataChange}
                >
                  <option value="">-- Izaberite radno mesto --</option>
                  {radnaMestaBezPlate.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.naziv} ({rm.org_jed_naziv})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="bruto" className="required">Bruto iznos</label>
              <input type="number" id="bruto" name="bruto" className="form-control" min="0" step="0.01" value={plataForm.bruto} onChange={handlePlataChange} />
            </div>
            <div className="form-group">
              <label htmlFor="neto" className="required">Neto iznos</label>
              <input type="number" id="neto" name="neto" className="form-control" min="0" step="0.01" value={plataForm.neto} onChange={handlePlataChange} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flex: '0 0 auto' }}>
              <Button type="submit" variant="save" disabled={plataLoading}>
                {plataForm.id ? 'Sačuvaj izmene' : 'Dodaj platu'}
              </Button>
              {plataForm.id && <Button variant="cancel" onClick={resetPlataForm}>Otkaži</Button>}
            </div>
          </div>
        </form>

        {plate.length === 0 ? (
          <div className="prazno">Nema definisanih plata po radnim mestima.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Org. jedinica</th>
                <th>Radno mesto</th>
                <th>Bruto</th>
                <th>Neto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plate.map(p => (
                <tr key={p.id} className={plataForm.id === p.id ? 'izabran' : ''}>
                  <td>{p.org_jed_naziv}</td>
                  <td>{p.radno_mesto_naziv}</td>
                  <td>{formatIznos(p.bruto)}</td>
                  <td>{formatIznos(p.neto)}</td>
                  <td>
                    <div className="tabela-akcije">
                      <Button variant="outline" onClick={() => izmeniPlatu(p)}>Izmeni</Button>
                      <Button variant="danger" onClick={() => obrisiPlatu(p)}>Obriši</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="pregled-subtitle">Zaposleni i finansijski podaci</div>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Pretraži po imenu, radnom mestu ili org. jedinici..."
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
          />
        </div>
        {filtriraniPregled.length === 0 ? (
          <div className="prazno">Nema zaposlenih.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Zaposleni</th>
                <th>Radno mesto</th>
                <th>Bruto</th>
                <th>Neto</th>
                <th>Isplata</th>
                <th>Poslednja isplata</th>
                <th>Isplaćeno neto (god.)</th>
                <th>Bonusi (god.)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtriraniPregled.map(z => (
                <tr key={z.id} className={izabraniZaposleni?.id === z.id ? 'izabran' : ''}>
                  <td>{z.ime}<div className="help-text">{z.organizaciona_jedinica_naziv || '—'}</div></td>
                  <td>{z.radno_mesto_naziv || '—'}</td>
                  <td>{formatIznos(z.bruto)}</td>
                  <td>{formatIznos(z.neto)}</td>
                  <td>{z.broj_isplata}</td>
                  <td>{formatDate(z.poslednja_isplata)}</td>
                  <td>{formatIznos(z.isplaceno_neto_godina)}</td>
                  <td>{formatIznos(z.bonusi_godina)}</td>
                  <td>
                    <Button variant="primary" onClick={() => izaberiZaposlenog(z)}>Isplate</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {izabraniZaposleni && (
        <div className="pregled-card">
          <div className="pregled-header">
            <h2 className="pregled-title" style={{ fontSize: '22px' }}>Isplate: {izabraniZaposleni.ime}</h2>
            <Button variant="cancel" onClick={() => setIzabraniZaposleni(null)}>Zatvori</Button>
          </div>

          {!izabraniZaposleni.plata_id && (
            <div className="poruka upozorenje">
              Za radno mesto ovog zaposlenog nije definisana plata, pa iznose morate uneti ručno.
            </div>
          )}

          <form onSubmit={handleIsplataSubmit} style={{ marginBottom: '20px' }}>
            <div className="forma-red">
              <div className="form-group">
                <label htmlFor="datum_isplate" className="required">Datum isplate</label>
                <input type="date" id="datum_isplate" name="datum_isplate" className="form-control" value={isplataForm.datum_isplate} onChange={handleIsplataChange} />
              </div>
              <div className="form-group">
                <label htmlFor="iznos_bruto" className="required">Bruto</label>
                <input type="number" id="iznos_bruto" name="iznos_bruto" className="form-control" min="0" step="0.01" value={isplataForm.iznos_bruto} onChange={handleIsplataChange} />
              </div>
              <div className="form-group">
                <label htmlFor="iznos_neto" className="required">Neto</label>
                <input type="number" id="iznos_neto" name="iznos_neto" className="form-control" min="0" step="0.01" value={isplataForm.iznos_neto} onChange={handleIsplataChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bonus">Bonus</label>
                <input type="number" id="bonus" name="bonus" className="form-control" min="0" step="0.01" value={isplataForm.bonus} onChange={handleIsplataChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', flex: '0 0 auto' }}>
                <Button type="submit" variant="save" disabled={isplataLoading}>
                  {isplataLoading ? 'Čuvanje...' : 'Evidentiraj isplatu'}
                </Button>
              </div>
            </div>
          </form>

          {isplate.length === 0 ? (
            <div className="prazno">Nema evidentiranih isplata.</div>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Bruto</th>
                  <th>Neto</th>
                  <th>Bonus</th>
                  <th>Ukupno neto</th>
                  <th>Evidentirao</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isplate.map(i => (
                  <tr key={i.id}>
                    <td>{formatDate(i.datum_isplate)}</td>
                    <td>{formatIznos(i.iznos_bruto)}</td>
                    <td>{formatIznos(i.iznos_neto)}</td>
                    <td>{formatIznos(i.bonus)}</td>
                    <td><strong>{formatIznos(i.ukupno_neto)}</strong></td>
                    <td>{i.izmenio_ime || '—'}<div className="help-text">{formatDate(i.datum_izmene)}</div></td>
                    <td><Button variant="danger" onClick={() => obrisiIsplatu(i)}>Obriši</Button></td>
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
