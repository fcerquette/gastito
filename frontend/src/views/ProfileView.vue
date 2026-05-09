<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usersApi } from '@/api/users';
import { getErrorMessage } from '@/api/client';
import MemberAvatar from '@/components/MemberAvatar.vue';

const router = useRouter();
const auth = useAuthStore();

const name = ref(auth.currentUser?.name ?? '');
const phone = ref(auth.currentUser?.phone ?? '');
const saving = ref(false);
const savedAt = ref<number | null>(null);
const error = ref<string | null>(null);

watch(
  () => auth.currentUser,
  (u) => {
    if (u) {
      name.value = u.name ?? '';
      phone.value = u.phone ?? '';
    }
  },
);

async function save() {
  saving.value = true;
  error.value = null;
  try {
    const updated = await usersApi.updateMe({
      name: name.value.trim() || undefined,
      phone: phone.value.trim() || undefined,
    });
    auth.setUser(updated);
    savedAt.value = Date.now();
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    saving.value = false;
  }
}

async function logout() {
  await auth.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <div class="gst-stack-lg gst-form" v-if="auth.currentUser">
    <div class="gst-card profile-header">
      <MemberAvatar
        :name="auth.currentUser.name"
        :avatar-url="auth.currentUser.avatarUrl"
        :size="64"
      />
      <div>
        <h2 style="margin: 0">{{ auth.currentUser.name }}</h2>
        <div class="gst-muted">{{ auth.currentUser.email }}</div>
      </div>
    </div>

    <form class="gst-stack" @submit.prevent="save">
      <div v-if="error" class="gst-error">{{ error }}</div>
      <div v-if="savedAt && !error" class="gst-saved">Guardado ✓</div>

      <div class="gst-field">
        <label>Nombre</label>
        <input v-model="name" type="text" maxlength="100" class="text-input" />
      </div>

      <div class="gst-field">
        <label>Teléfono (opcional)</label>
        <input
          v-model="phone"
          type="tel"
          maxlength="40"
          placeholder="+5493415551234"
          class="text-input"
        />
      </div>

      <button type="submit" class="primary-btn" :disabled="saving">
        <i v-if="saving" class="pi pi-spin pi-spinner" />
        <span v-else>Guardar</span>
      </button>
    </form>

    <button class="logout-btn" @click="logout">
      <i class="pi pi-sign-out" /> Cerrar sesión
    </button>

    <section class="coffee-card">
      <div class="coffee-emoji">☕💚</div>
      <h3 style="margin: 0">Hecho con amor</h3>
      <p class="gst-muted" style="margin: 0">
        Si Gastito te sirvió, podés invitarme un café para bancar el proyecto.
        ¡Cualquier monto suma muchísimo!
      </p>
      <a
        class="coffee-btn"
        href="https://link.mercadopago.com.ar/gastito"
        target="_blank"
        rel="noopener noreferrer"
      >
        ☕ Invitame un café
      </a>
      <p class="coffee-foot gst-muted">
        Pago seguro vía Mercado Pago · acepta tarjetas, transferencia y efectivo
      </p>
    </section>
  </div>
</template>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.text-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--gst-border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  font-family: inherit;
}
.text-input:focus {
  outline: none;
  border-color: var(--gst-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.primary-btn {
  background: var(--gst-primary);
  color: white;
  border: none;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.primary-btn:hover:not(:disabled) {
  background: var(--gst-primary-dark);
}
.primary-btn:disabled {
  opacity: 0.6;
}
.logout-btn {
  background: transparent;
  border: 1px solid var(--gst-danger);
  color: var(--gst-danger);
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.logout-btn:hover {
  background: var(--gst-danger);
  color: white;
}
.gst-saved {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
}
.coffee-card {
  margin-top: 1rem;
  padding: 1.25rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #d1fae5 100%);
  border: 1px solid #fde68a;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: center;
}
.coffee-emoji {
  font-size: 2rem;
  line-height: 1;
}
.coffee-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: white;
  color: #92400e;
  border: 2px solid #f59e0b;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.15);
}
.coffee-btn:hover {
  background: #f59e0b;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
}
.coffee-btn:active {
  transform: translateY(0);
}
.coffee-foot {
  font-size: 0.75rem;
  margin: 0;
}
</style>
