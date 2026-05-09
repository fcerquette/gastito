import { api, API_URL } from './client';
import type { User } from '@/types';

export const authApi = {
  /** URL absoluta para el botón de login (debe ser navegación full, no XHR). */
  googleLoginUrl: () => `${API_URL}/auth/google`,

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
