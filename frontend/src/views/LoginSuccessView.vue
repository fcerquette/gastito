<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  const user = await auth.fetchMe();
  if (user) {
    router.replace({ name: 'groups' });
  } else {
    router.replace({ name: 'login' });
  }
});
</script>

<template>
  <div class="loading-page">
    <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--gst-primary)" />
    <p class="gst-muted" style="margin-top: 1rem">Iniciando sesión…</p>
  </div>
</template>

<style scoped>
.loading-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
