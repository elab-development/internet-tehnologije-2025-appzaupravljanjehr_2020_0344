import { useState, useEffect } from 'react';
import { korisniciApi, oceneApi, koeficijentiApi } from '../api';
import type { Korisnik, KorisnikFull, Ocena, TezinskiKoeficijent } from '../types';
import { Button } from '../components/Button';
import './FormPage.css';
import './Pregled.css';

interface OcenjivanjeProps {
  currentUser: KorisnikFull;
  onKoeficijenti?: () => void;
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('sr-RS');
};

const danas = () => new Date().toISOString().slice(0, 10);

export function Ocenjivanje({ currentUser, onKoeficijenti }: OcenjivanjeProps) {
  const jeAdmin = currentUser.role === 'superuser' || currentUser.role === 'administrator';
  const jeRukovodilac = currentUser.role === 'rukovodilac';
  const mozeDaOcenjuje = jeAdmin || jeRukovodilac;

  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [ocene, setOcene] = useState<Ocena[]>([]);
  const [koeficijenti, setKoeficijenti] = useState<TezinskiKoeficijent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [izabraniId, setIzabraniId] = useState('');
  const [period, setPeriod] = useState({ datum_Od: '', datum_Do: '' });
  const [showForma, setShowForma] = useState(false);
  const [oceneForm, setOceneForm] = useState<string[]>(['', '', '', '', '']);
  const [cuvanje, setCuvanje] = useState(false);
  const [otvorenaOcena, setOtvorenaOcena] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const pozivi: Promise<any>[] = [oceneApi.getAll()];
      if (mozeDaOcenjuje) {
        pozivi.push(korisniciApi.getAll());
        pozivi.push(koeficijentiApi.getAll());
      }
      const [oceneData, korisniciData, koefData] = await Promise.all(pozivi);
      setOcene(oceneData);
      if (korisniciData) setKorisnici(korisniciData);
      if (koefData) setKoeficijenti(koefData);
    } catch (err: any) {
      console.error('Greska pri ucitavanju ocenjivanja:', err);
      setError(err.response?.data?.error || 'Greška pri učitavanju podataka.');
    } finally {
      setLoading(false);
    }
  };

  const tim = korisnici.filter(k => {
    if (k.id === currentUser.id) return false;
    if (jeRukovodilac) return k.rukovodilac === currentUser.id;
    return true;
  });

  const izabrani = tim.find(k => k.id === Number(izabraniId)) || null;
  const koeficijent = izabrani && izabrani.radno_mesto
    ? koeficijenti.find(k => k.radno_mesto === izabrani.radno_mesto) || null
    : null;

  const oceneIzabranog = izabrani ? ocene.filter(o => o.zaposleni === izabrani.id) : [];
  const mojeOcene = ocene.filter(o => o.zaposleni === currentUser.id);

  const ciklusNijeAktivan = !!period.datum_Od && period.datum_Od > danas();
  const nevalidanPeriod = !!period.datum_Od && !!period.datum_Do && period.datum_Do < period.datum_Od;

  const oblastiKoef = koeficijent
    ? [
        { naziv: koeficijent.oblast_1_naziv, koef: koeficijent.koef_1 },
        { naziv: koeficijent.oblast_2_naziv, koef: koeficijent.koef_2 },
        { naziv: koeficijent.oblast_3_naziv, koef: koeficijent.koef_3 },
        { naziv: koeficijent.oblast_4_naziv, koef: koeficijent.koef_4 },
        { naziv: koeficijent.oblast_5_naziv, koef: koeficijent.koef_5 },
      ]
    : [];

  const zbirnaPreview = koeficijent && oceneForm.every(o => o !== '')
    ? oceneForm.reduce((sum, o, i) => sum + Number(o) * Number(oblastiKoef[i].koef), 0).toFixed(2)
    : null;

  const handleIzborZaposlenog = (id: string) => {
    setIzabraniId(id);
    setShowForma(false);
    setOceneForm(['', '', '', '', '']);
    setError(null);
    setSuccess(null);
  };

  const handleOcenaChange = (index: number, value: string) => {
    const nove = [...oceneForm];
    nove[index] = value;
    setOceneForm(nove);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!izabrani) {
      setError('Izaberite zaposlenog.');
      return;
    }
    if (!period.datum_Od || !period.datum_Do) {
      setError('Izaberite evaluacioni ciklus (period od - do).');
      return;
    }
    if (nevalidanPeriod) {
      setError('Datum završetka ne može biti pre datuma početka.');
      return;
    }
    if (ciklusNijeAktivan) {
      setError('Evaluacioni ciklus nije aktivan (period još nije počeo).');
      return;
    }
    if (!koeficijent) {
      setError('Za radno mesto zaposlenog nisu definisani težinski koeficijenti.');
      return;
    }
    if (oceneForm.some(o => o === '')) {
      setError('Nevalidni podaci: sve ocene moraju biti popunjene.');
      return;
    }

    setCuvanje(true);
    try {
      await oceneApi.create({
        zaposleni: izabrani.id,
        datum_Od: period.datum_Od,
        datum_Do: period.datum_Do,
        ocena_1: Number(oceneForm[0]),
        ocena_2: Number(oceneForm[1]),
        ocena_3: Number(oceneForm[2]),
        ocena_4: Number(oceneForm[3]),
        ocena_5: Number(oceneForm[4]),
      });
      setSuccess(`Ocena za ${izabrani.first_name} ${izabrani.last_name} je uspešno sačuvana.`);
      setShowForma(false);
      setOceneForm(['', '', '', '', '']);
      const oceneData = await oceneApi.getAll();
      setOcene(oceneData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri čuvanju ocene.');
    } finally {
      setCuvanje(false);
    }
  };

  const obrisiOcenu = async (o: Ocena) => {
    if (!window.confirm(`Obrisati ocenu za period ${formatDate(o.datum_Od)} - ${formatDate(o.datum_Do)}?`)) return;
    setError(null);
    try {
      await oceneApi.delete(o.id);
      setSuccess('Ocena je obrisana.');
      const oceneData = await oceneApi.getAll();
      setOcene(oceneData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri brisanju ocene.');
    }
  };

  const renderTabelaOcena = (lista: Ocena[], prikaziZaposlenog: boolean, dozvoliBrisanje: boolean) => (
    lista.length === 0 ? (
      <div className="prazno">Nema evidentiranih ocena.</div>
    ) : (
      <table className="tabela">
        <thead>
          <tr>
            {prikaziZaposlenog && <th>Zaposleni</th>}
            <th>Evaluacioni ciklus</th>
            <th>Ocenjivač</th>
            <th>Ocene</th>
            <th>Zbirna ocena</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lista.map(o => (
            <tr key={o.id}>
              {prikaziZaposlenog && <td>{o.zaposleni_ime}</td>}
              <td>{formatDate(o.datum_Od)} - {formatDate(o.datum_Do)}</td>
              <td>{o.rukovodilac_ime || '—'}</td>
              <td>
                {otvorenaOcena === o.id ? (
                  <ul className="detalj-lista">
                    {o.oblasti.length > 0 ? o.oblasti.map((ob, i) => (
                      <li key={i}><span>{ob.naziv} (×{Number(ob.koeficijent).toFixed(2)})</span><span>{ob.ocena}</span></li>
                    )) : (
                      <li><span>Ocene</span><span>{[o.ocena_1, o.ocena_2, o.ocena_3, o.ocena_4, o.ocena_5].join(', ')}</span></li>
                    )}
                  </ul>
                ) : (
                  [o.ocena_1, o.ocena_2, o.ocena_3, o.ocena_4, o.ocena_5].join(' / ')
                )}
              </td>
              <td><strong>{o.zbirna_ocena ?? '—'}</strong></td>
              <td>
                <div className="tabela-akcije">
                  <Button variant="outline" onClick={() => setOtvorenaOcena(otvorenaOcena === o.id ? null : o.id)}>
                    {otvorenaOcena === o.id ? 'Sakrij' : 'Detalji'}
                  </Button>
                  {dozvoliBrisanje && <Button variant="danger" onClick={() => obrisiOcenu(o)}>Obriši</Button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  );

  if (loading) {
    return <div className="pregled-wrapper"><div className="pregled-card">Učitavanje...</div></div>;
  }

  return (
    <div className="pregled-wrapper">
      {mozeDaOcenjuje && (
        <div className="pregled-card">
          <div className="pregled-header">
            <h1 className="pregled-title">Ocenjivanje</h1>
            {jeAdmin && onKoeficijenti && (
              <Button variant="outline" onClick={onKoeficijenti}>Težinski koeficijenti</Button>
            )}
          </div>

          {error && <div className="poruka greska">{error}</div>}
          {success && <div className="poruka uspeh">{success}</div>}

          <div className="forma-red">
            <div className="form-group">
              <label htmlFor="zaposleni" className="required">Zaposleni {jeRukovodilac ? '(moj tim)' : ''}</label>
              <select
                id="zaposleni"
                className="form-control"
                value={izabraniId}
                onChange={(e) => handleIzborZaposlenog(e.target.value)}
              >
                <option value="">-- Izaberite zaposlenog --</option>
                {tim.map(k => (
                  <option key={k.id} value={k.id}>{k.first_name} {k.last_name}</option>
                ))}
              </select>
              {tim.length === 0 && <div className="help-text">Nemate zaposlenih u svom timu.</div>}
            </div>
            <div className="form-group">
              <label htmlFor="datum_Od" className="required">Ciklus od</label>
              <input type="date" id="datum_Od" className="form-control" value={period.datum_Od} onChange={(e) => { setPeriod({ ...period, datum_Od: e.target.value }); setError(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="datum_Do" className="required">Ciklus do</label>
              <input type="date" id="datum_Do" className="form-control" value={period.datum_Do} onChange={(e) => { setPeriod({ ...period, datum_Do: e.target.value }); setError(null); }} />
            </div>
          </div>

          {ciklusNijeAktivan && (
            <div className="poruka upozorenje">Evaluacioni ciklus nije aktivan: period počinje u budućnosti, unos ocene je onemogućen.</div>
          )}
          {nevalidanPeriod && (
            <div className="poruka greska">Datum završetka ciklusa ne može biti pre datuma početka.</div>
          )}

          {izabrani && (
            <>
              <div className="pregled-subtitle">
                Postojeće ocene: {izabrani.first_name} {izabrani.last_name}
              </div>
              {renderTabelaOcena(oceneIzabranog, false, true)}

              <div style={{ marginTop: '20px' }}>
                {!koeficijent ? (
                  <div className="poruka upozorenje">
                    Za radno mesto ovog zaposlenog nisu definisani težinski koeficijenti, pa nije moguće uneti ocenu.
                    {jeAdmin && onKoeficijenti && (
                      <> <a href="#" onClick={(e) => { e.preventDefault(); onKoeficijenti(); }}>Definiši koeficijente</a></>
                    )}
                  </div>
                ) : !showForma ? (
                  <Button
                    variant="primary"
                    onClick={() => { setShowForma(true); setError(null); setSuccess(null); }}
                    disabled={ciklusNijeAktivan || nevalidanPeriod || !period.datum_Od || !period.datum_Do}
                  >
                    + Dodaj ocenu
                  </Button>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="pregled-subtitle">Nova ocena ({formatDate(period.datum_Od)} - {formatDate(period.datum_Do)})</div>
                    <div className="ocena-red" style={{ fontWeight: 600, color: '#1E293B' }}>
                      <span>Oblast ocenjivanja</span>
                      <span>Koeficijent</span>
                      <span>Ocena (1-5)</span>
                    </div>
                    {oblastiKoef.map((ob, i) => (
                      <div className="ocena-red" key={i}>
                        <span>{ob.naziv}</span>
                        <span>{Number(ob.koef).toFixed(3)}</span>
                        <select
                          className="form-control"
                          value={oceneForm[i]}
                          onChange={(e) => handleOcenaChange(i, e.target.value)}
                          required
                        >
                          <option value="">--</option>
                          {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
                      <div className="help-text" style={{ fontSize: '15px' }}>
                        Zbirna ocena: <strong>{zbirnaPreview ?? '—'}</strong>
                      </div>
                      <div className="form-buttons">
                        <Button type="submit" variant="save" disabled={cuvanje}>{cuvanje ? 'Čuvanje...' : 'Potvrdi ocenu'}</Button>
                        <Button variant="cancel" onClick={() => { setShowForma(false); setOceneForm(['', '', '', '', '']); }}>Otkaži</Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="pregled-card">
        <div className="pregled-header">
          <h1 className="pregled-title" style={{ fontSize: mozeDaOcenjuje ? '22px' : '26px' }}>Moje evaluacije</h1>
        </div>
        {!mozeDaOcenjuje && error && <div className="poruka greska">{error}</div>}
        {renderTabelaOcena(mojeOcene, false, false)}
      </div>
    </div>
  );
}
