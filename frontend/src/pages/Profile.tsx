import type { KorisnikFull } from '../types';
import { Button } from '../components/Button';
import './Profile.css';

interface ProfileProps {
  user: KorisnikFull;
  currentUserId: number;
  isStaff: boolean;
  onEdit: () => void;
  onBack?: () => void;
}

export function Profile({ user, currentUserId, isStaff, onEdit, onBack }: ProfileProps) {
  const isOwnProfile = user.id === currentUserId;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS');
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        {isOwnProfile ? (
          <Button onClick={onEdit} variant="primary" className="edit-profile">Izmeni profil</Button>
        ) : isStaff ? (
          <>
            {onBack && (
              <Button onClick={onBack} variant="cancel" className="edit-profile back-btn">Nazad na listu</Button>
            )}
            <Button onClick={onEdit} variant="primary" className="edit-profile">Izmeni profil</Button>
          </>
        ) : null}

        <div className="section-title">Lični podaci</div>
        <div className="profile-item"><span>Ime:</span> {user.first_name}</div>
        <div className="profile-item"><span>Srednje ime:</span> {user.srednje_ime || '—'}</div>
        <div className="profile-item"><span>Prezime:</span> {user.last_name}</div>
        <div className="profile-item"><span>JMBG:</span> {user.jmbg}</div>
        <div className="profile-item"><span>Pol:</span> {user.pol || '—'}</div>
        <div className="profile-item"><span>Datum rođenja:</span> {formatDate(user.datum_rodjenja)}</div>
        <div className="profile-item"><span>Mesto rođenja:</span> {user.mesto_rodjenja || '—'}</div>
        <div className="profile-item"><span>Država:</span> {user.drzava || '—'}</div>

        <div className="section-title">Kontakt podaci</div>
        <div className="profile-item"><span>Adresa:</span> {user.adresa || '—'}</div>
        <div className="profile-item"><span>Telefon:</span> {user.broj_telefona || '—'}</div>
        <div className="profile-item"><span>Email:</span> {user.email || '—'}</div>

        <div className="section-title">Poslovni podaci</div>
        <div className="profile-item"><span>Organizaciona jedinica:</span> {user.organizaciona_jedinica_naziv || '—'}</div>
        <div className="profile-item"><span>Radno mesto:</span> {user.radno_mesto_naziv || '—'}</div>
        <div className="profile-item"><span>Rukovodilac:</span> {user.rukovodilac_ime || '—'}</div>
        <div className="profile-item"><span>Stručna sprema:</span> {user.strucna_sprema || '—'}</div>
        <div className="profile-item"><span>Status:</span> {user.role}</div>
      </div>
    </div>
  );
}
