import axios from 'axios';
import type { Korisnik, KorisnikFull, KorisnikCreate, KorisnikUpdate, TipCilja, Cilj, DodeljeniCilj, OrganizacionaJedinica, RadnoMesto} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

  create: async (data: { naziv: string; opis?: string; nadredjena_org_jed?: number }): Promise<OrganizacionaJedinica> => {
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

export default api;
