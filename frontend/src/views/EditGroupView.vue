<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';
import { useAuthStore } from '@/stores/auth';
import { groupsApi } from '@/api/groups';
import { expensesApi } from '@/api/expenses';
import { getErrorMessage } from '@/api/client';
import { CURRENCIES, type Currency } from '@/types';

const props = defineProps<{ id: string }>();
const router = useRouter();
const groups = useGroupsStore();
const auth = useAuthStore();

const name = ref('');
const description = ref('');
const defaultCurrency = ref<Currency>('ARS');
const expenseCount = ref<number | null>(null);

const saving = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);

const group = computed(() => groups.current);
const isOwner = computed(() => group.value?.createdById === auth.currentUser?.id);

onMounted(async () => {
  try {
    if (!group.value || group.value.id !== props.id) {
      await groups.fetchOne(props.id);
    }
    if (group.value) {
      name.value = group.value.name;
      description.value = group.value.description ?? '';
      defaultCurrency.value = group.value.defaultCurrency;
    }
    // Cargar count de gastos para advertir antes de borrar
    const exps = await expensesApi.list(props.id);
    expenseCount.value = exps.length;
  } catch (e) {
    error.value = getErrorMessage(e);
  }
});

async function save() {
  if (!isOwner.value) return;
  if (!name.value.trim()) {
    error.value = 'Poné un nombre';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const updated = await groupsApi.update(props.id, {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      defaultCurrency: defaultCurrency.value,
    });
    groups.upsert({ ...group.value!, ...updated });
    router.replace({ name: 'group-detail', params: { id: props.id } });
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!isOwner.value) return;

  let msg = `¿Borrar el grupo "${name.value}"? Esta acción no se puede deshacer.`;
  if (expenseCount.value && expenseCount.value > 0) {
    msg =
      `⚠️ El grupo tiene ${expenseCount.value} ` +
      `${expenseCount.value === 1 ? 'gasto registrado' : 'gastos registrados'}.\n\n` +
      `Si lo borrás, también se van a eliminar TODOS los gastos, splits y pagos. ` +
      `Esta acción no se puede deshacer.\n\n` +
      `¿Continuar?`;
  }
  if (!confirm(msg)) return;

  // Doble confirmación si hay muchos gastos
  if (expenseCount.value && expenseCount.value >= 5) {
    const final = prompt(
      `Para confirmar, escribí el nombre del grupo: "${name.value}"`,
    );
    if (final !== name.value) {
      error.value = 'El nombre no coincide. Cancelado.';
      return;
    }
  }

  deleting.value = true;
  error.value = null;
  try {
    await groupsApi.remove(props.id);
    groups.removeFromList(props.id);
    router.replace({ name: 'groups' });
  } catch (e) {
    error.value = getErrorMessage(e);
    deleting.value = false;
  }
}
</script>

<template>
  <div class="gst-stack-lg gst-form" v-if="group">
    <div v-if="error" class="gst-error">{{ error }}</div>

    <div v-if="!isOwner" class="gst-warning">
      Solo el creador del grupo puede editarlo o borrarlo.
    </div>

    <form class="gst-stack" @submit.prevent="save">
      <div class="gst-field">
        <label>Nombre</label>
        <input
          v-model="name"
          type="text"
          maxlength="80"
          class="text-input"
          :disabled="!isOwner"
        />
      </div>

      <div class="gst-field">
        <label>Descripción</label>
        <textarea
          v-model="description"
          maxlength="300"
          rows="2"
          class="text-input"
          :disabled="!isOwner"
        />
      </div>

      <div class="gst-field">
        <label>Moneda por defecto</label>
        <select v-model="defaultCurrency" class="text-input" :disabled="!isOwner">
          <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <button type="submit" class="primary-btn" :disabled="!isOwner || saving">
        <i v-if="saving" class="pi pi-spin pi-spinner" />
        <span v-else>Guardar cambios</span>
      </button>
    </form>

    <div v-if="isOwner" class="danger-zone">
      <h3 style="margin: 0; color: var(--gst-danger)">Zona peligrosa</h3>
      <p class="gst-muted" style="margin: 0">
        <span v-if="expenseCount === null">Cargando información del grupo…</span>
        <span v-else-if="expenseCount === 0">El grupo no tiene gastos. Se puede borrar sin problemas.</span>
        <span v-else>
          ⚠️ El grupo tiene <strong>{{ expenseCount }}</strong>
          {{ expenseCount === 1 ? 'gasto' : 'gastos' }}. Borrarlo elimina también todos los gastos
          y pagos asociados.
        </span>
      </p>
      <button
        type="button"
        class="danger-btn"
        :disabled="deleting || expenseCount === null"
        @click="remove"
      >
        <i v-if="deleting" class="pi pi-spin pi-spinner" />
        <span v-else><i class="pi pi-trash" /> Borrar grupo</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.text-input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  min-height: 44px;
  border: 1px solid var(--gst-border);
  border-radius: 10px;
  font-size: 16px;
  background: white;
  font-family: inherit;
}
.text-input:focus {
  outline: none;
  border-color: var(--gst-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.text-input:disabled {
  background: var(--gst-bg);
  color: var(--gst-text-muted);
  cursor: not-allowed;
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
  opacity: 0.5;
  cursor: not-allowed;
}
.danger-zone {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff5f5;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.danger-btn {
  background: white;
  color: var(--gst-danger);
  border: 1px solid var(--gst-danger);
  padding: 0.7rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 600;
}
.danger-btn:hover:not(:disabled) {
  background: var(--gst-danger);
  color: white;
}
.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.gst-warning {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}
</style>
