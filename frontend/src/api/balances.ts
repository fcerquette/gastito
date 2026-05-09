import { api } from './client';
import type { CurrencyBalance } from '@/types';

export const balancesApi = {
  get: async (groupId: string): Promise<CurrencyBalance[]> => {
    const { data } = await api.get<CurrencyBalance[]>(`/groups/${groupId}/balances`);
    return data;
  },
};
