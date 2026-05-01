import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  timeout: 10000,
});

// Injeta o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pokefolio.session');
  if (raw) {
    try {
      const session = JSON.parse(raw);
      if (session.token) config.headers.Authorization = `Bearer ${session.token}`;
    } catch {}
  }
  return config;
});

// Se o access token expirou, tenta refresh automaticamente
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem('pokefolio.session');
        const session = raw ? JSON.parse(raw) : null;
        if (session?.refreshToken) {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/refresh`,
            { refreshToken: session.refreshToken }
          );
          const updated = { ...session, token: data.token, refreshToken: data.refreshToken };
          localStorage.setItem('pokefolio.session', JSON.stringify(updated));
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    plan: string;
    planStatus: string;
  };
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () => api.get('/auth/me'),
};

export default api;
