<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Currency, GroupMember, SplitInput, SplitMode } from '@/types';
import { displayName } from '@/utils/format';

const props = defineProps<{
  members: GroupMember[];
  totalAmount: number;
  currency: Currency;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { splitMode: SplitMode; splits: SplitInput[]; valid: boolean }): void;
}>();

const mode = ref<SplitMode>('equal');

// Modo equal: set de groupMemberId seleccionados (default: todos)
const selectedIds = ref<Set<string>>(new Set(props.members.map((m) => m.id)));

// Modo amounts: input por miembro
const amountInputs = ref<Record<string, number>>({});
// Modo percentages: input por miembro
const percentInputs = ref<Record<string, number>>({});

// Inicializar inputs cuando cambian miembros
watch(
  () => props.members.map((m) => m.id).join(','),
  () => {
    selectedIds.value = new Set(props.members.map((m) => m.id));
    amountInputs.value = Object.fromEntries(props.members.map((m) => [m.id, 0]));
    percentInputs.value = Object.fromEntries(props.members.map((m) => [m.id, 0]));
  },
  { immediate: true },
);

function toggle(id: string) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
  // forzar reactividad
  selectedIds.value = new Set(selectedIds.value);
}

const equalShare = computed(() => {
  const n = selectedIds.value.size;
  if (n === 0) return 0;
  return Math.round((props.totalAmount / n) * 100) / 100;
});

const sumAmounts = computed(() =>
  props.members.reduce((acc, m) => acc + (amountInputs.value[m.id] || 0), 0),
);
const sumPercentages = computed(() =>
  props.members.reduce((acc, m) => acc + (percentInputs.value[m.id] || 0), 0),
);

const equalValid = computed(() => selectedIds.value.size > 0);
const amountsValid = computed(() => Math.abs(sumAmounts.value - props.totalAmount) < 0.01);
const percentagesValid = computed(() => Math.abs(sumPercentages.value - 100) < 0.01);

const valid = computed(() => {
  if (mode.value === 'equal') return equalValid.value;
  if (mode.value === 'amounts') return amountsValid.value;
  return percentagesValid.value;
});

const splits = computed<SplitInput[]>(() => {
  if (mode.value === 'equal') {
    return Array.from(selectedIds.value).map((id) => ({ groupMemberId: id }));
  }
  if (mode.value === 'amounts') {
    return props.members
      .filter((m) => (amountInputs.value[m.id] || 0) > 0)
      .map((m) => ({ groupMemberId: m.id, value: amountInputs.value[m.id] }));
  }
  // percentages
  return props.members
    .filter((m) => (percentInputs.value[m.id] || 0) > 0)
    .map((m) => ({ groupMemberId: m.id, value: percentInputs.value[m.id] }));
});

watch(
  [mode, splits, valid],
  () => {
    emit('update', { splitMode: mode.value, splits: splits.value, valid: valid.value });
  },
  { immediate: true, deep: true },
);

function selectAll() {
  selectedIds.value = new Set(props.members.map((m) => m.id));
}
function selectNone() {
  selectedIds.value = new Set();
}
</script>

<template>
  <div class="split-editor gst-stack">
    <div class="mode-tabs">
      <button :class="{ active: mode === 'equal' }" @click="mode = 'equal'">Igual</button>
      <button :class="{ active: mode === 'amounts' }" @click="mode = 'amounts'">Por monto</button>
      <button :class="{ active: mode === 'percentages' }" @click="mode = 'percentages'">%</button>
    </div>

    <!-- EQUAL -->
    <div v-if="mode === 'equal'" class="gst-stack">
      <div class="gst-row-between">
        <span class="gst-muted">{{ selectedIds.size }} de {{ members.length }} seleccionados</span>
        <div class="gst-row" style="gap: 0.5rem">
          <button class="link-btn" @click="selectAll">Todos</button>
          <button class="link-btn" @click="selectNone">Ninguno</button>
        </div>
      </div>
      <ul class="member-list">
        <li v-for="m in members" :key="m.id" @click="toggle(m.id)">
          <input type="checkbox" :checked="selectedIds.has(m.id)" @click.stop="toggle(m.id)" />
          <span style="flex: 1">{{ displayName(m) }}</span>
          <span v-if="selectedIds.has(m.id)" class="gst-muted">{{ equalShare.toFixed(2) }}</span>
        </li>
      </ul>
      <div v-if="!equalValid" class="gst-error">Seleccioná al menos una persona.</div>
    </div>

    <!-- AMOUNTS -->
    <div v-if="mode === 'amounts'" class="gst-stack">
      <ul class="member-list">
        <li v-for="m in members" :key="m.id">
          <span style="flex: 1">{{ displayName(m) }}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            v-model.number="amountInputs[m.id]"
            class="amt-input"
          />
        </li>
      </ul>
      <div :class="amountsValid ? 'gst-muted' : 'gst-error'">
        Suma: {{ sumAmounts.toFixed(2) }} / {{ totalAmount.toFixed(2) }}
        <span v-if="!amountsValid">
          (faltan {{ (totalAmount - sumAmounts).toFixed(2) }})
        </span>
      </div>
    </div>

    <!-- PERCENTAGES -->
    <div v-if="mode === 'percentages'" class="gst-stack">
      <ul class="member-list">
        <li v-for="m in members" :key="m.id">
          <span style="flex: 1">{{ displayName(m) }}</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            v-model.number="percentInputs[m.id]"
            class="amt-input"
          />
          <span class="gst-muted" style="width: 1rem">%</span>
        </li>
      </ul>
      <div :class="percentagesValid ? 'gst-muted' : 'gst-error'">
        Suma: {{ sumPercentages.toFixed(1) }}% / 100%
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-tabs {
  display: flex;
  background: var(--gst-bg);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}
.mode-tabs button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--gst-text-muted);
}
.mode-tabs button.active {
  background: var(--gst-surface);
  color: var(--gst-text);
  font-weight: 600;
  box-shadow: var(--gst-shadow);
}
.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
.member-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--gst-border);
  cursor: pointer;
  user-select: none;
}
.member-list li:last-child {
  border-bottom: none;
}
.amt-input {
  width: 100px;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--gst-border);
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: right;
}
.link-btn {
  background: none;
  border: none;
  color: var(--gst-primary-dark);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
}
</style>
