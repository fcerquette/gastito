<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { groupsApi } from '@/api/groups';
import { useGroupsStore } from '@/stores/groups';
import { getErrorMessage } from '@/api/client';
import { CURRENCIES, type Currency } from '@/types';

const router = useRouter();
const groups = useGroupsStore();

const name = ref('');
const description = ref('');
const defaultCurrency = ref<Currency>('ARS');
const members = ref<Array<{ email: string; name: string }>>([]);
const newEmail = ref('');
const newName = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);

function addMember() {
  const email = newEmail.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    error.value = 'Email inválido';
    return;
  }
  if (members.value.some((m) => m.email === email)) {
    error.value = 'Ese email ya está en la lista';
    return;
  }
  members.value.push({ email, name: newName.value.trim() });
  newEmail.value = '';
  newName.value = '';
  error.value = null;
}

function removeMember(idx: number) {
  members.value.splice(idx, 1);
}

async function submit() {
  if (!name.value.trim()) {
    error.value = 'Poné un nombre al grupo';
    return;
  }
  submitting.value = true;
  error.value = null;
  try {
    const created = await groupsApi.create({
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      defaultCurrency: defaultCurrency.value,
      members: members.value.length
        ? members.value.map((m) => ({ email: m.email, name: m.name || undefined }))
        : undefined,
    });
    groups.upsert(created);
    router.replace({ name: 'group-detail', params: { id: created.id } });
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="gst-stack-lg gst-form" @submit.prevent="submit">
    <div v-if="error" class="gst-error">{{ error }}</div>

    <div class="gst-field">
      <label>Nombre del grupo</label>
      <input
        v-model="name"
        type="text"
        maxlength="80"
        placeholder="Ej: Viaje a Bariloche"
        class="text-input"
      />
    </div>

    <div class="gst-field">
      <label>Descripción (opcional)</label>
      <textarea
        v-model="description"
        maxlength="300"
        rows="2"
        placeholder="Finde largo de octubre"
        class="text-input"
      />
    </div>

    <div class="gst-field">
      <label>Moneda por defecto</label>
      <select v-model="defaultCurrency" class="text-input">
        <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div class="gst-stack">
      <h3 style="margin-bottom: 0.25rem">Miembros</h3>
      <p class="gst-muted" style="margin: 0">
        Invitá amigos por email. Si todavía no tienen cuenta, igual van a aparecer en el grupo.
      </p>

      <div class="add-row">
        <input
          v-model="newEmail"
          type="email"
          placeholder="amigo@example.com"
          class="text-input"
        />
        <input
          v-model="newName"
          type="text"
          placeholder="Nombre"
          class="text-input"
          style="max-width: 140px"
        />
        <button type="button" class="add-btn" @click="addMember">
          <i class="pi pi-plus" />
        </button>
      </div>

      <ul v-if="members.length" class="member-list">
        <li v-for="(m, i) in members" :key="m.email">
          <span style="flex: 1">
            <strong>{{ m.name || m.email }}</strong>
            <span v-if="m.name" class="gst-muted"> · {{ m.email }}</span>
          </span>
          <button type="button" class="remove-btn" @click="removeMember(i)" aria-label="Quitar">
            <i class="pi pi-times" />
          </button>
        </li>
      </ul>
    </div>

    <button type="submit" class="primary-btn" :disabled="submitting">
      <i v-if="submitting" class="pi pi-spin pi-spinner" />
      <span v-else>Crear grupo</span>
    </button>
  </form>
</template>

<style scoped>
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
.add-row {
  display: flex;
  gap: 0.4rem;
}
.add-btn {
  background: var(--gst-primary);
  color: white;
  border: none;
  width: 42px;
  border-radius: 8px;
  cursor: pointer;
}
.add-btn:hover {
  background: var(--gst-primary-dark);
}
.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.member-list li {
  display: flex;
  align-items: center;
  background: var(--gst-bg);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}
.remove-btn {
  background: transparent;
  border: none;
  color: var(--gst-text-muted);
  cursor: pointer;
  font-size: 0.95rem;
}
.remove-btn:hover {
  color: var(--gst-danger);
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
  cursor: not-allowed;
}
</style>
