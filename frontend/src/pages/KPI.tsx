import { useState, useEffect } from 'react';
import { kpiApi } from '../api';
import type { KPI as KPIType, KorisnikFull } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

interface KPIProps {
  currentUser: KorisnikFull;
  onDodela: () => void;
}

export function KPI({ currentUser, onDodela }: KPIProps) {
  const jeAdmin = currentUser.role === 'superuser' || currentUser.role === 'administrator';
  const mozeDaUpravlja = jeAdmin || currentUser.role === 'rukovodilac';

  const [lista, setLista] = useState<KPIType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ id: null as number | null, naziv: '', opis: '', target: '' });
  const [cuvanje, setCuvanje] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLista(await kpiApi.getAll());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri učitavanju KPI.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({ id: null, naziv: '', opis: '', target: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.naziv.trim()) {
      setError('Naziv KPI je obavezan.');
      return;
    }
    if (form.target === '' || Number(form.target) <= 0) {
      setError('Target mora biti pozitivan broj.');
      return;
    }

    setCuvanje(true);
    try {
      if (form.id) {
        await kpiApi.update(form.id, { naziv: form.naziv.trim(), opis: form.opis, target: form.target });
        setSuccess('KPI je izmenjen.');
      } else {
        await kpiApi.create({ naziv: form.naziv.trim(), opis: form.opis, target: form.target });
        setSuccess('KPI je kreiran.');
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri čuvanju KPI.');
    } finally {
      setCuvanje(false);
    }
  };

  const izmeni = (k: KPIType) => {
    setForm({ id: k.id, naziv: k.naziv, opis: k.opis || '', target: k.target });
    setError(null);
    setSuccess(null);
  };

  const obrisi = async (k: KPIType) => {
    if (!window.confirm(`Obrisati KPI "${k.naziv}"? Biće obrisane i sve dodele ovog KPI.`)) return;
    try {
      await kpiApi.delete(k.id);
      setSuccess('KPI je obrisan.');
      if (form.id === k.id) resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri brisanju KPI.');
    }
  };

  if (loading) {
    return <div className="pregled-wrapper"><div className="pregled-card">Učitavanje...</div></div>;
  }

  return (
    <div className="pregled-wrapper">
      <div className="pregled-card">
        <div className="pregled-header">
          <h1 className="pregled-title">KPI (ključni indikatori)</h1>
          {mozeDaUpravlja && <Button variant="primary" onClick={onDodela}>Dodela KPI</Button>}
        </div>

        {error && <div className="poruka greska">{error}</div>}
        {success && <div className="poruka uspeh">{success}</div>}

        {mozeDaUpravlja && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <div className="pregled-subtitle" style={{ marginTop: 0 }}>{form.id ? 'Izmena KPI' : 'Novi KPI'}</div>
            <div className="forma-red">
              <div className="form-group" style={{ flex: 2 }}>
                <label htmlFor="naziv" className="required">Naziv</label>
                <input type="text" id="naziv" name="naziv" className="form-control" value={form.naziv} onChange={handleChange} placeholder="npr. Broj zatvorenih tiketa" />
              </div>
              <div className="form-group">
                <label htmlFor="target" className="required">Target (ciljna vrednost)</label>
                <input type="number" id="target" name="target" className="form-control" min="0.01" step="0.01" value={form.target} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="opis">Opis / metrika</label>
              <textarea id="opis" name="opis" className="form-control" style={{ minHeight: '80px' }} value={form.opis} onChange={handleChange} placeholder="Kako se meri ovaj indikator" />
            </div>
            <div className="form-buttons">
              <Button type="submit" variant="save" disabled={cuvanje}>{cuvanje ? 'Čuvanje...' : (form.id ? 'Sačuvaj izmene' : 'Kreiraj KPI')}</Button>
              {form.id && <Button variant="cancel" onClick={resetForm}>Otkaži</Button>}
            </div>
          </form>
        )}

        <div className="pregled-subtitle">Definisani KPI</div>
        {lista.length === 0 ? (
          <div className="prazno">Nema definisanih KPI.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Opis</th>
                <th>Target</th>
                {mozeDaUpravlja && <th></th>}
              </tr>
            </thead>
            <tbody>
              {lista.map(k => (
                <tr key={k.id} className={form.id === k.id ? 'izabran' : ''}>
                  <td><strong>{k.naziv}</strong></td>
                  <td>{k.opis || '—'}</td>
                  <td>{Number(k.target).toLocaleString('sr-RS')}</td>
                  {mozeDaUpravlja && (
                    <td>
                      <div className="tabela-akcije">
                        <Button variant="outline" onClick={() => izmeni(k)}>Izmeni</Button>
                        {jeAdmin && <Button variant="danger" onClick={() => obrisi(k)}>Obriši</Button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
