import { useState, useEffect } from 'react';
import { organizacioneJediniceApi, radnaMestaApi } from '../api';
import type { OrganizacionaJedinica } from '../types';
import './FormPage.css';

interface RadnoMestoProps {
  onSave: () => void;
  onCancel: () => void;
}

export function RadnoMesto({
  onSave,
  onCancel,
}: RadnoMestoProps) {
  const [jedinice, setJedinice] = useState<OrganizacionaJedinica[]>([]);
  const [formData, setFormData] = useState({
    naziv: '',
    opis: '',
    org_jed: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJedinice();
  }, []);

  const loadJedinice = async () => {
    try {
      const data = await organizacioneJediniceApi.getAll();
      setJedinice(data);
    } catch (err) {
      console.error('Greska pri ucitavanju organizacionih jedinica:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.naziv.trim()) {
      setError('Naziv je obavezan.');
      return;
    }

    if (!formData.org_jed) {
      setError('Organizaciona jedinica je obavezna.');
      return;
    }

    setLoading(true);

    try {
      await radnaMestaApi.create({
        naziv: formData.naziv.trim(),
        opis: formData.opis,
        org_jed: Number(formData.org_jed),
      });
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greska pri kreiranju radnog mesta.');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="form-wrapper">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">Novo radno mesto</h1>
              
            
            <div className="form-buttons">
              <button type="submit" className="btn-save" disabled={loading || jedinice.length === 0}>
                {loading ? 'Cuvanje...' : 'Sacuvaj'}
              </button>
              <button type="button" onClick={onCancel} className="btn-cancel">Otkaži</button>
            </div>
          </div>

          {error && (
            <div className="no-units-warning" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {jedinice.length === 0 && (
            <div className="no-units-warning">
              <p>Morate prvo kreirati organizacionu jedinicu.</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="naziv" className="required">Naziv</label>
            <input
              type="text"
              id="naziv"
              name="naziv"
              className="form-control"
              value={formData.naziv}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="opis">Opis</label>
            <textarea
              id="opis"
              name="opis"
              className="form-control"
              value={formData.opis}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="org_jed" className="required">Organizaciona jedinica</label>
            <select
              id="org_jed"
              name="org_jed"
              className="form-control"
              value={formData.org_jed}
              onChange={handleChange}
              required
            >
              <option value="">— Odaberite organizacionu jedinicu —</option>
              {jedinice.map(j => (
                <option key={j.id} value={j.id}>{j.naziv}</option>
              ))}
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}
