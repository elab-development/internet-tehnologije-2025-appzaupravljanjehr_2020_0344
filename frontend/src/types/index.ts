export interface Korisnik {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'superuser' | 'administrator' | 'rukovodilac' | 'zaposleni';
  jmbg: string;
  broj_telefona: string;
}

export interface KorisnikFull extends Korisnik {
  srednje_ime?: string;
  pol?: string;
  datum_rodjenja?: string;
  mesto_rodjenja?: string;
  drzava?: string;
  adresa?: string;
  strucna_sprema?: string;
  organizaciona_jedinica?: number;
  organizaciona_jedinica_naziv?: string;
  radno_mesto?: number;
  radno_mesto_naziv?: string;
  rukovodilac?: number;
  rukovodilac_ime?: string;
  is_active?: boolean;
  is_staff?: boolean;
}

export interface KorisnikCreate {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  jmbg: string;
}

export interface KorisnikUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  broj_telefona?: string;
}

export interface OrganizacionaJedinica {
  id: number;
  naziv: string;
  opis?: string;
  nadredjena_org_jed?: number;
  rukovodilac?: number;
}

export interface RadnoMesto {
  id: number;
  naziv: string;
  opis?: string;
  org_jed: number;
}

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_staff: boolean;
}
