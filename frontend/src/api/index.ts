import axios from 'axios';
import type { Korisnik, KorisnikFull, KorisnikCreate, KorisnikUpdate } from '../types';

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

export default api;
