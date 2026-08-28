import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { ProfileEdit } from './pages/ProfileEdit';
import { UsersList } from './pages/UsersList';
import { OrganizacionaJedinica } from './pages/OrganizacionaJedinica';
import { RadnoMesto } from './pages/RadnoMesto';
import { NoviCilj } from './pages/NoviCilj';
import { DodelaCiljeva } from './pages/DodelaCiljeva';
import { Odmori } from './pages/Odmori';
import { NoviZahtevOdmor } from './pages/NoviZahtevOdmor';
import { Plate } from './pages/Plate';
import { Ocenjivanje } from './pages/Ocenjivanje';
import { Koeficijenti } from './pages/Koeficijenti';
import { KPI } from './pages/KPI';
import { DodelaKPI } from './pages/DodelaKPI';
import { NapredakKPI } from './pages/NapredakKPI';
import { authApi, korisniciApi, organizacioneJediniceApi, radnaMestaApi } from './api';
import type { KorisnikFull, OrganizacionaJedinica as OrgJedinicaType, RadnoMesto as RadnoMestoType } from './types';
import './App.css';

type Page = 'login' | 'home' | 'profile' | 'profile-edit' | 'profile-create' | 'users' | 'user-detail' | 'user-edit' | 'organizaciona-jedinica' 
  | 'radno-mesto' | 'novi-cilj' | 'dodela-ciljeva' | 'odmori' | 'novi-zahtev-odmor' | 'plate' | 'ocenjivanje' | 'koeficijenti'
  | 'kpi' | 'dodela-kpi' | 'napredak-kpi';

const STRANICE_CILJEVA: string[] = ['novi-cilj', 'dodela-ciljeva', 'dodela-kpi'];
const STRANICE_STRUKTURE: string[] = ['organizaciona-jedinica', 'radno-mesto', 'profile-create', 'plate', 'koeficijenti'];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<KorisnikFull | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<KorisnikFull | null>(null);

  const [organizacioneJedinice, setOrganizacioneJedinice] = useState<OrgJedinicaType[]>([]);
  const [radnaMesta, setRadnaMesta] = useState<RadnoMestoType[]>([]);
  const [rukovodioci, setRukovodioci] = useState<KorisnikFull[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setCurrentPage('home');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDropdownData();
    }
  }, [isAuthenticated]);

  const loadDropdownData = async () => {
    try {
      const [orgJedinice, radnaMestaData, korisnici] = await Promise.all([
        organizacioneJediniceApi.getAll(),
        radnaMestaApi.getAll(),
        korisniciApi.getAll(),
      ]);
      setOrganizacioneJedinice(orgJedinice);
      setRadnaMesta(radnaMestaData);
      setRukovodioci(korisnici.filter((k: any) => k.role === 'rukovodilac' || k.role === 'administrator'));
    } catch (err) {
      console.error('Greška pri učitavanju podataka za forme:', err);
    }
  };

  useEffect(() => {
    if (selectedUserId && (currentPage === 'user-detail' || currentPage === 'user-edit')) {
      loadUserDetails(selectedUserId);
    }
  }, [selectedUserId, currentPage]);

  const loadUserDetails = async (id: number) => {
    try {
      const user = await korisniciApi.getById(id);
      setSelectedUser(user);
    } catch (err) {
      console.error('Greška pri učitavanju korisnika:', err);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      if (response.success && response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        setIsAuthenticated(true);
        setCurrentPage('home');
        setLoginError(null);
      } else {
        setLoginError(response.error || 'Pogrešno korisničko ime ili lozinka.');
      }
    } catch (err) {
      setLoginError('Pogrešno korisničko ime ili lozinka.');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Greška pri odjavi:', err);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('login');
  };

  const handleNavigate = (page: string) => {
    const userRole = currentUser?.role;
    const upravljaCiljevima = userRole && ['superuser', 'administrator', 'rukovodilac'].includes(userRole);
    const upravljaStrukturom = userRole && ['superuser', 'administrator'].includes(userRole);

    if (STRANICE_CILJEVA.includes(page) && !upravljaCiljevima) {
      setCurrentPage('home');
      return;
    }

    if (STRANICE_STRUKTURE.includes(page) && !upravljaStrukturom) {
      setCurrentPage('home');
      return;
    }

    setCurrentPage(page as Page);
    if (page !== 'user-detail' && page !== 'user-edit') {
      setSelectedUserId(null);
      setSelectedUser(null);
    }
  };

  const handleViewUser = (id: number) => {
    setSelectedUserId(id);
    setCurrentPage('user-detail');
  };

  const handleEditUser = (id: number) => {
    setSelectedUserId(id);
    setCurrentPage('user-edit');
  };

  const handleSaveProfile = async (data: any) => {
    try {
      if (currentPage === 'profile-create') {
        await korisniciApi.create(data);
        await loadDropdownData();
        setCurrentPage('users');
      } else if (currentPage === 'user-edit' && selectedUserId) {
        await korisniciApi.update(selectedUserId, data);
        await loadDropdownData();
        setCurrentPage('users');
      } else if (currentPage === 'profile-edit' && currentUser) {
        const updatedUser = await korisniciApi.update(currentUser.id, data);
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setCurrentPage('profile');
      }
    } catch (err : any) {
      const message = err?.response?.data?.error || 'Greška pri čuvanju podataka.';
      alert(message);
      console.error('Greška pri čuvanju:', err);
    }
  };

  
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} error={loginError} />;

      case 'home':
        return <Home onNavigate={handleNavigate} currentUser={currentUser} />;

      case 'profile':
        return currentUser ? (
          <Profile
            user={currentUser}
            currentUserId={currentUser.id}
            isStaff={currentUser.is_staff || false}
            onEdit={() => setCurrentPage('profile-edit')}
          />
        ) : null;

      case 'profile-edit':
        return currentUser ? (
          <ProfileEdit
            user={currentUser}
            currentUser={currentUser}
            isCreateMode={false}
            organizacioneJedinice={organizacioneJedinice}
            radnaMesta={radnaMesta}
            rukovodioci={rukovodioci}
            onSave={handleSaveProfile}
            onCancel={() => setCurrentPage('profile')}
          />
        ) : null;

      case 'profile-create':
        return (
          <ProfileEdit
            user={null}
            currentUser={currentUser}
            isCreateMode={true}
            organizacioneJedinice={organizacioneJedinice}
            radnaMesta={radnaMesta}
            rukovodioci={rukovodioci}
            onSave={handleSaveProfile}
            onCancel={() => setCurrentPage('users')}
          />
        );

      case 'users':
        return (
          <UsersList
            onAddUser={() => setCurrentPage('profile-create')}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            currentUserRole={currentUser?.role}
          />
        );

      case 'user-detail':
        return selectedUser && currentUser ? (
          <Profile
            user={selectedUser}
            currentUserId={currentUser.id}
            isStaff={currentUser.is_staff || false}
            onEdit={() => setCurrentPage('user-edit')}
            onBack={() => setCurrentPage('users')}
          />
        ) : (
          <div className="loading">Učitavanje...</div>
        );

      case 'user-edit':
        return selectedUser ? (
          <ProfileEdit
            user={selectedUser}
            currentUser={currentUser}
            isCreateMode={false}
            isUpdateMode={true}
            organizacioneJedinice={organizacioneJedinice}
            radnaMesta={radnaMesta}
            rukovodioci={rukovodioci}
            onSave={handleSaveProfile}
            onCancel={() => setCurrentPage('users')}
          />
        ) : (
          <div className="loading">Učitavanje...</div>
        );

      case 'organizaciona-jedinica':
        return (
          <OrganizacionaJedinica
            onSave={() => { loadDropdownData(); setCurrentPage('users'); }}
            onCancel={() => setCurrentPage('users')}
          />
        );

      case 'radno-mesto':
        return (
          <RadnoMesto
            onSave={() => { loadDropdownData(); setCurrentPage('users'); }}
            onCancel={() => setCurrentPage('users')}
          />
        );

      case 'novi-cilj':
        return (
          <NoviCilj
            onSave={() => setCurrentPage('home')}
            onCancel={() => setCurrentPage('home')}
          />
        );
  
      case 'dodela-ciljeva':
        return (
          <DodelaCiljeva
            onSave={() => setCurrentPage('home')}
            onCancel={() => setCurrentPage('home')}
          />
        );  

      case 'odmori':
        return currentUser ? (
          <Odmori
            currentUser={currentUser}
            onNoviZahtev={() => setCurrentPage('novi-zahtev-odmor')}
          />
        ) : null;

      case 'novi-zahtev-odmor':
        return (
          <NoviZahtevOdmor
            onSave={() => setCurrentPage('odmori')}
            onCancel={() => setCurrentPage('odmori')}
          />
        );

      case 'plate':
        return <Plate />;

      case 'ocenjivanje':
        return currentUser ? (
          <Ocenjivanje
            currentUser={currentUser}
            onKoeficijenti={() => handleNavigate('koeficijenti')}
          />
        ) : null;

      case 'koeficijenti':
        return <Koeficijenti />;

      case 'kpi':
        return currentUser ? (
          <KPI currentUser={currentUser} onDodela={() => handleNavigate('dodela-kpi')} />
        ) : null;

      case 'dodela-kpi':
        return currentUser ? (
          <DodelaKPI
            currentUser={currentUser}
            onSave={() => setCurrentPage('napredak-kpi')}
            onCancel={() => setCurrentPage('kpi')}
          />
        ) : null;

      case 'napredak-kpi':
        return currentUser ? (
          <NapredakKPI currentUser={currentUser} onDodela={() => handleNavigate('dodela-kpi')} />
        ) : null;

      default:
        return <Home onNavigate={handleNavigate} currentUser={currentUser} />;
    }
  };

  return (
    <Layout
      isAuthenticated={isAuthenticated}
      userRole={currentUser?.role}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
