import axios from 'axios';
import type { Korisnik, KorisnikFull, KorisnikCreate, KorisnikUpdate, TipCilja, Cilj, DodeljeniCilj, OrganizacionaJedinica, RadnoMesto, Odmor, StanjeOdmora, Plata, Isplata, PlatePregled,
  OblastOcenjivanja, TezinskiKoeficijent, Ocena, KPI, DodeljeniKPI, OstvareniKPI} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const authApi = {
  login: async (username: string, password: string): Promise<{ success: boolean; user?: KorisnikFull; error?: string }> => {
    const response = await api.post('/login/', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout/');
  },
};

export const korisniciApi = {
  getAll: async (): Promise<Korisnik[]> => {
    const response = await api.get('/korisnici/');
    return response.data;
  },

  getById: async (id: number): Promise<KorisnikFull> => {
    const response = await api.get(`/korisnici/${id}/`);
    return response.data;
  },

  create: async (data: KorisnikCreate): Promise<KorisnikFull> => {
    const response = await api.post('/korisnici/', data);
    return response.data;
  },

  update: async (id: number, data: KorisnikUpdate): Promise<KorisnikFull> => {
    const response = await api.put(`/korisnici/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/korisnici/${id}/`);
  },
};

export const organizacioneJediniceApi = {
  getAll: async (): Promise<OrganizacionaJedinica[]> => {
    const response = await api.get('/organizacione-jedinice/');
    return response.data;
  },

  create: async (data: { naziv: string; opis?: string; nadredjena_org_jed?: number; rukovodilac?: number }): Promise<OrganizacionaJedinica> => {
    const response = await api.post('/organizacione-jedinice/', data);
    return response.data;
  },
};

export const radnaMestaApi = {
  getAll: async (): Promise<RadnoMesto[]> => {
    const response = await api.get('/radna-mesta/');
    return response.data;
  },

  create: async (data: { naziv: string; opis?: string; org_jed: number }): Promise<RadnoMesto> => {
    const response = await api.post('/radna-mesta/', data);
    return response.data;
  },
};

export const tipoviCiljevaApi = {
  getAll: async (): Promise<TipCilja[]> => {
    const response = await api.get('/tipovi-ciljeva/');
    return response.data;
  },

  create: async (naziv: string): Promise<TipCilja> => {
    const response = await api.post('/tipovi-ciljeva/', { naziv });
    return response.data;
  },
};

export const ciljeviApi = {
  getAll: async (): Promise<Cilj[]> => {
    const response = await api.get('/ciljevi/');
    return response.data;
  },

  getById: async (id: number): Promise<Cilj> => {
    const response = await api.get(`/ciljevi/${id}/`);
    return response.data;
  },

  create: async (data: { naziv: string; tip_cilja: number; status: string }): Promise<Cilj> => {
    const response = await api.post('/ciljevi/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Cilj>): Promise<Cilj> => {
    const response = await api.put(`/ciljevi/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ciljevi/${id}/`);
  },
};

export const dodeljeniCiljeviApi = {
  getAll: async (): Promise<DodeljeniCilj[]> => {
    const response = await api.get('/dodeljeni-ciljevi/');
    return response.data;
  },

  create: async (data: { cilj: number; zaposleni: number; datum_Od: string; datum_Do: string }): Promise<DodeljeniCilj> => {
    const response = await api.post('/dodeljeni-ciljevi/', data);
    return response.data;
  },

  createMasovno: async (data: {
    cilj: number;
    datum_Od: string;
    datum_Do: string;
    organizaciona_jedinica?: number;
    radno_mesto?: number;
    zaposleni_ids?: number[];
  }): Promise<{ success: boolean; created: number; skipped: number; message: string }> => {
    const response = await api.post('/dodeli-cilj-masovno/', data);
    return response.data;
  },
};

export const odmoriApi = {
  getAll: async (params?: { status?: string; zaposleni?: number }): Promise<Odmor[]> => {
    const response = await api.get('/odmori/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Odmor> => {
    const response = await api.get(`/odmori/${id}/`);
    return response.data;
  },

  create: async (data: { datum_Od: string; datum_Do: string; napomena?: string }): Promise<Odmor> => {
    const response = await api.post('/odmori/', data);
    return response.data;
  },

  odobri: async (id: number): Promise<Odmor> => {
    const response = await api.put(`/odmori/${id}/`, { status: 'odobren' });
    return response.data;
  },

  odbij: async (id: number, razlog_odbijanja: string): Promise<Odmor> => {
    const response = await api.put(`/odmori/${id}/`, { status: 'odbijen', razlog_odbijanja });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/odmori/${id}/`);
  },

  stanje: async (params?: { zaposleni?: number; godina?: number }): Promise<StanjeOdmora> => {
    const response = await api.get('/odmori/stanje/', { params });
    return response.data;
  },
};

export const plateApi = {
  getAll: async (): Promise<Plata[]> => {
    const response = await api.get('/plate/');
    return response.data;
  },

  pregled: async (): Promise<PlatePregled[]> => {
    const response = await api.get('/plate/pregled/');
    return response.data;
  },

  create: async (data: { radno_mesto: number; bruto: string; neto: string }): Promise<Plata> => {
    const response = await api.post('/plate/', data);
    return response.data;
  },

  update: async (id: number, data: { bruto?: string; neto?: string }): Promise<Plata> => {
    const response = await api.put(`/plate/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/plate/${id}/`);
  },
};

export const isplateApi = {
  getAll: async (params?: { korisnik?: number }): Promise<Isplata[]> => {
    const response = await api.get('/isplate/', { params });
    return response.data;
  },

  create: async (data: { korisnik: number; datum_isplate: string; iznos_bruto?: string; iznos_neto?: string; bonus?: string }): Promise<Isplata> => {
    const response = await api.post('/isplate/', data);
    return response.data;
  },

  update: async (id: number, data: { datum_isplate?: string; iznos_bruto?: string; iznos_neto?: string; bonus?: string }): Promise<Isplata> => {
    const response = await api.put(`/isplate/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/isplate/${id}/`);
  },
};

export const oblastiOcenjivanjaApi = {
  getAll: async (): Promise<OblastOcenjivanja[]> => {
    const response = await api.get('/oblasti-ocenjivanja/');
    return response.data;
  },

  create: async (data: { naziv: string; opis?: string }): Promise<OblastOcenjivanja> => {
    const response = await api.post('/oblasti-ocenjivanja/', data);
    return response.data;
  },
};

export interface TezinskiKoeficijentPayload {
  radno_mesto: number;
  oblast_ocenjivanja_1: number;
  oblast_ocenjivanja_2: number;
  oblast_ocenjivanja_3: number;
  oblast_ocenjivanja_4: number;
  oblast_ocenjivanja_5: number;
  koef_1: string;
  koef_2: string;
  koef_3: string;
  koef_4: string;
  koef_5: string;
}

export const koeficijentiApi = {
  getAll: async (params?: { radno_mesto?: number }): Promise<TezinskiKoeficijent[]> => {
    const response = await api.get('/tezinski-koeficijenti/', { params });
    return response.data;
  },

  create: async (data: TezinskiKoeficijentPayload): Promise<TezinskiKoeficijent> => {
    const response = await api.post('/tezinski-koeficijenti/', data);
    return response.data;
  },

  update: async (id: number, data: TezinskiKoeficijentPayload): Promise<TezinskiKoeficijent> => {
    const response = await api.put(`/tezinski-koeficijenti/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tezinski-koeficijenti/${id}/`);
  },
};

export const oceneApi = {
  getAll: async (params?: { zaposleni?: number }): Promise<Ocena[]> => {
    const response = await api.get('/ocene/', { params });
    return response.data;
  },

  create: async (data: {
    zaposleni: number;
    datum_Od: string;
    datum_Do: string;
    ocena_1: number;
    ocena_2: number;
    ocena_3: number;
    ocena_4: number;
    ocena_5: number;
  }): Promise<Ocena> => {
    const response = await api.post('/ocene/', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ocene/${id}/`);
  },
};

export const kpiApi = {
  getAll: async (): Promise<KPI[]> => {
    const response = await api.get('/kpi/');
    return response.data;
  },

  create: async (data: { naziv: string; opis?: string; target: string }): Promise<KPI> => {
    const response = await api.post('/kpi/', data);
    return response.data;
  },

  update: async (id: number, data: { naziv?: string; opis?: string; target?: string }): Promise<KPI> => {
    const response = await api.put(`/kpi/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/kpi/${id}/`);
  },
};

export const dodeljeniKpiApi = {
  getAll: async (params?: { korisnik?: number }): Promise<DodeljeniKPI[]> => {
    const response = await api.get('/dodeljeni-kpi/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<DodeljeniKPI> => {
    const response = await api.get(`/dodeljeni-kpi/${id}/`);
    return response.data;
  },

  create: async (data: { kpi: number; korisnici: number[]; datum_Od: string; datum_Do: string }): Promise<{ success: boolean; created: number; skipped: number; message: string; dodeljeni: DodeljeniKPI[] }> => {
    const response = await api.post('/dodeljeni-kpi/', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/dodeljeni-kpi/${id}/`);
  },
};

export const ostvareniKpiApi = {
  getAll: async (params?: { dodeljeni_kpi?: number }): Promise<OstvareniKPI[]> => {
    const response = await api.get('/ostvareni-kpi/', { params });
    return response.data;
  },

  create: async (data: { dodeljeni_kpi: number; ostvarena_vrednost: string; datum: string; opis?: string }): Promise<OstvareniKPI> => {
    const response = await api.post('/ostvareni-kpi/', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ostvareni-kpi/${id}/`);
  },
};

export default api;
