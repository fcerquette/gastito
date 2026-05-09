import { defineStore } from 'pinia';
import { authApi } from '@/api/auth';
import type { User } from '@/types';

interface State {
  currentUser: User | null;
  loading: boolean;
  meAttempted: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    currentUser: null,
    loading: false,
    meAttempted: false,
  }),

  getters: {
    isAuthenticated: (s) => s.currentUser !== null,
  },

  actions: {
    async fetchMe(): Promise<User | null> {
      this.loading = true;
      try {
        const user = await authApi.me();
        this.currentUser = user;
        return user;
      } catch {
        this.currentUser = null;
        return null;
      } finally {
        this.loading = false;
        this.meAttempted = true;
      }
    },

    async logout() {
      try {
        await authApi.logout();
      } catch {
        // ignoramos errores de red en logout, igual reseteamos
      }
      this.currentUser = null;
      this.meAttempted = true;
    },

    setUser(user: User) {
      this.currentUser = user;
    },
  },
});
