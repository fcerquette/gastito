import { defineStore } from 'pinia';
import { groupsApi } from '@/api/groups';
import type { Group } from '@/types';

interface State {
  list: Group[];
  current: Group | null;
  loadingList: boolean;
  loadingCurrent: boolean;
}

export const useGroupsStore = defineStore('groups', {
  state: (): State => ({
    list: [],
    current: null,
    loadingList: false,
    loadingCurrent: false,
  }),

  actions: {
    async fetchList() {
      this.loadingList = true;
      try {
        this.list = await groupsApi.list();
      } finally {
        this.loadingList = false;
      }
    },

    async fetchOne(id: string) {
      this.loadingCurrent = true;
      try {
        this.current = await groupsApi.get(id);
        // mantener la lista en sync
        const idx = this.list.findIndex((g) => g.id === id);
        if (idx >= 0) this.list[idx] = this.current;
        return this.current;
      } finally {
        this.loadingCurrent = false;
      }
    },

    upsert(group: Group) {
      const idx = this.list.findIndex((g) => g.id === group.id);
      if (idx >= 0) this.list[idx] = group;
      else this.list.unshift(group);
      if (this.current?.id === group.id) this.current = group;
    },

    removeFromList(id: string) {
      this.list = this.list.filter((g) => g.id !== id);
      if (this.current?.id === id) this.current = null;
    },

    clearCurrent() {
      this.current = null;
    },
  },
});
