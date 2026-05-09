import { api } from './client';
import type {
  AddMemberPayload,
  CreateGroupPayload,
  Group,
  GroupMember,
  UpdateGroupPayload,
} from '@/types';

export const groupsApi = {
  list: async (): Promise<Group[]> => {
    const { data } = await api.get<Group[]>('/groups');
    return data;
  },

  get: async (id: string): Promise<Group> => {
    const { data } = await api.get<Group>(`/groups/${id}`);
    return data;
  },

  create: async (payload: CreateGroupPayload): Promise<Group> => {
    const { data } = await api.post<Group>('/groups', payload);
    return data;
  },

  update: async (id: string, payload: UpdateGroupPayload): Promise<Group> => {
    const { data } = await api.patch<Group>(`/groups/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  addMember: async (id: string, payload: AddMemberPayload): Promise<GroupMember> => {
    const { data } = await api.post<GroupMember>(`/groups/${id}/members`, payload);
    return data;
  },

  removeMember: async (id: string, memberId: string): Promise<void> => {
    await api.delete(`/groups/${id}/members/${memberId}`);
  },
};
