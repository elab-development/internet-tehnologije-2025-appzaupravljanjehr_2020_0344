import { useState, useEffect } from 'react';
import type { KorisnikFull, OrganizacionaJedinica, RadnoMesto } from '../types';
import './ProfileEdit.css';

interface ProfileEditProps {
  user?: KorisnikFull | null;
  isCreateMode: boolean;
  isUpdateMode?: boolean;
  organizacioneJedinice: OrganizacionaJedinica[];
  radnaMesta: RadnoMesto[];
  rukovodioci: KorisnikFull[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function ProfileEdit({
  user,
  isCreateMode,
  isUpdateMode,
  organizacioneJedinice,
  radnaMesta,
  rukovodioci,
  onSave,
  onCancel,
}: ProfileEditProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    srednje_ime: user?.srednje_ime || '',
    jmbg: user?.jmbg || '',
    pol: user?.pol || '',
    datum_rodjenja: user?.datum_rodjenja || '',
    mesto_rodjenja: user?.mesto_rodjenja || '',
    drzava: user?.drzava || '',
    adresa: user?.adresa || '',
    broj_telefona: user?.broj_telefona || '',
    email: user?.email || '',
    strucna_sprema: user?.strucna_sprema || '',
    organizaciona_jedinica: user?.organizaciona_jedinica || '',
    radno_mesto: user?.radno_mesto || '',
    rukovodilac: user?.rukovodilac || '',
    role: user?.role || 'zaposleni',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        srednje_ime: user.srednje_ime || '',
        jmbg: user.jmbg || '',
        pol: user.pol || '',
        datum_rodjenja: user.datum_rodjenja || '',
        mesto_rodjenja: user.mesto_rodjenja || '',
        drzava: user.drzava || '',
        adresa: user.adresa || '',
        broj_telefona: user.broj_telefona || '',
        email: user.email || '',
        strucna_sprema: user.strucna_sprema || '',
        organizaciona_jedinica: user.organizaciona_jedinica || '',
        radno_mesto: user.radno_mesto || '',
        rukovodilac: user.rukovodilac || '',
        role: user.role || 'zaposleni',
        is_active: user.is_active ?? true,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="edit-wrapper">
      <div className="edit-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h1 className="form-title">
              {isCreateMode ? 'Kreiraj profil' : 'Izmeni profil'}
            </h1>
            <div className="form-buttons">
              <button type="submit" className="btn-save">Sačuvaj</button>
              <button type="button" onClick={onCancel} className="btn-cancel">Otkaži</button>
            </div>
          </div>

          {isCreateMode && (
            <>
              <div className="section-title">Podaci za prijavu</div>
              <div className="form-row">
                <div className="form-col">
                  <div className="form-item">
                    <label htmlFor="username" className="field-required">Korisničko ime</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-input"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-col">
                  <div className="form-item">
                    <label htmlFor="password" className="field-required">Lozinka</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-input"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="section-title">Lični podaci</div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="first_name" className="field-required">Ime</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className="form-input"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="last_name" className="field-required">Prezime</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className="form-input"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="srednje_ime">Srednje ime</label>
            <input
              type="text"
              id="srednje_ime"
              name="srednje_ime"
              className="form-input"
              value={formData.srednje_ime}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="jmbg" className="field-required">JMBG</label>
                <input
                  type="text"
                  id="jmbg"
                  name="jmbg"
                  className="form-input"
                  value={formData.jmbg}
                  onChange={handleChange}
                  disabled={!isCreateMode}
                  required
                  pattern="[0-9]{13}"
                  maxLength={13}
                />
                <div className="help-text">
                  {!isCreateMode ? 'JMBG se ne može menjati nakon kreiranja profila' : 'Unesite 13 cifara'}
                </div>
              </div>
            </div>
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="pol">Pol</label>
                <select
                  id="pol"
                  name="pol"
                  className="form-input"
                  value={formData.pol}
                  onChange={handleChange}
                >
                  <option value="">Odaberite pol</option>
                  <option value="M">Muški</option>
                  <option value="Z">Ženski</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="datum_rodjenja">Datum rođenja</label>
                <input
                  type="date"
                  id="datum_rodjenja"
                  name="datum_rodjenja"
                  className="form-input"
                  value={formData.datum_rodjenja}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="mesto_rodjenja">Mesto rođenja</label>
                <input
                  type="text"
                  id="mesto_rodjenja"
                  name="mesto_rodjenja"
                  className="form-input"
                  value={formData.mesto_rodjenja}
                  onChange={handleChange}
                  disabled={!isCreateMode}
                />
                {!isCreateMode && <div className="help-text">Mesto rođenja se ne može menjati</div>}
              </div>
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="drzava">Država</label>
            <input
              type="text"
              id="drzava"
              name="drzava"
              className="form-input"
              value={formData.drzava}
              onChange={handleChange}
              disabled={!isCreateMode}
            />
            {!isCreateMode && <div className="help-text">Država se ne može menjati</div>}
          </div>

          <div className="section-title">Kontakt podaci</div>

          <div className="form-item">
            <label htmlFor="adresa">Adresa</label>
            <input
              type="text"
              id="adresa"
              name="adresa"
              className="form-input"
              value={formData.adresa}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="broj_telefona">Telefon</label>
                <input
                  type="tel"
                  id="broj_telefona"
                  name="broj_telefona"
                  className="form-input"
                  value={formData.broj_telefona}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="email" className="field-required">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="section-title">Poslovni podaci</div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-item">
                <label htmlFor="strucna_sprema">Stručna sprema</label>
                <select
                  id="strucna_sprema"
                  name="strucna_sprema"
                  className="form-input"
                  value={formData.strucna_sprema}
                  onChange={handleChange}
                >
                  <option value="">Odaberite stručnu spremu</option>
                  <option value="Osnovna škola">Osnovna škola</option>
                  <option value="Srednja škola">Srednja škola</option>
                  <option value="Viša škola">Viša škola</option>
                  <option value="Fakultet">Fakultet</option>
                  <option value="Master">Master</option>
                  <option value="Doktorat">Doktorat</option>
                </select>
              </div>
            </div>
          </div>

          {isCreateMode ? (
            <>
              <div className="form-row">
                <div className="form-col">
                  <div className="form-item">
                    <label htmlFor="organizaciona_jedinica">Organizaciona jedinica</label>
                    <select
                      id="organizaciona_jedinica"
                      name="organizaciona_jedinica"
                      className="form-input"
                      value={formData.organizaciona_jedinica}
                      onChange={handleChange}
                    >
                      <option value="">Odaberite organizacionu jedinicu</option>
                      {organizacioneJedinice.map(oj => (
                        <option key={oj.id} value={oj.id}>{oj.naziv}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-col">
                  <div className="form-item">
                    <label htmlFor="radno_mesto">Radno mesto</label>
                    <select
                      id="radno_mesto"
                      name="radno_mesto"
                      className="form-input"
                      value={formData.radno_mesto}
                      onChange={handleChange}
                    >
                      <option value="">Odaberite radno mesto</option>
                      {radnaMesta.map(rm => (
                        <option key={rm.id} value={rm.id}>{rm.naziv}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <div className="form-item">
                    <label htmlFor="rukovodilac">Rukovodilac</label>
                    <select
                      id="rukovodilac"
                      name="rukovodilac"
                      className="form-input"
                      value={formData.rukovodilac}
                      onChange={handleChange}
                    >
                      <option value="">Odaberite rukovodioca</option>
                      {rukovodioci.map(r => (
                        <option key={r.id} value={r.id}>{r.first_name} {r.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-col">
                  <div className="form-item">
                    <label htmlFor="role">Uloga</label>
                    <select
                      id="role"
                      name="role"
                      className="form-input"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="zaposleni">Zaposleni</option>
                      <option value="rukovodilac">Rukovodilac</option>
                      <option value="administrator">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-item">
                <label htmlFor="is_active">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  {' '}Aktivan korisnik
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="form-item">
                <label>Organizaciona jedinica</label>
                <input
                  type="text"
                  value={user?.organizaciona_jedinica_naziv || '—'}
                  className="form-input"
                  disabled
                />
                <div className="help-text">Organizaciona jedinica se ne može menjati ovde</div>
              </div>

              <div className="form-item">
                <label>Radno mesto</label>
                <input
                  type="text"
                  value={user?.radno_mesto_naziv || '—'}
                  className="form-input"
                  disabled
                />
                <div className="help-text">Radno mesto se ne može menjati ovde</div>
              </div>

              <div className="form-item">
                <label>Rukovodilac</label>
                <input
                  type="text"
                  value={user?.rukovodilac_ime || '—'}
                  className="form-input"
                  disabled
                />
                <div className="help-text">Rukovodilac se ne može menjati ovde</div>
              </div>

              <div className="form-item">
                <label>Status</label>
                <input
                  type="text"
                  value={user?.role || '—'}
                  className="form-input"
                  disabled
                />
                <div className="help-text">Status se ne može menjati ovde</div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
