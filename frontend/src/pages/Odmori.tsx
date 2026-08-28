import { useState, useEffect } from 'react';
import { odmoriApi } from '../api';
import type { KorisnikFull, Odmor, StanjeOdmora } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './FormPage.css';
import './Pregled.css';

interface OdmoriProps {
  currentUser: KorisnikFull;
  onNoviZahtev: () => void;
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('sr-RS');
};

export function Odmori({ currentUser, onNoviZahtev }: OdmoriProps) {
  const jeAdmin = currentUser.role === 'superuser' || currentUser.role === 'administrator';
  const jeRukovodilac = currentUser.role === 'rukovodilac';

  const [odmori, setOdmori] = useState<Odmor[]>([]);
  const [stanje, setStanje] = useState<StanjeOdmora | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('na_cekanju');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [detalj, setDetalj] = useState<Odmor | null>(null);
  const [odbijanje, setOdbijanje] = useState(false);
  const [razlog, setRazlog] = useState('');
  const [obrada, setObrada] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [odmoriData, stanjeData] = await Promise.all([
        odmoriApi.getAll(),
        odmoriApi.stanje(),
      ]);
      setOdmori(odmoriData);
      setStanje(stanjeData);
    } catch (err) {
      console.error('Greska pri ucitavanju odmora:', err);
      setError('Greška pri učitavanju zahteva za odmor.');
    } finally {
      setLoading(false);
    }
  };

  const mojiZahtevi = odmori.filter(o => o.zaposleni === currentUser.id);
  const tudjiZahtevi = odmori.filter(o => o.zaposleni !== currentUser.id);
  const filtriraniTudji = filterStatus ? tudjiZahtevi.filter(o => o.status === filterStatus) : tudjiZahtevi;

  const otvoriDetalj = async (id: number) => {
    setError(null);
    setSuccess(null);
    setOdbijanje(false);
    setRazlog('');
    try {
      const data = await odmoriApi.getById(id);
      setDetalj(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri učitavanju detalja zahteva.');
    }
  };

  const zatvoriDetalj = () => {
    setDetalj(null);
    setOdbijanje(false);
    setRazlog('');
  };

  const handleOdobri = async () => {
    if (!detalj) return;
    setObrada(true);
    setError(null);
    try {
      await odmoriApi.odobri(detalj.id);
      setSuccess(`Zahtev zaposlenog ${detalj.zaposleni_ime} je odobren.`);
      zatvoriDetalj();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri odobravanju zahteva.');
      zatvoriDetalj();
      await loadData();
    } finally {
      setObrada(false);
    }
  };

  const handleOdbij = async () => {
    if (!detalj) return;
    if (!razlog.trim()) {
      setError('Razlog odbijanja je obavezan.');
      return;
    }
    setObrada(true);
    setError(null);
    try {
      await odmoriApi.odbij(detalj.id, razlog.trim());
      setSuccess(`Zahtev zaposlenog ${detalj.zaposleni_ime} je odbijen.`);
      zatvoriDetalj();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri odbijanju zahteva.');
      zatvoriDetalj();
      await loadData();
    } finally {
      setObrada(false);
    }
  };

  const handlePovuci = async (id: number) => {
    setError(null);
    setSuccess(null);
    try {
      await odmoriApi.delete(id);
      setSuccess('Zahtev je povučen.');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri povlačenju zahteva.');
    }
  };

  if (loading) {
    return <div className="pregled-wrapper"><div className="pregled-card">Učitavanje...</div></div>;
  }

  return (
    <div className="pregled-wrapper">
      <div className="pregled-card">
        <div className="pregled-header">
          <h1 className="pregled-title">Odmori</h1>
          <div className="pregled-actions">
            <Button variant="primary" onClick={onNoviZahtev}>+ Novi zahtev</Button>
          </div>
        </div>

        {error && <div className="poruka greska">{error}</div>}
        {success && <div className="poruka uspeh">{success}</div>}

        {stanje && (
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="stat-vrednost">{stanje.ukupno}</div>
              <div className="stat-naziv">Ukupno dana ({stanje.godina})</div>
            </div>
            <div className="stat-tile">
              <div className="stat-vrednost">{stanje.iskorisceno}</div>
              <div className="stat-naziv">Iskorišćeno</div>
            </div>
            <div className="stat-tile upozorenje">
              <div className="stat-vrednost">{stanje.na_cekanju}</div>
              <div className="stat-naziv">Na čekanju</div>
            </div>
            <div className="stat-tile uspeh">
              <div className="stat-vrednost">{stanje.preostalo}</div>
              <div className="stat-naziv">Preostalo</div>
            </div>
          </div>
        )}

        <div className="pregled-subtitle">Moji zahtevi</div>
        {mojiZahtevi.length === 0 ? (
          <div className="prazno">Nemate podnetih zahteva za odmor.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Period</th>
                <th>Radnih dana</th>
                <th>Napomena</th>
                <th>Status</th>
                <th>Obradio</th>
                <th>Razlog odbijanja</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mojiZahtevi.map(o => (
                <tr key={o.id}>
                  <td>{formatDate(o.datum_Od)} - {formatDate(o.datum_Do)}</td>
                  <td>{o.broj_dana}</td>
                  <td>{o.napomena || '—'}</td>
                  <td><span className={`status-badge ${o.status}`}>{o.status_naziv}</span></td>
                  <td>{o.obradio_ime || '—'}</td>
                  <td>{o.razlog_odbijanja || '—'}</td>
                  <td>
                    {o.status === 'na_cekanju' && (
                      <Button variant="outline" onClick={() => handlePovuci(o.id)}>Povuci</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(jeAdmin || jeRukovodilac) && (
          <>
            <div className="pregled-subtitle">
              {jeAdmin ? 'Zahtevi zaposlenih' : 'Zahtevi mog tima'}
            </div>
            <div className="filters-section" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
              <select
                className="form-control"
                style={{ maxWidth: '220px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="na_cekanju">Na čekanju</option>
                <option value="odobren">Odobreni</option>
                <option value="odbijen">Odbijeni</option>
                <option value="">Svi</option>
              </select>
              <span className="help-text">Prikazano: {filtriraniTudji.length}</span>
            </div>

            {filtriraniTudji.length === 0 ? (
              <div className="prazno">Nema zahteva za izabrani status.</div>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Zaposleni</th>
                    <th>Org. jedinica</th>
                    <th>Period</th>
                    <th>Radnih dana</th>
                    <th>Podneto</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtriraniTudji.map(o => (
                    <tr key={o.id}>
                      <td>{o.zaposleni_ime}</td>
                      <td>{o.organizaciona_jedinica_naziv || '—'}</td>
                      <td>{formatDate(o.datum_Od)} - {formatDate(o.datum_Do)}</td>
                      <td>{o.broj_dana}</td>
                      <td>{formatDate(o.datum_podnosenja)}</td>
                      <td><span className={`status-badge ${o.status}`}>{o.status_naziv}</span></td>
                      <td>
                        <Button variant="primary" onClick={() => otvoriDetalj(o.id)}>Detalji</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <Modal
        open={!!detalj}
        onClose={zatvoriDetalj}
        title="Detalji zahteva za odmor"
        actions={
          detalj && jeAdmin && detalj.status === 'na_cekanju' ? (
            odbijanje ? (
              <>
                <Button variant="cancel" onClick={() => setOdbijanje(false)} disabled={obrada}>Nazad</Button>
                <Button variant="danger" onClick={handleOdbij} disabled={obrada}>Potvrdi odbijanje</Button>
              </>
            ) : (
              <>
                <Button variant="cancel" onClick={zatvoriDetalj} disabled={obrada}>Zatvori</Button>
                <Button variant="danger" onClick={() => setOdbijanje(true)} disabled={obrada}>Odbij zahtev</Button>
                <Button variant="save" onClick={handleOdobri} disabled={obrada}>Odobri zahtev</Button>
              </>
            )
          ) : (
            <Button variant="cancel" onClick={zatvoriDetalj}>Zatvori</Button>
          )
        }
      >
        {detalj && (
          <>
            <ul className="detalj-lista">
              <li><span>Zaposleni</span><span>{detalj.zaposleni_ime}</span></li>
              <li><span>Org. jedinica</span><span>{detalj.organizaciona_jedinica_naziv || '—'}</span></li>
              <li><span>Rukovodilac</span><span>{detalj.rukovodilac_ime || '—'}</span></li>
              <li><span>Tip odsustva</span><span>Godišnji odmor</span></li>
              <li><span>Period</span><span>{formatDate(detalj.datum_Od)} - {formatDate(detalj.datum_Do)}</span></li>
              <li><span>Radnih dana</span><span>{detalj.broj_dana}</span></li>
              <li><span>Napomena</span><span>{detalj.napomena || '—'}</span></li>
              <li><span>Status</span><span className={`status-badge ${detalj.status}`}>{detalj.status_naziv}</span></li>
              {detalj.razlog_odbijanja && (
                <li><span>Razlog odbijanja</span><span>{detalj.razlog_odbijanja}</span></li>
              )}
              {detalj.stanje && (
                <li>
                  <span>Raspoloživi dani ({detalj.stanje.godina})</span>
                  <span>preostalo {detalj.stanje.preostalo} od {detalj.stanje.ukupno} (iskorišćeno {detalj.stanje.iskorisceno}, na čekanju {detalj.stanje.na_cekanju})</span>
                </li>
              )}
            </ul>
            {odbijanje && (
              <div className="form-group" style={{ marginTop: '15px', textAlign: 'left' }}>
                <label htmlFor="razlog" className="required">Razlog odbijanja</label>
                <textarea
                  id="razlog"
                  className="form-control"
                  style={{ minHeight: '80px' }}
                  value={razlog}
                  onChange={(e) => setRazlog(e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
