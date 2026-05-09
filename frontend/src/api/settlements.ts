import { api } from './client';
import type { CreateSettlementPayload, Settlement } from '@/types';

export const settlementsApi = {
  list: async (groupId: string): Promise<Settlement[]> => {
    const { data } = await api.get<Settlement[]>(`/groups/${groupId}/settlements`);
    return data;
  },

  create: async (groupId: string, payload: CreateSettlementPayload): Promise<Settlement> => {
    const { data } = await api.post<Settlement>(`/groups/${groupId}/settlements`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/settlements/${id}`);
  },
};
