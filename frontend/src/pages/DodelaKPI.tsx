import { useState, useEffect } from 'react';
import { kpiApi, korisniciApi, dodeljeniKpiApi, organizacioneJediniceApi, radnaMestaApi } from '../api';
import type { KPI, Korisnik, KorisnikFull, OrganizacionaJedinica, RadnoMesto } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

interface DodelaKPIProps {
  currentUser: KorisnikFull;
  onSave: () => void;
  onCancel: () => void;
}

export function DodelaKPI({ currentUser, onSave, onCancel }: DodelaKPIProps) {
  const jeRukovodilac = currentUser.role === 'rukovodilac';

  const [kpiLista, setKpiLista] = useState<KPI[]>([]);
  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [orgJedinice, setOrgJedinice] = useState<OrganizacionaJedinica[]>([]);
  const [radnaMesta, setRadnaMesta] = useState<RadnoMesto[]>([]);

  const [formData, setFormData] = useState({
    kpi: '',
    datum_Od: '',
    datum_Do: '',
    organizaciona_jedinica: '',
    radno_mesto: '',
  });
  const [izabraniKorisnici, setIzabraniKorisnici] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [kpiData, korisniciData, orgData, rmData] = await Promise.all([
        kpiApi.getAll(),
        korisniciApi.getAll(),
        organizacioneJediniceApi.getAll(),
        radnaMestaApi.getAll(),
      ]);
      setKpiLista(kpiData);
      setKorisnici(korisniciData);
      setOrgJedinice(orgData);
      setRadnaMesta(rmData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri učitavanju podataka.');
    }
  };

  const dostupniKorisnici = korisnici.filter(k => {
    if (k.id === currentUser.id) return false;
    if (jeRukovodilac) return k.rukovodilac === currentUser.id;
    return true;
  });

  const filtriranaRadnaMesta = formData.organizaciona_jedinica
    ? radnaMesta.filter(rm => rm.org_jed === Number(formData.organizaciona_jedinica))
    : radnaMesta;

  const filtriraniKorisnici = dostupniKorisnici.filter(k => {
    if (formData.radno_mesto) return k.radno_mesto === Number(formData.radno_mesto);
    if (formData.organizaciona_jedinica) return k.organizaciona_jedinica === Number(formData.organizaciona_jedinica);
    return true;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'organizaciona_jedinica') {
      setFormData({ ...formData, organizaciona_jedinica: value, radno_mesto: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError(null);
    setSuccess(null);
  };

  const toggleKorisnik = (id: number) => {
    setIzabraniKorisnici(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };

  const izaberiSve = () => {
    const sviIds = filtriraniKorisnici.map(k => k.id);
    const sviIzabrani = sviIds.every(id => izabraniKorisnici.includes(id));
    if (sviIzabrani) {
      setIzabraniKorisnici(izabraniKorisnici.filter(id => !sviIds.includes(id)));
    } else {
      setIzabraniKorisnici([...new Set([...izabraniKorisnici, ...sviIds])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.kpi) {
      setError('Izaberite KPI.');
      return;
    }
    if (!formData.datum_Od || !formData.datum_Do) {
      setError('Unesite period.');
      return;
    }
    if (formData.datum_Do < formData.datum_Od) {
      setError('Datum završetka ne može biti pre datuma početka.');
      return;
    }
    if (izabraniKorisnici.length === 0) {
      setError('Izaberite barem jednog zaposlenog.');
      return;
    }

    setLoading(true);
    try {
      const result = await dodeljeniKpiApi.create({
        kpi: Number(formData.kpi),
        korisnici: izabraniKorisnici,
        datum_Od: formData.datum_Od,
        datum_Do: formData.datum_Do,
      });
      setSuccess(result.message);
      setIzabraniKorisnici([]);
      setTimeout(() => onSave(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri dodeli KPI.');
    } finally {
      setLoading(false);
    }
  };

  const izabraniKpi = kpiLista.find(k => k.id === Number(formData.kpi));

  return (
    <div className="form-wrapper">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">Dodela KPI</h1>
            <div className="form-buttons">
              <Button type="submit" variant="save" disabled={loading}>{loading ? 'Dodeljujem...' : 'Dodeli'}</Button>
              <Button variant="cancel" onClick={onCancel}>Otkaži</Button>
            </div>
          </div>

          {error && <div className="poruka greska">{error}</div>}
          {success && <div className="poruka uspeh">{success}</div>}

          <div className="form-group">
            <label htmlFor="kpi" className="required">KPI</label>
            <select id="kpi" name="kpi" className="form-control" value={formData.kpi} onChange={handleChange} required>
              <option value="">-- Izaberite KPI --</option>
              {kpiLista.map(k => (
                <option key={k.id} value={k.id}>{k.naziv} (target: {Number(k.target).toLocaleString('sr-RS')})</option>
              ))}
            </select>
            {izabraniKpi?.opis && <div className="help-text">{izabraniKpi.opis}</div>}
            {kpiLista.length === 0 && <div className="help-text">Nema definisanih KPI. Prvo kreirajte KPI.</div>}
          </div>

          <div className="forma-red">
            <div className="form-group">
              <label htmlFor="datum_Od" className="required">Datum početka</label>
              <input type="date" id="datum_Od" name="datum_Od" className="form-control" value={formData.datum_Od} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="datum_Do" className="required">Datum završetka</label>
              <input type="date" id="datum_Do" name="datum_Do" className="form-control" value={formData.datum_Do} onChange={handleChange} required />
            </div>
          </div>

          {!jeRukovodilac && (
            <div className="forma-red">
              <div className="form-group">
                <label htmlFor="organizaciona_jedinica">Organizaciona jedinica</label>
                <select id="organizaciona_jedinica" name="organizaciona_jedinica" className="form-control" value={formData.organizaciona_jedinica} onChange={handleChange}>
                  <option value="">-- Sve --</option>
                  {orgJedinice.map(oj => <option key={oj.id} value={oj.id}>{oj.naziv}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="radno_mesto">Radno mesto</label>
                <select id="radno_mesto" name="radno_mesto" className="form-control" value={formData.radno_mesto} onChange={handleChange}>
                  <option value="">-- Sva --</option>
                  {filtriranaRadnaMesta.map(rm => <option key={rm.id} value={rm.id}>{rm.naziv}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="required">Zaposleni {jeRukovodilac ? '(moj tim)' : ''}</label>
            {filtriraniKorisnici.length === 0 ? (
              <div className="no-units-warning">Nema zaposlenih za izabrane filtere.</div>
            ) : (
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '15px', maxHeight: '250px', overflowY: 'auto', marginTop: '8px' }}>
                <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={filtriraniKorisnici.every(k => izabraniKorisnici.includes(k.id))}
                      onChange={izaberiSve}
                    />
                    Izaberi sve ({filtriraniKorisnici.length})
                  </label>
                </div>
                {filtriraniKorisnici.map(k => (
                  <label
                    key={k.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px', background: izabraniKorisnici.includes(k.id) ? '#e0f2fe' : 'transparent' }}
                  >
                    <input type="checkbox" checked={izabraniKorisnici.includes(k.id)} onChange={() => toggleKorisnik(k.id)} />
                    {k.first_name} {k.last_name}
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>{k.role}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="help-text">Izabrano: {izabraniKorisnici.length} zaposlenih</div>
          </div>
        </form>
      </div>
    </div>
  );
}
