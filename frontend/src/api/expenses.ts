import { api } from './client';
import type { CreateExpensePayload, Expense, ExpenseSplit } from '@/types';

export const expensesApi = {
  list: async (groupId: string): Promise<Expense[]> => {
    const { data } = await api.get<Expense[]>(`/groups/${groupId}/expenses`);
    return data;
  },

  create: async (groupId: string, payload: CreateExpensePayload): Promise<Expense> => {
    const { data } = await api.post<Expense>(`/groups/${groupId}/expenses`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  setSplitPaid: async (splitId: string, isPaid: boolean): Promise<ExpenseSplit> => {
    const { data } = await api.patch<ExpenseSplit>(`/expense-splits/${splitId}`, { isPaid });
    return data;
  },
};
