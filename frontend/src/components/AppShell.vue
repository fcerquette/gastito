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
    case 'group-edit':
      return 'Editar grupo';
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
  /* Asegura que el fondo se vea hasta abajo (importante en iPhone landscape) */
  min-height: 100dvh;
}

.shell-top {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--gst-surface);
  border-bottom: 1px solid var(--gst-border);
  /* Empuja el header debajo del notch del iPhone */
  padding-top: var(--safe-top);
}

.shell-top-inner {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  padding-left: max(var(--gst-pad-x), var(--safe-left));
  padding-right: max(var(--gst-pad-x), var(--safe-right));
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
  /* Touch target mínimo de 44x44 (Apple HIG / Material) */
  min-width: 44px;
  min-height: 44px;
  padding: 0.4rem;
  border-radius: 8px;
  color: var(--gst-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--gst-bg);
}

.brand-emoji {
  font-size: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.avatar-link {
  display: flex;
  align-items: center;
  /* También touch-target cómodo */
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
}
</style>
