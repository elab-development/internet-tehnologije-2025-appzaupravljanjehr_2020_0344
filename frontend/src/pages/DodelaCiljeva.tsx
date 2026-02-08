import { useState, useEffect } from 'react';
import { ciljeviApi, korisniciApi, dodeljeniCiljeviApi, organizacioneJediniceApi, radnaMestaApi } from '../api';
import type { Cilj, Korisnik, OrganizacionaJedinica, RadnoMesto } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';

interface DodelaCiljevaProps {
  onSave: () => void;
  onCancel: () => void;
}

export function DodelaCiljeva({ onSave, onCancel }: DodelaCiljevaProps) {
  const [ciljevi, setCiljevi] = useState<Cilj[]>([]);
  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [organizacioneJedinice, setOrganizacioneJedinice] = useState<OrganizacionaJedinica[]>([]);
  const [radnaMesta, setRadnaMesta] = useState<RadnoMesto[]>([]);
  const [filteredRadnaMesta, setFilteredRadnaMesta] = useState<RadnoMesto[]>([]);
  const [filteredKorisnici, setFilteredKorisnici] = useState<Korisnik[]>([]);

  const [formData, setFormData] = useState({
    cilj: '',
    organizaciona_jedinica: '',
    radno_mesto: '',
    datum_Od: '',
    datum_Do: '',
  });

  const [selectedCiljevi, setSelectedCiljevi] = useState<number[]>([]);
  const [selectedKorisnici, setSelectedKorisnici] = useState<number[]>([]);
  const [dodelaTip, setDodelaTip] = useState<'org_jedinica' | 'radno_mesto' | 'korisnici'>('korisnici');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.organizaciona_jedinica) {
      const filtered = radnaMesta.filter(
        rm => rm.org_jed === Number(formData.organizaciona_jedinica)
      );
      setFilteredRadnaMesta(filtered);
      setFormData(prev => ({ ...prev, radno_mesto: '' }));
      setSelectedKorisnici([]);

      const filteredUsers = korisnici.filter(
        k => k.organizaciona_jedinica === Number(formData.organizaciona_jedinica)
      );
      setFilteredKorisnici(filteredUsers);
    } else {
      setFilteredRadnaMesta([]);
      setFilteredKorisnici([]);
    }
  }, [formData.organizaciona_jedinica, radnaMesta, korisnici]);

  useEffect(() => {
    if (formData.radno_mesto) {
      const filteredUsers = korisnici.filter(
        k => k.radno_mesto === Number(formData.radno_mesto)
      );
      setFilteredKorisnici(filteredUsers);
      setSelectedKorisnici([]);
    } else if (formData.organizaciona_jedinica) {
      const filteredUsers = korisnici.filter(
        k => k.organizaciona_jedinica === Number(formData.organizaciona_jedinica)
      );
      setFilteredKorisnici(filteredUsers);
    }
  }, [formData.radno_mesto, korisnici]);

  const loadData = async () => {
    try {
      const [ciljeviData, korisniciData, orgJediniceData, radnaMestaData] = await Promise.all([
        ciljeviApi.getAll(),
        korisniciApi.getAll(),
        organizacioneJediniceApi.getAll(),
        radnaMestaApi.getAll(),
      ]);
      setCiljevi(ciljeviData.filter(c => c.status === 'aktivan'));
      setKorisnici(korisniciData);
      setOrganizacioneJedinice(orgJediniceData);
      setRadnaMesta(radnaMestaData);
    } catch (err) {
      console.error('Greska pri ucitavanju podataka:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleCiljToggle = (id: number) => {
    setSelectedCiljevi(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAllCiljevi = () => {
    if (selectedCiljevi.length === ciljevi.length) {
      setSelectedCiljevi([]);
    } else {
      setSelectedCiljevi(ciljevi.map(c => c.id));
    }
  };

  const handleKorisnikToggle = (id: number) => {
    setSelectedKorisnici(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedKorisnici.length === filteredKorisnici.length) {
      setSelectedKorisnici([]);
    } else {
      setSelectedKorisnici(filteredKorisnici.map(k => k.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.cilj) {
      setError('Izaberite cilj.');
      return;
    }

    if (!formData.datum_Od || !formData.datum_Do) {
      setError('Unesite datume.');
      return;
    }

    if (formData.datum_Do < formData.datum_Od) {
      setError('Datum zavrsetka ne moze biti pre datuma pocetka.');
      return;
    }

    if (dodelaTip === 'korisnici' && selectedKorisnici.length === 0) {
      setError('Izaberite barem jednog korisnika.');
      return;
    }

    if (dodelaTip === 'radno_mesto' && !formData.radno_mesto) {
      setError('Izaberite radno mesto.');
      return;
    }

    if (dodelaTip === 'org_jedinica' && !formData.organizaciona_jedinica) {
      setError('Izaberite organizacionu jedinicu.');
      return;
    }

    setLoading(true);

    try {
      let totalCreated = 0;
      let totalSkipped = 0;

      for (const ciljId of selectedCiljevi) {
        const payload: any = {
          cilj: ciljId,
          datum_Od: formData.datum_Od,
          datum_Do: formData.datum_Do,
        };

        if (dodelaTip === 'korisnici') {
          payload.zaposleni_ids = selectedKorisnici;
        } else if (dodelaTip === 'radno_mesto') {
          payload.radno_mesto = Number(formData.radno_mesto);
        } else if (dodelaTip === 'org_jedinica') {
          payload.organizaciona_jedinica = Number(formData.organizaciona_jedinica);
        }

        const result = await dodeljeniCiljeviApi.createMasovno(payload);
        totalCreated += result.created;
        totalSkipped += result.skipped;
      }

      setSuccess(`Dodeljeno ${totalCreated} ciljeva.`);

      setTimeout(() => {
        onSave();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greska pri dodeli cilja.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">Dodela ciljeva</h1>
            <div className="form-buttons">
              <Button type="submit" variant="save" disabled={loading}>
                {loading ? 'Dodeljujem...' : 'Dodeli'}
              </Button>
              <Button variant="cancel" onClick={onCancel}>
                Otkazi
              </Button>
            </div>
          </div>

          {error && (
            <div className="no-units-warning" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="no-units-warning" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#16a34a' }}>
              {success}
            </div>
          )}

          <div className="form-group">
            <label className="required">Ciljevi</label>
            <div style={{
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '15px',
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '8px'
            }}>
              <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={selectedCiljevi.length === ciljevi.length && ciljevi.length > 0}
                    onChange={handleSelectAllCiljevi}
                  />
                  Izaberi sve ({ciljevi.length})
                </label>
              </div>
              {ciljevi.map(cilj => (
                <label
                  key={cilj.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    background: selectedCiljevi.includes(cilj.id) ? '#e0f2fe' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCiljevi.includes(cilj.id)}
                    onChange={() => handleCiljToggle(cilj.id)}
                  />
                  {cilj.naziv}
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
                    {cilj.tip_cilja_naziv}
                  </span>
                </label>
              ))}
            </div>
            <div className="help-text">Izabrano: {selectedCiljevi.length} ciljeva</div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="datum_Od" className="required">Datum pocetka</label>
              <input
                type="date"
                id="datum_Od"
                name="datum_Od"
                className="form-control"
                value={formData.datum_Od}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="datum_Do" className="required">Datum zavrsetka</label>
              <input
                type="date"
                id="datum_Do"
                name="datum_Do"
                className="form-control"
                value={formData.datum_Do}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="required">Nacin dodele</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dodelaTip"
                  checked={dodelaTip === 'korisnici'}
                  onChange={() => setDodelaTip('korisnici')}
                />
                Pojedinacni korisnici
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dodelaTip"
                  checked={dodelaTip === 'radno_mesto'}
                  onChange={() => setDodelaTip('radno_mesto')}
                />
                Svi u radnom mestu
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dodelaTip"
                  checked={dodelaTip === 'org_jedinica'}
                  onChange={() => setDodelaTip('org_jedinica')}
                />
                Svi u org. jedinici
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organizaciona_jedinica">Organizaciona jedinica</label>
            <select
              id="organizaciona_jedinica"
              name="organizaciona_jedinica"
              className="form-control"
              value={formData.organizaciona_jedinica}
              onChange={handleChange}
            >
              <option value="">-- Izaberite org. jedinicu --</option>
              {organizacioneJedinice.map(oj => (
                <option key={oj.id} value={oj.id}>{oj.naziv}</option>
              ))}
            </select>
          </div>

          {(dodelaTip === 'radno_mesto' || dodelaTip === 'korisnici') && formData.organizaciona_jedinica && (
            <div className="form-group">
              <label htmlFor="radno_mesto">Radno mesto</label>
              <select
                id="radno_mesto"
                name="radno_mesto"
                className="form-control"
                value={formData.radno_mesto}
                onChange={handleChange}
              >
                <option value="">-- Izaberite radno mesto --</option>
                {filteredRadnaMesta.map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.naziv}</option>
                ))}
              </select>
            </div>
          )}

          {dodelaTip === 'korisnici' && filteredKorisnici.length > 0 && (
            <div className="form-group">
              <label>Korisnici</label>
              <div style={{
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '15px',
                maxHeight: '250px',
                overflowY: 'auto',
                marginTop: '8px'
              }}>
                <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={selectedKorisnici.length === filteredKorisnici.length && filteredKorisnici.length > 0}
                      onChange={handleSelectAll}
                    />
                    Izaberi sve ({filteredKorisnici.length})
                  </label>
                </div>
                {filteredKorisnici.map(korisnik => (
                  <label
                    key={korisnik.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedKorisnici.includes(korisnik.id) ? '#e0f2fe' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedKorisnici.includes(korisnik.id)}
                      onChange={() => handleKorisnikToggle(korisnik.id)}
                    />
                    {korisnik.first_name} {korisnik.last_name}
                  </label>
                ))}
              </div>
              <div className="help-text">Izabrano: {selectedKorisnici.length} korisnika</div>
            </div>
          )}

          {dodelaTip === 'korisnici' && formData.organizaciona_jedinica && filteredKorisnici.length === 0 && (
            <div className="no-units-warning">
              Nema korisnika u izabranoj organizacionoj jedinici/radnom mestu.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}