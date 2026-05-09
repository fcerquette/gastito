<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';
import { getErrorMessage } from '@/api/client';
import GroupCard from '@/components/GroupCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const router = useRouter();
const groups = useGroupsStore();
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    await groups.fetchList();
  } catch (e) {
    error.value = getErrorMessage(e);
  }
});

function open(id: string) {
  router.push({ name: 'group-detail', params: { id } });
}

function newGroup() {
  router.push({ name: 'group-new' });
}
</script>

<template>
  <div class="gst-stack">
    <div v-if="error" class="gst-error">{{ error }}</div>

    <div v-if="groups.loadingList && groups.list.length === 0" class="gst-spinner-wrap">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--gst-primary)" />
    </div>

    <EmptyState
      v-else-if="groups.list.length === 0"
      icon="pi-users"
      title="Todavía no tenés grupos"
      description="Creá tu primer grupo para empezar a dividir gastos."
    >
      <button class="primary-btn" @click="newGroup">
        <i class="pi pi-plus" /> Crear grupo
      </button>
    </EmptyState>

    <template v-else>
      <GroupCard
        v-for="g in groups.list"
        :key="g.id"
        :group="g"
        @click="open(g.id)"
      />
    </template>

    <button v-if="groups.list.length > 0" class="fab" @click="newGroup" aria-label="Nuevo grupo">
      <i class="pi pi-plus" />
    </button>
  </div>
</template>

<style scoped>
.fab {
  position: fixed;
  right: max(1rem, calc((100vw - 600px) / 2 + 1rem));
  bottom: 1.5rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--gst-primary);
  color: white;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.fab:hover {
  background: var(--gst-primary-dark);
}
.primary-btn {
  background: var(--gst-primary);
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.primary-btn:hover {
  background: var(--gst-primary-dark);
}
</style>
