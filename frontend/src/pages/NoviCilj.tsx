import { useState, useEffect } from 'react';
import { tipoviCiljevaApi, ciljeviApi } from '../api';
import type { TipCilja } from '../types';
import './FormPage.css';

interface NoviCiljProps {
  onSave: () => void;
  onCancel: () => void;
}

export function NoviCilj({ onSave, onCancel }: NoviCiljProps) {
  const [tipoviCiljeva, setTipoviCiljeva] = useState<TipCilja[]>([]);
  const [formData, setFormData] = useState({
    naziv: '',
    tip_cilja: '',
    status: 'aktivan',
  });
  const [noviTipCilja, setNoviTipCilja] = useState('');
  const [showNoviTip, setShowNoviTip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTipoviCiljeva();
  }, []);

  const loadTipoviCiljeva = async () => {
    try {
      const data = await tipoviCiljevaApi.getAll();
      setTipoviCiljeva(data);
    } catch (err) {
      console.error('Greska pri ucitavanju tipova ciljeva:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleDodajTipCilja = async () => {
    if (!noviTipCilja.trim()) {
      setError('Unesite naziv tipa cilja.');
      return;
    }

    try {
      const noviTip = await tipoviCiljevaApi.create(noviTipCilja.trim());
      setTipoviCiljeva([...tipoviCiljeva, noviTip]);
      setFormData({ ...formData, tip_cilja: String(noviTip.id) });
      setNoviTipCilja('');
      setShowNoviTip(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greska pri kreiranju tipa cilja.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.naziv.trim()) {
      setError('Naziv cilja je obavezan.');
      return;
    }

    if (!formData.tip_cilja) {
      setError('Tip cilja je obavezan.');
      return;
    }

    setLoading(true);

    try {
      await ciljeviApi.create({
        naziv: formData.naziv.trim(),
        tip_cilja: Number(formData.tip_cilja),
        status: formData.status,
      });
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greska pri kreiranju cilja.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">Novi cilj</h1>
            <div className="form-buttons">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Cuvanje...' : 'Sacuvaj'}
              </button>
              <button type="button" onClick={onCancel} className="btn-cancel">
                Otkazi
              </button>
            </div>
          </div>

          {error && (
            <div className="no-units-warning" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="naziv" className="required">Naziv cilja</label>
            <input
              type="text"
              id="naziv"
              name="naziv"
              className="form-control"
              value={formData.naziv}
              onChange={handleChange}
              placeholder="Unesite naziv cilja"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tip_cilja" className="required">Tip cilja</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <select
                id="tip_cilja"
                name="tip_cilja"
                className="form-control"
                value={formData.tip_cilja}
                onChange={handleChange}
                style={{ flex: 1 }}
                required
              >
                <option value="">-- Izaberite tip cilja --</option>
                {tipoviCiljeva.map(tip => (
                  <option key={tip.id} value={tip.id}>{tip.naziv}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNoviTip(!showNoviTip)}
                className="btn-save"
                style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}
              >
                + Novi tip
              </button>
            </div>
            {showNoviTip && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  value={noviTipCilja}
                  onChange={(e) => setNoviTipCilja(e.target.value)}
                  placeholder="Naziv novog tipa cilja"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleDodajTipCilja}
                  className="btn-save"
                  style={{ padding: '12px 16px' }}
                >
                  Dodaj
                </button>
              </div>
            )}
            <div className="help-text">Izaberite postojeci tip ili kreirajte novi</div>
          </div>

          <div className="form-group">
            <label htmlFor="status" className="required">Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="aktivan">Aktivan</option>
              <option value="neaktivan">Neaktivan</option>
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}