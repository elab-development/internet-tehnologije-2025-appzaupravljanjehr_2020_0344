export interface Korisnik {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'superuser' | 'administrator' | 'rukovodilac' | 'zaposleni';
  jmbg: string;
  broj_telefona: string;
  organizaciona_jedinica?: number | null;
  radno_mesto?: number | null;
  rukovodilac?: number | null;
  is_active?: boolean;
}

export interface KorisnikFull extends Korisnik {
  srednje_ime?: string;
  pol?: string;
  datum_rodjenja?: string;
  mesto_rodjenja?: string;
  drzava?: string;
  adresa?: string;
  strucna_sprema?: string;
  organizaciona_jedinica_naziv?: string;
  radno_mesto_naziv?: string;
  rukovodilac_ime?: string;
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
  nadredjena_org_jed?: number | null;
  rukovodilac?: number | null;
  rukovodilac_ime?: string | null;
}

export interface RadnoMesto {
  id: number;
  naziv: string;
  opis?: string;
  org_jed: number;
  org_jed_naziv?: string;
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

export interface TipCilja {
  id: number;
  naziv: string;
}

export interface Cilj {
  id: number;
  naziv: string;
  tip_cilja: number;
  tip_cilja_naziv?: string;
  status: 'aktivan' | 'neaktivan';
}

export interface DodeljeniCilj {
  id: number;
  cilj: number;
  cilj_naziv?: string;
  tip_cilja_naziv?: string;
  cilj_status?: 'aktivan' | 'neaktivan';
  zaposleni: number;
  zaposleni_ime?: string;
  datum_Od: string;
  datum_Do: string;
}

export type StatusOdmora = 'na_cekanju' | 'odobren' | 'odbijen';

export interface StanjeOdmora {
  godina: number;
  ukupno: number;
  iskorisceno: number;
  na_cekanju: number;
  preostalo: number;
}

export interface Odmor {
  id: number;
  zaposleni: number;
  zaposleni_ime: string;
  organizaciona_jedinica_naziv?: string | null;
  rukovodilac?: number | null;
  rukovodilac_ime?: string | null;
  datum_Od: string;
  datum_Do: string;
  broj_dana: number;
  napomena?: string | null;
  status: StatusOdmora;
  status_naziv: string;
  razlog_odbijanja?: string | null;
  datum_podnosenja: string;
  obradio?: number | null;
  obradio_ime?: string | null;
  datum_obrade?: string | null;
  stanje?: StanjeOdmora;
}

export interface Plata {
  id: number;
  radno_mesto: number;
  radno_mesto_naziv?: string;
  org_jed_naziv?: string;
  bruto: string;
  neto: string;
}

export interface Isplata {
  id: number;
  korisnik: number;
  korisnik_ime: string;
  plata?: number | null;
  datum_isplate: string;
  iznos_bruto: string;
  iznos_neto: string;
  bonus: string;
  ukupno_neto: string;
  izmenio?: number | null;
  izmenio_ime?: string | null;
  datum_izmene: string;
}

export interface PlatePregled {
  id: number;
  ime: string;
  role: string;
  radno_mesto?: number | null;
  radno_mesto_naziv?: string | null;
  organizaciona_jedinica_naziv?: string | null;
  plata_id?: number | null;
  bruto?: string | null;
  neto?: string | null;
  broj_isplata: number;
  poslednja_isplata?: string | null;
  isplaceno_neto_godina: string;
  bonusi_godina: string;
}

export interface OblastOcenjivanja {
  id: number;
  naziv: string;
  opis?: string | null;
}

export interface TezinskiKoeficijent {
  id: number;
  radno_mesto: number;
  radno_mesto_naziv?: string;
  org_jed_naziv?: string;
  oblast_ocenjivanja_1: number;
  oblast_ocenjivanja_2: number;
  oblast_ocenjivanja_3: number;
  oblast_ocenjivanja_4: number;
  oblast_ocenjivanja_5: number;
  oblast_1_naziv?: string;
  oblast_2_naziv?: string;
  oblast_3_naziv?: string;
  oblast_4_naziv?: string;
  oblast_5_naziv?: string;
  koef_1: string;
  koef_2: string;
  koef_3: string;
  koef_4: string;
  koef_5: string;
}

export interface OcenaOblast {
  naziv: string;
  koeficijent: string;
  ocena: number;
}

export interface Ocena {
  id: number;
  zaposleni: number;
  zaposleni_ime: string;
  rukovodilac?: number | null;
  rukovodilac_ime?: string | null;
  tezinski_koeficijent?: number | null;
  ocena_1: number;
  ocena_2: number;
  ocena_3: number;
  ocena_4: number;
  ocena_5: number;
  zbirna_ocena?: string | null;
  datum_Od: string;
  datum_Do: string;
  oblasti: OcenaOblast[];
}

export interface KPI {
  id: number;
  naziv: string;
  opis?: string | null;
  target: string;
}

export interface OstvareniKPI {
  id: number;
  dodeljeni_kpi: number;
  ostvarena_vrednost: string;
  datum: string;
  opis?: string | null;
  rukovodilac?: number | null;
  rukovodilac_ime?: string | null;
}

export interface DodeljeniKPI {
  id: number;
  kpi: number;
  kpi_naziv: string;
  kpi_opis?: string | null;
  kpi_target: string;
  korisnik: number;
  korisnik_ime: string;
  datum_Od: string;
  datum_Do: string;
  datum_dodele: string;
  poslednja_vrednost?: string | null;
  procenat: number;
  broj_unosa: number;
  istorija?: OstvareniKPI[];
}