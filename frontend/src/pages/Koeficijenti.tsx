import { useState, useEffect } from 'react';
import { oblastiOcenjivanjaApi, koeficijentiApi, radnaMestaApi } from '../api';
import type { OblastOcenjivanja, TezinskiKoeficijent, RadnoMesto } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

const prazanForm = () => ({
  id: null as number | null,
  radno_mesto: '',
  oblasti: ['', '', '', '', ''],
  koef: ['', '', '', '', ''],
});

export function Koeficijenti() {
  const [oblasti, setOblasti] = useState<OblastOcenjivanja[]>([]);
  const [koeficijenti, setKoeficijenti] = useState<TezinskiKoeficijent[]>([]);
  const [radnaMesta, setRadnaMesta] = useState<RadnoMesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState(prazanForm());
  const [cuvanje, setCuvanje] = useState(false);

  const [novaOblast, setNovaOblast] = useState({ naziv: '', opis: '' });
  const [showNovaOblast, setShowNovaOblast] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oblastiData, koefData, rmData] = await Promise.all([
        oblastiOcenjivanjaApi.getAll(),
        koeficijentiApi.getAll(),
        radnaMestaApi.getAll(),
      ]);
      setOblasti(oblastiData);
      setKoeficijenti(koefData);
      setRadnaMesta(rmData);
    } catch (err: any) {
      console.error('Greska pri ucitavanju koeficijenata:', err);
      setError(err.response?.data?.error || 'Greška pri učitavanju podataka.');
    } finally {
      setLoading(false);
    }
  };

  const zbir = form.koef.reduce((s, k) => s + (k === '' ? 0 : Number(k)), 0);
  const zbirOk = Math.abs(zbir - 1) < 0.0005;
  const radnaMestaBezKoef = radnaMesta.filter(rm => !koeficijenti.some(k => k.radno_mesto === rm.id));

  const handleOblastChange = (i: number, value: string) => {
    const nove = [...form.oblasti];
    nove[i] = value;
    setForm({ ...form, oblasti: nove });
    setError(null);
  };

  const handleKoefChange = (i: number, value: string) => {
    const novi = [...form.koef];
    novi[i] = value;
    setForm({ ...form, koef: novi });
    setError(null);
  };

  const rasporediRavnomerno = () => {
    setForm({ ...form, koef: ['0.2', '0.2', '0.2', '0.2', '0.2'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.radno_mesto) {
      setError('Radno mesto je obavezno.');
      return;
    }
    if (form.oblasti.some(o => o === '') || form.koef.some(k => k === '')) {
      setError('Popunite svih pet oblasti i koeficijenata.');
      return;
    }
    if (new Set(form.oblasti).size !== 5) {
      setError('Sve oblasti ocenjivanja moraju biti različite.');
      return;
    }
    if (form.koef.some(k => Number(k) < 0 || Number(k) > 1)) {
      setError('Svaki koeficijent mora biti između 0 i 1.');
      return;
    }
    if (!zbirOk) {
      setError(`Zbir koeficijenata mora biti tačno 1.0 (trenutno ${zbir.toFixed(3)}).`);
      return;
    }

    const payload = {
      radno_mesto: Number(form.radno_mesto),
      oblast_ocenjivanja_1: Number(form.oblasti[0]),
      oblast_ocenjivanja_2: Number(form.oblasti[1]),
      oblast_ocenjivanja_3: Number(form.oblasti[2]),
      oblast_ocenjivanja_4: Number(form.oblasti[3]),
      oblast_ocenjivanja_5: Number(form.oblasti[4]),
      koef_1: form.koef[0],
      koef_2: form.koef[1],
      koef_3: form.koef[2],
      koef_4: form.koef[3],
      koef_5: form.koef[4],
    };

    setCuvanje(true);
    try {
      if (form.id) {
        await koeficijentiApi.update(form.id, payload);
        setSuccess('Težinski koeficijenti su izmenjeni.');
      } else {
        await koeficijentiApi.create(payload);
        setSuccess('Težinski koeficijenti su sačuvani.');
      }
      setForm(prazanForm());
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri čuvanju koeficijenata.');
    } finally {
      setCuvanje(false);
    }
  };

  const izmeni = (k: TezinskiKoeficijent) => {
    setForm({
      id: k.id,
      radno_mesto: String(k.radno_mesto),
      oblasti: [
        String(k.oblast_ocenjivanja_1),
        String(k.oblast_ocenjivanja_2),
        String(k.oblast_ocenjivanja_3),
        String(k.oblast_ocenjivanja_4),
        String(k.oblast_ocenjivanja_5),
      ],
      koef: [k.koef_1, k.koef_2, k.koef_3, k.koef_4, k.koef_5],
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const obrisi = async (k: TezinskiKoeficijent) => {
    if (!window.confirm(`Obrisati koeficijente za radno mesto "${k.radno_mesto_naziv}"?`)) return;
    try {
      await koeficijentiApi.delete(k.id);
      setSuccess('Koeficijenti su obrisani.');
      if (form.id === k.id) setForm(prazanForm());
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri brisanju koeficijenata.');
    }
  };

  const dodajOblast = async () => {
    if (!novaOblast.naziv.trim()) {
      setError('Unesite naziv oblasti ocenjivanja.');
      return;
    }
    try {
      const nova = await oblastiOcenjivanjaApi.create({ naziv: novaOblast.naziv.trim(), opis: novaOblast.opis });
      setOblasti([...oblasti, nova].sort((a, b) => a.naziv.localeCompare(b.naziv)));
      setNovaOblast({ naziv: '', opis: '' });
      setShowNovaOblast(false);
      setSuccess(`Oblast "${nova.naziv}" je dodata.`);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri kreiranju oblasti.');
    }
  };

  if (loading) {
    return <div className="pregled-wrapper"><div className="pregled-card">Učitavanje...</div></div>;
  }

  return (
    <div className="pregled-wrapper">
      <div className="pregled-card">
        <div className="pregled-header">
          <h1 className="pregled-title">Težinski koeficijenti</h1>
          <Button variant="outline" onClick={() => setShowNovaOblast(!showNovaOblast)}>+ Nova oblast ocenjivanja</Button>
        </div>

        {error && <div className="poruka greska">{error}</div>}
        {success && <div className="poruka uspeh">{success}</div>}

        {showNovaOblast && (
          <div className="forma-red" style={{ marginBottom: '20px', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label htmlFor="novaOblastNaziv" className="required">Naziv oblasti</label>
              <input type="text" id="novaOblastNaziv" className="form-control" value={novaOblast.naziv} onChange={(e) => setNovaOblast({ ...novaOblast, naziv: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="novaOblastOpis">Opis</label>
              <input type="text" id="novaOblastOpis" className="form-control" value={novaOblast.opis} onChange={(e) => setNovaOblast({ ...novaOblast, opis: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: '0 0 auto' }}>
              <Button variant="save" onClick={dodajOblast}>Dodaj</Button>
            </div>
          </div>
        )}

        <div className="help-text" style={{ marginBottom: '20px' }}>
          Oblasti ocenjivanja ({oblasti.length}): {oblasti.length === 0 ? 'nema definisanih oblasti' : oblasti.map(o => o.naziv).join(', ')}
        </div>

        {oblasti.length < 5 ? (
          <div className="poruka upozorenje">
            Potrebno je najmanje 5 različitih oblasti ocenjivanja da bi se definisali koeficijenti (trenutno {oblasti.length}).
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <div className="pregled-subtitle" style={{ marginTop: 0 }}>
              {form.id ? 'Izmena koeficijenata' : 'Novi koeficijenti za radno mesto'}
            </div>
            <div className="form-group">
              <label htmlFor="radno_mesto" className="required">Radno mesto</label>
              {form.id ? (
                <input type="text" className="form-control" value={radnaMesta.find(rm => rm.id === Number(form.radno_mesto))?.naziv || ''} disabled />
              ) : (
                <select id="radno_mesto" className="form-control" value={form.radno_mesto} onChange={(e) => { setForm({ ...form, radno_mesto: e.target.value }); setError(null); }}>
                  <option value="">-- Izaberite radno mesto --</option>
                  {radnaMestaBezKoef.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.naziv} ({rm.org_jed_naziv})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="ocena-red" style={{ fontWeight: 600, color: '#1E293B' }}>
              <span>Oblast ocenjivanja</span>
              <span>Koeficijent (0 - 1)</span>
              <span></span>
            </div>
            {[0, 1, 2, 3, 4].map(i => (
              <div className="ocena-red" key={i}>
                <select className="form-control" value={form.oblasti[i]} onChange={(e) => handleOblastChange(i, e.target.value)}>
                  <option value="">-- Oblast {i + 1} --</option>
                  {oblasti.map(o => (
                    <option key={o.id} value={o.id} disabled={form.oblasti.includes(String(o.id)) && form.oblasti[i] !== String(o.id)}>
                      {o.naziv}
                    </option>
                  ))}
                </select>
                <input type="number" className="form-control" min="0" max="1" step="0.001" value={form.koef[i]} onChange={(e) => handleKoefChange(i, e.target.value)} />
                <span></span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <div className={zbirOk ? 'help-text' : 'poruka upozorenje'} style={{ margin: 0, fontSize: '15px' }}>
                Zbir koeficijenata: <strong>{zbir.toFixed(3)}</strong> {zbirOk ? '(OK)' : '(mora biti 1.000)'}
                {' '}<a href="#" onClick={(e) => { e.preventDefault(); rasporediRavnomerno(); }}>rasporedi ravnomerno</a>
              </div>
              <div className="form-buttons">
                <Button type="submit" variant="save" disabled={cuvanje}>{cuvanje ? 'Čuvanje...' : (form.id ? 'Sačuvaj izmene' : 'Sačuvaj')}</Button>
                {form.id && <Button variant="cancel" onClick={() => setForm(prazanForm())}>Otkaži</Button>}
              </div>
            </div>
          </form>
        )}

        <div className="pregled-subtitle">Definisani koeficijenti po radnim mestima</div>
        {koeficijenti.length === 0 ? (
          <div className="prazno">Nema definisanih koeficijenata.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Org. jedinica</th>
                <th>Radno mesto</th>
                <th>Oblasti i koeficijenti</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {koeficijenti.map(k => (
                <tr key={k.id} className={form.id === k.id ? 'izabran' : ''}>
                  <td>{k.org_jed_naziv}</td>
                  <td>{k.radno_mesto_naziv}</td>
                  <td>
                    <ul className="detalj-lista">
                      <li><span>{k.oblast_1_naziv}</span><span>{Number(k.koef_1).toFixed(3)}</span></li>
                      <li><span>{k.oblast_2_naziv}</span><span>{Number(k.koef_2).toFixed(3)}</span></li>
                      <li><span>{k.oblast_3_naziv}</span><span>{Number(k.koef_3).toFixed(3)}</span></li>
                      <li><span>{k.oblast_4_naziv}</span><span>{Number(k.koef_4).toFixed(3)}</span></li>
                      <li><span>{k.oblast_5_naziv}</span><span>{Number(k.koef_5).toFixed(3)}</span></li>
                    </ul>
                  </td>
                  <td>
                    <div className="tabela-akcije">
                      <Button variant="outline" onClick={() => izmeni(k)}>Izmeni</Button>
                      <Button variant="danger" onClick={() => obrisi(k)}>Obriši</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
