import { useState, useEffect } from 'react';
import { korisniciApi, organizacioneJediniceApi, radnaMestaApi} from '../api';
import type { Korisnik, OrganizacionaJedinica, RadnoMesto } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './UsersList.css';

interface UsersListProps {
  onAddUser: () => void;
  onViewUser: (id: number) => void;
  onEditUser: (id: number) => void;
  currentUserRole?: string;
}

export function UsersList({ onAddUser, onViewUser, onEditUser, currentUserRole }: UsersListProps) {
  const canCreateUser = currentUserRole === 'superuser' || currentUserRole === 'administrator';
  const [users, setUsers] = useState<Korisnik[]>([]);
  const [organizacioneJedinice, setOrganizacioneJedinice] = useState<OrganizacionaJedinica[]>([]);
  const [radnaMesta, setRadnaMesta] = useState<RadnoMesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: number | null; userName: string }>({
    open: false,
    userId: null,
    userName: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrgJedinica, setFilterOrgJedinica] = useState('');
  const [filterRadnoMesto, setFilterRadnoMesto] = useState('');
  const [filteredRadnaMesta, setFilteredRadnaMesta] = useState<RadnoMesto[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterOrgJedinica) {
      const filtered = radnaMesta.filter(rm => rm.org_jed === Number(filterOrgJedinica));
      setFilteredRadnaMesta(filtered);
      setFilterRadnoMesto('');
    } else {
      setFilteredRadnaMesta(radnaMesta);
    }
  }, [filterOrgJedinica, radnaMesta]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, orgData, rmData] = await Promise.all([
        korisniciApi.getAll(),
        organizacioneJediniceApi.getAll(),
        radnaMestaApi.getAll(),
      ]);
      setUsers(usersData);
      setOrganizacioneJedinice(orgData);
      setRadnaMesta(rmData);
      setFilteredRadnaMesta(rmData);
    } catch (err) {
      console.error('Greška pri učitavanju korisnika:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        fullName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.jmbg.includes(searchTerm);

      const matchesOrgJedinica = filterOrgJedinica === '' ||

        user.organizaciona_jedinica === Number(filterOrgJedinica);

      const matchesRadnoMesto = filterRadnoMesto === '' ||
        user.radno_mesto === Number(filterRadnoMesto);

      return matchesSearch && matchesOrgJedinica && matchesRadnoMesto;
    });
  };

  const filteredUsers = getFilteredUsers();

  const openDeleteModal = (userId: number, userName: string) => {
    setDeleteModal({ open: true, userId, userName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, userId: null, userName: '' });
  };

  const confirmDelete = async () => {
    if (deleteModal.userId) {
      try {
        await korisniciApi.delete(deleteModal.userId);
        setUsers(users.filter(u => u.id !== deleteModal.userId));
        closeDeleteModal();
      } catch (err) {
        console.error('Greška pri brisanju korisnika:', err);
      }
    }
  };

  if (loading) {
    return <div className="users-wrapper"><div className="users-container">Učitavanje...</div></div>;
  }

  return (
    <div className="users-wrapper">
      <div className="users-container">
        <div className="header-section">
          <h1 className="page-title">Lista korisnika</h1>
          <Button variant="primary" onClick={onAddUser} className="add-user-btn">
            <i className="fas fa-user-plus"></i> Dodaj korisnika
          </Button>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              placeholder="Pretrazi po imenu, emailu ili JMBG..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              className="filter-select"
              value={filterOrgJedinica}
              onChange={(e) => setFilterOrgJedinica(e.target.value)}
            >
              <option value="">Sve org. jedinice</option>
              {organizacioneJedinice.map(oj => (
                <option key={oj.id} value={oj.id}>{oj.naziv}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="filter-select"
              value={filterRadnoMesto}
              onChange={(e) => setFilterRadnoMesto(e.target.value)}
            >
              <option value="">Sva radna mesta</option>
              {filteredRadnaMesta.map(rm => (
                <option key={rm.id} value={rm.id}>{rm.naziv}</option>
              ))}
            </select>
          </div>
          {(searchTerm || filterOrgJedinica || filterRadnoMesto) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterOrgJedinica('');
                setFilterRadnoMesto('');
              }}
            >
              Ocisti filtere
            </Button>
          )}
        </div>

        {filteredUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Ime i prezime</th>
                <th>JMBG</th>
                <th>Email</th>
                <th>Uloga</th>
                <th>Telefon</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.jmbg}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.broj_telefona || '—'}</td>
                  <td>
                    <div className="action-icons">
                      <Button
                        variant="icon"
                        className="icon-btn detail-icon"
                        title="Detalji"
                        onClick={() => onViewUser(user.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </Button>
                      <Button
                        variant="icon"
                        className="icon-btn edit-icon"
                        title="Izmeni"
                        onClick={() => onEditUser(user.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </Button>
                      <Button
                        variant="icon"
                        className="icon-btn delete-icon"
                        title="Obriši"
                        onClick={() => openDeleteModal(user.id, `${user.first_name} ${user.last_name}`)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-users">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#64748b" width="48" height="48">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <p>{users.length === 0 ? 'Trenutno nema registrovanih korisnika.' : 'Nema korisnika koji odgovaraju filterima.'}</p>
          </div>
        )}
      </div>

      <Modal
        open={deleteModal.open}
        onClose={closeDeleteModal}
        title="Potvrda brisanja"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" width="48" height="48">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        }
        actions={
          <>
            <Button variant="cancel" onClick={closeDeleteModal}>Otkaži</Button>
            <Button variant="danger" onClick={confirmDelete}>Obriši</Button>
          </>
        }
      >
        <p>
          Da li ste sigurni da želite da obrišete korisnika <strong>{deleteModal.userName}</strong>?
        </p>
      </Modal>
    </div>
  );
}
