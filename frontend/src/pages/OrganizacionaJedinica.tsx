import { useState, useEffect } from 'react';
import { organizacioneJediniceApi, korisniciApi} from '../api';
import type { OrganizacionaJedinica as OrgJedinicaType, Korisnik } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';

interface OrganizacionaJedinicaProps {
  onSave: () => void;
  onCancel: () => void;
}

export function OrganizacionaJedinica({
  onSave,
  onCancel,
}: OrganizacionaJedinicaProps) {
  const [jedinice, setJedinice] = useState<OrgJedinicaType[]>([])
  const [rukovodioci, setRukovodioci] = useState<Korisnik[]>([]);
  const [formData, setFormData] = useState({
    naziv: '',
    opis: '',
    nadredjena_org_jed: '',
    rukovodilac: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jediniceData, korisniciData] = await Promise.all([
        organizacioneJediniceApi.getAll(),
        korisniciApi.getAll(),
      ]);
      setJedinice(jediniceData);
      setRukovodioci(korisniciData.filter(k => k.role === 'rukovodilac' || k.role === 'administrator'));
    } catch (err) {
      console.error('Greska pri ucitavanju podataka:', err);
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

    setLoading(true);

    try {
      const payload: any = {
        naziv: formData.naziv.trim(),
        opis: formData.opis,
      };

      if (formData.nadredjena_org_jed) {
        payload.nadredjena_org_jed = Number(formData.nadredjena_org_jed);
      }

      if (formData.rukovodilac) {
        payload.rukovodilac = Number(formData.rukovodilac);
      }

      await organizacioneJediniceApi.create(payload);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greska pri kreiranju organizacione jedinice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">Nova organizaciona jedinica</h1>
              
            <div className="form-buttons">
              <Button type="submit" variant="save" disabled={loading}>
                {loading ? 'Cuvanje...' : 'Sacuvaj'}
              </Button>
              <Button variant="cancel" onClick={onCancel}>Otkaži</Button>
            </div>
          </div>

          {error && (
            <div className="no-units-warning" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
              {error}
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
            <label htmlFor="nadredjena_org_jed">Nadređena organizaciona jedinica</label>
            <select
              id="nadredjena_org_jed"
              name="nadredjena_org_jed"
              className="form-control"
              value={formData.nadredjena_org_jed}
              onChange={handleChange}
            >
              <option value="">— Nema nadređenu jedinicu —</option>
              {jedinice.map(j => (
                <option key={j.id} value={j.id}>{j.naziv}</option>
              ))}
            </select>
            <div className="help-text">Ostavite prazno ako ovo nema nadređenu jedinicu (najviši nivo)</div>
          </div>
          <div className="form-group">
            <label htmlFor="rukovodilac">Rukovodilac organizacione jedinice</label>
            <select
              id="rukovodilac"
              name="rukovodilac"
              className="form-control"
              value={formData.rukovodilac}
              onChange={handleChange}
            >
              <option value="">— Nije određen —</option>
              {rukovodioci.map(r => (
                <option key={r.id} value={r.id}>{r.first_name} {r.last_name} ({r.role})</option>
              ))}
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}
