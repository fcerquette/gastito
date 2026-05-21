<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';
import { useAuthStore } from '@/stores/auth';
import { expensesApi } from '@/api/expenses';
import { getErrorMessage } from '@/api/client';
import { CURRENCIES, type Currency, type SplitInput, type SplitMode } from '@/types';
import SplitEditor from '@/components/SplitEditor.vue';
import { displayName, todayIsoDate } from '@/utils/format';

const props = defineProps<{ id: string }>();
const router = useRouter();
const groups = useGroupsStore();
const auth = useAuthStore();

const description = ref('');
const amount = ref<number | null>(null);
const currency = ref<Currency>('ARS');
const date = ref(todayIsoDate());
const paidByMemberId = ref<string>('');

const splitMode = ref<SplitMode>('equal');
const splits = ref<SplitInput[]>([]);
const splitsValid = ref(false);

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
    currency.value = group.value.defaultCurrency;
    // Default: el GroupMember del usuario actual
    const myMember = group.value.members?.find((m) => m.userId === auth.currentUser?.id);
    paidByMemberId.value = myMember?.id ?? '';
  }
});

function onSplitsUpdate(payload: { splitMode: SplitMode; splits: SplitInput[]; valid: boolean }) {
  splitMode.value = payload.splitMode;
  splits.value = payload.splits;
  splitsValid.value = payload.valid;
}

const canSubmit = computed(() => {
  return (
    description.value.trim().length > 0 &&
    (amount.value ?? 0) > 0 &&
    paidByMemberId.value &&
    splitsValid.value &&
    splits.value.length > 0
  );
});

async function submit() {
  if (!canSubmit.value || !amount.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await expensesApi.create(props.id, {
      description: description.value.trim(),
      amount: amount.value,
      currency: currency.value,
      paidByMemberId: paidByMemberId.value,
      date: date.value,
      splitMode: splitMode.value,
      splits: splits.value,
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

    <div class="gst-field">
      <label>Descripción</label>
      <input
        v-model="description"
        type="text"
        maxlength="200"
        placeholder="Cena del viernes"
        class="text-input"
      />
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

    <div class="gst-row" style="gap: 0.5rem">
      <div class="gst-field" style="flex: 1">
        <label>Pagó</label>
        <select v-model="paidByMemberId" class="text-input">
          <option value="" disabled>Elegir…</option>
          <option v-for="m in members" :key="m.id" :value="m.id">
            {{ m.userId === auth.currentUser?.id ? `Vos (${displayName(m)})` : displayName(m) }}
          </option>
        </select>
      </div>
      <div class="gst-field" style="flex: 1">
        <label>Fecha</label>
        <input v-model="date" type="date" class="text-input" />
      </div>
    </div>

    <div class="gst-field">
      <label>Cómo se divide</label>
      <SplitEditor
        :members="members"
        :total-amount="amount ?? 0"
        :currency="currency"
        @update="onSplitsUpdate"
      />
    </div>

    <button type="submit" class="primary-btn" :disabled="!canSubmit || submitting">
      <i v-if="submitting" class="pi pi-spin pi-spinner" />
      <span v-else>Guardar gasto</span>
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
