<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import MemberAvatar from './MemberAvatar.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const title = computed(() => {
  switch (route.name) {
    case 'groups':
      return 'Mis grupos';
    case 'group-new':
      return 'Nuevo grupo';
    case 'group-detail':
      return 'Grupo';
    case 'expense-new':
      return 'Nuevo gasto';
    case 'settlement-new':
      return 'Registrar pago';
    case 'profile':
      return 'Perfil';
    default:
      return 'Gastito';
  }
});

const showBack = computed(() => route.name !== 'groups' && route.name !== 'profile');

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push({ name: 'groups' });
}
</script>

<template>
  <div class="shell">
    <header class="shell-top">
      <div class="shell-top-inner">
        <button v-if="showBack" class="icon-btn" aria-label="Volver" @click="goBack">
          <i class="pi pi-arrow-left" />
        </button>
        <div v-else class="brand">
          <span class="brand-emoji">💸</span>
        </div>
        <h1 class="shell-title">{{ title }}</h1>
        <RouterLink :to="{ name: 'profile' }" class="avatar-link" aria-label="Perfil">
          <MemberAvatar :name="auth.currentUser?.name ?? ''" :avatar-url="auth.currentUser?.avatarUrl" :size="34" />
        </RouterLink>
      </div>
    </header>

    <main class="gst-container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.shell-top {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--gst-surface);
  border-bottom: 1px solid var(--gst-border);
}

.shell-top-inner {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.shell-title {
  flex: 1;
  font-size: 1.1rem;
  margin: 0;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.4rem;
  border-radius: 8px;
  color: var(--gst-text);
}

.icon-btn:hover {
  background: var(--gst-bg);
}

.brand-emoji {
  font-size: 1.4rem;
}

.avatar-link {
  display: flex;
  align-items: center;
}
</style>
