import { useState, useEffect } from 'react';
import { odmoriApi } from '../api';
import type { StanjeOdmora } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

interface NoviZahtevOdmorProps {
  onSave: () => void;
  onCancel: () => void;
}

const brojRadnihDana = (datumOd: string, datumDo: string): number => {
  if (!datumOd || !datumDo) return 0;
  const start = new Date(datumOd);
  const end = new Date(datumDo);
  if (end < start) return 0;
  let dana = 0;
  const tekuci = new Date(start);
  while (tekuci <= end) {
    const dan = tekuci.getDay();
    if (dan !== 0 && dan !== 6) dana += 1;
    tekuci.setDate(tekuci.getDate() + 1);
  }
  return dana;
};

export function NoviZahtevOdmor({ onSave, onCancel }: NoviZahtevOdmorProps) {
  const [formData, setFormData] = useState({
    datum_Od: '',
    datum_Do: '',
    napomena: '',
  });
  const [stanje, setStanje] = useState<StanjeOdmora | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStanje();
  }, []);

  const loadStanje = async () => {
    try {
      const data = await odmoriApi.stanje();
      setStanje(data);
    } catch (err) {
      console.error('Greska pri ucitavanju stanja odmora:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const trazeniDani = brojRadnihDana(formData.datum_Od, formData.datum_Do);
  const nevalidanPeriod = formData.datum_Od && formData.datum_Do && formData.datum_Do < formData.datum_Od;
  const nedovoljnoDana = stanje !== null && trazeniDani > stanje.preostalo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.datum_Od || !formData.datum_Do) {
      setError('Unesite period odmora (od - do).');
      return;
    }

    if (nevalidanPeriod) {
      setError('Nevalidan period: datum završetka ne može biti pre datuma početka.');
      return;
    }

    if (trazeniDani === 0) {
      setError('Izabrani period ne sadrži nijedan radni dan.');
      return;
    }

    if (nedovoljnoDana) {
      setError(`Nema dovoljno preostalih dana. Traženo: ${trazeniDani}, preostalo: ${stanje?.preostalo}.`);
      return;
    }

    setLoading(true);
    try {
      await odmoriApi.create({
        datum_Od: formData.datum_Od,
        datum_Do: formData.datum_Do,
        napomena: formData.napomena,
      });
      setSuccess('Zahtev je uspešno kreiran i prosleđen administratoru na odobrenje.');
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri kreiranju zahteva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">Novi zahtev za odmor</h1>
            <div className="form-buttons">
              <Button type="submit" variant="save" disabled={loading || !!success}>
                {loading ? 'Slanje...' : 'Podnesi zahtev'}
              </Button>
              <Button variant="cancel" onClick={onCancel}>Otkaži</Button>
            </div>
          </div>

          {error && <div className="poruka greska">{error}</div>}
          {success && <div className="poruka uspeh">{success}</div>}

          {stanje && (
            <div className="stat-grid">
              <div className="stat-tile">
                <div className="stat-vrednost">{stanje.ukupno}</div>
                <div className="stat-naziv">Ukupno ({stanje.godina})</div>
              </div>
              <div className="stat-tile">
                <div className="stat-vrednost">{stanje.iskorisceno + stanje.na_cekanju}</div>
                <div className="stat-naziv">Iskorišćeno + na čekanju</div>
              </div>
              <div className="stat-tile uspeh">
                <div className="stat-vrednost">{stanje.preostalo}</div>
                <div className="stat-naziv">Preostalo</div>
              </div>
            </div>
          )}

          <div className="forma-red">
            <div className="form-group">
              <label htmlFor="datum_Od" className="required">Datum početka</label>
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
            <div className="form-group">
              <label htmlFor="datum_Do" className="required">Datum završetka</label>
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

          {formData.datum_Od && formData.datum_Do && (
            nevalidanPeriod ? (
              <div className="poruka greska">Datum završetka je pre datuma početka.</div>
            ) : nedovoljnoDana ? (
              <div className="poruka upozorenje">
                Traženi period ima {trazeniDani} radnih dana, a preostalo vam je {stanje?.preostalo}. Zahtev neće biti kreiran.
              </div>
            ) : (
              <div className="help-text" style={{ marginBottom: '20px' }}>
                Traženi period sadrži {trazeniDani} radnih dana (vikendi se ne računaju).
              </div>
            )
          )}

          <div className="form-group">
            <label htmlFor="napomena">Napomena</label>
            <textarea
              id="napomena"
              name="napomena"
              className="form-control"
              value={formData.napomena}
              onChange={handleChange}
              placeholder="Opciono: razlog ili dodatne informacije"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
