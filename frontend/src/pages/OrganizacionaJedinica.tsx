import { useState, useEffect } from 'react';
import type { OrganizacionaJedinica as OrgJedinicaType } from '../types';
import './FormPage.css';

interface OrganizacionaJedinicaProps {
  jedinica?: OrgJedinicaType | null;
  jedinice: OrgJedinicaType[];
  isEdit?: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function OrganizacionaJedinica({
  jedinica,
  jedinice,
  isEdit,
  onSave,
  onCancel,
}: OrganizacionaJedinicaProps) {
  const [formData, setFormData] = useState({
    naziv: jedinica?.naziv || '',
    opis: jedinica?.opis || '',
    nadredjena_org_jed: jedinica?.nadredjena_org_jed || '',
  });

  useEffect(() => {
    if (jedinica) {
      setFormData({
        naziv: jedinica.naziv || '',
        opis: jedinica.opis || '',
        nadredjena_org_jed: jedinica.nadredjena_org_jed || '',
      });
    }
  }, [jedinica]);

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
              {isEdit ? 'Izmeni organizacionu jedinicu' : 'Nova organizaciona jedinica'}
            </h1>
            <div className="form-buttons">
              <button type="submit" className="btn-save">Sačuvaj</button>
              <button type="button" onClick={onCancel} className="btn-cancel">Otkaži</button>
            </div>
          </div>

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
              {jedinice.filter(j => j.id !== jedinica?.id).map(j => (
                <option key={j.id} value={j.id}>{j.naziv}</option>
              ))}
            </select>
            <div className="help-text">Ostavite prazno ako ovo nema nadređenu jedinicu (najviši nivo)</div>
          </div>
        </form>
      </div>
    </div>
  );
}
