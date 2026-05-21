<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';
import { settlementsApi } from '@/api/settlements';
import { getErrorMessage } from '@/api/client';
import { CURRENCIES, type Currency } from '@/types';
import { displayName, todayIsoDate } from '@/utils/format';

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();
const groups = useGroupsStore();

const fromMemberId = ref<string>('');
const toMemberId = ref<string>('');
const amount = ref<number | null>(null);
const currency = ref<Currency>('ARS');
const date = ref(todayIsoDate());
const note = ref('');

const submitting = ref(false);
const error = ref<string | null>(null);

const group = computed(() => groups.current);
const members = computed(() => group.value?.members ?? []);

onMounted(async () => {
  if (!group.value || group.value.id !== props.id) {
    try {
      await groups.fetchOne(props.id);
    } catch (e) {
      error.value = getErrorMessage(e);
      return;
    }
  }
  if (group.value) {
    currency.value = (route.query.currency as Currency) || group.value.defaultCurrency;
  }
  fromMemberId.value = (route.query.from as string) || '';
  toMemberId.value = (route.query.to as string) || '';
  if (route.query.amount) {
    const n = parseFloat(route.query.amount as string);
    if (!Number.isNaN(n)) amount.value = n;
  }
});

const canSubmit = computed(
  () =>
    fromMemberId.value &&
    toMemberId.value &&
    fromMemberId.value !== toMemberId.value &&
    (amount.value ?? 0) > 0,
);

async function submit() {
  if (!canSubmit.value || !amount.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await settlementsApi.create(props.id, {
      fromMemberId: fromMemberId.value,
      toMemberId: toMemberId.value,
      amount: amount.value,
      currency: currency.value,
      date: date.value,
      note: note.value.trim() || undefined,
    });
    router.replace({ name: 'group-detail', params: { id: props.id } });
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

    <p class="gst-muted" style="margin: 0">
      Registrá un pago directo entre dos miembros (transferencia, efectivo, etc.). Esto ajusta los
      balances.
    </p>

    <div class="gst-field">
      <label>Quién paga</label>
      <select v-model="fromMemberId" class="text-input">
        <option value="" disabled>Elegir…</option>
        <option v-for="m in members" :key="m.id" :value="m.id">{{ displayName(m) }}</option>
      </select>
    </div>

    <div class="gst-field">
      <label>Quién recibe</label>
      <select v-model="toMemberId" class="text-input">
        <option value="" disabled>Elegir…</option>
        <option
          v-for="m in members"
          :key="m.id"
          :value="m.id"
          :disabled="m.id === fromMemberId"
        >
          {{ displayName(m) }}
        </option>
      </select>
    </div>

    <div class="gst-row" style="gap: 0.5rem">
      <div class="gst-field" style="flex: 2">
        <label>Monto</label>
        <input
          v-model.number="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          class="text-input"
        />
      </div>
      <div class="gst-field" style="flex: 1">
        <label>Moneda</label>
        <select v-model="currency" class="text-input">
          <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
    </div>

    <div class="gst-field">
      <label>Fecha</label>
      <input v-model="date" type="date" class="text-input" />
    </div>

    <div class="gst-field">
      <label>Nota (opcional)</label>
      <input
        v-model="note"
        type="text"
        maxlength="200"
        placeholder="Transferencia por Mercado Pago"
        class="text-input"
      />
    </div>

    <button type="submit" class="primary-btn" :disabled="!canSubmit || submitting">
      <i v-if="submitting" class="pi pi-spin pi-spinner" />
      <span v-else>Registrar pago</span>
    </button>
  </form>
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
