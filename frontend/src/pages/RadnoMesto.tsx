import { useState, useEffect } from 'react';
import type { RadnoMesto as RadnoMestoType, OrganizacionaJedinica } from '../types';
import './FormPage.css';

interface RadnoMestoProps {
  radnoMesto?: RadnoMestoType | null;
  jedinice: OrganizacionaJedinica[];
  isEdit?: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function RadnoMesto({
  radnoMesto,
  jedinice,
  isEdit,
  onSave,
  onCancel,
}: RadnoMestoProps) {
  const [formData, setFormData] = useState({
    naziv: radnoMesto?.naziv || '',
    opis: radnoMesto?.opis || '',
    org_jed: radnoMesto?.org_jed || '',
  });

  useEffect(() => {
    if (radnoMesto) {
      setFormData({
        naziv: radnoMesto.naziv || '',
        opis: radnoMesto.opis || '',
        org_jed: radnoMesto.org_jed || '',
      });
    }
  }, [radnoMesto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="form-wrapper">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">
              {isEdit ? 'Izmeni radno mesto' : 'Novo radno mesto'}
            </h1>
            <div className="form-buttons">
              <button type="submit" className="btn-save" disabled={jedinice.length === 0}>Sačuvaj</button>
              <button type="button" onClick={onCancel} className="btn-cancel">Otkaži</button>
            </div>
          </div>

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
