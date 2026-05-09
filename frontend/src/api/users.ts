import { api } from './client';
import type { User, UpdateProfilePayload } from '@/types';

export const usersApi = {
  updateMe: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await api.patch<User>('/users/me', payload);
    return data;
  },
};
